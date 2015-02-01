bitwallet_controllers
.controller('DepositCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares) {
  
  $scope.data = {
        amount_usd:         undefined,
        amount_btc:         undefined,
        quoting_usd:        false,
        quoting_btc:        false,
        quoting_btc_error:  undefined,
        quoting_usd_error:  undefined,

        step:               1,
        timer:              {options:{}, remaining:undefined, percent:undefined, start:0, stop:0, expired:0},
        //quote_expired:      false,
        
        deposit_uri:        undefined,
        deposit_qrcode:     undefined,
        deposit_short_uri:  undefined,  
        
        quote:              undefined,
        signature:          undefined,
        tx:                 undefined,
        
        quote_ttl:          60,
        
        active_tab:         1
  }
  
  $scope.default_data = {};
  angular.copy($scope.data, $scope.default_data);
  
  var usd_timeout = undefined;
  $scope.$watch('data.amount_usd', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    $scope.clearErrors();
    if(usd_timeout)
    {
      $timeout.cancel(usd_timeout);
      usd_timeout = undefined;
      $scope.data.quoting_btc = false;
    }
    console.log('$scope.data.quoting_usd:'+$scope.data.quoting_usd);
    if($scope.data.quoting_usd)
      return;
    usd_timeout = $timeout(function () {
      $scope.data.quoting_btc = true;
      $scope.data.amount_btc = undefined;
      // llamo a quotear
      BitShares.getBuyQuote('USD', $scope.data.amount_usd).then(function(res){
        $scope.data.amount_btc = Number(res.quote.client_pay.replace(' BTC', ''));
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_btc = false;
          $scope.doStartTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        $scope.doStopTimer();
        $scope.data.quoting_btc       = false;
        $scope.setMessageErr('BTC', error);
        //console.log(error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
      });
    }, 750);
  });
  
  var btc_timeout = undefined;
  $scope.$watch('data.amount_btc', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    $scope.clearErrors();
    if(btc_timeout)
    {
      $timeout.cancel(btc_timeout);
      btc_timeout = undefined;
      $scope.data.quoting_usd = false;
    }
    console.log('$scope.data.quoting_btc:'+$scope.data.quoting_btc);
    if($scope.data.quoting_btc)
      return;
    btc_timeout = $timeout(function () {
      $scope.data.quoting_usd = true;
      $scope.data.amount_usd = undefined;
      // llamo a quotear
      BitShares.getSellQuote('BTC', $scope.data.amount_btc).then(function(res){
        $scope.data.amount_usd  = Number(res.quote.client_recv.replace(' USD', ''));
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_usd = false;
          $scope.doStartTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        $scope.doStopTimer();
        $scope.data.quoting_usd       = false;
        $scope.setMessageErr('USD', error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
        //console.log(error);
      });
    }, 750);
  });
  
  $scope.setMessageErr = function(asset, error){
    var message = error;
    var errors = ['max_op', 'min_op'];
    if(errors.indexOf(error)>=0)
      message = T.i('err.'+error, {amount:(error=='max_op'?'50.0 USD':'0.50 USD')});
    if(asset=='USD')
      $scope.data.quoting_usd_error = message;
    else
      $scope.data.quoting_btc_error = message;
  };
        
        
  $scope.clearErrors = function(){
    $scope.data.quoting_btc_error = undefined;
    $scope.data.quoting_usd_error = undefined;
  };
  // $scope.showLoading = function(){
    // $ionicLoading.show({
      // template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      // animation    : 'fade-in',
      // showBackdrop : true,
      // maxWidth     : 200,
      // showDelay    : 10
    // }); 
  // }

  // $scope.hideLoading = function(){
    // $ionicLoading.hide();
  // }
  
  $scope.remainingTime = function(){
    var d = new Date();
    var n = parseInt(d.getTime()/1000);
    if(!$scope.data.quote.timestamp)
      return 0;
    //console.log('['+$scope.data.quote.timestamp+'] + ['+$scope.data.quote_ttl+'] - ['+n+'] = '+($scope.data.quote.timestamp+$scope.data.quote_ttl-n));
    return parseInt($scope.data.quote.timestamp)+$scope.data.quote_ttl-n;
    
  }
  
  $scope.showAlert = function(title, message){
    $ionicPopup.alert({
       title    : T.i(title) + ' <i class="fa fa-warning float_right"></i>',
       template : T.i(message),
       okType   : 'button-assertive', 
     });
  }
  
  $scope.next = function(){
    
    if(!$scope.data.signature || !$scope.data.quote)
    {
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      return;
    }
    
    if($scope.remainingTime()<=0)
    {
      $scope.showAlert('err.quote_expired', 'err.quote_expired_retry');
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data.quote, $scope.data.signature, token, addy.address).then(function(result){
        
        console.log('BitShares.acceptQuote:'+JSON.stringify(result));
        
        $scope.data.tx                = result.tx;
        $scope.data.deposit_short_uri = 'bitcoin:'+$scope.data.tx.cl_pay_addr+'?amount='+$scope.data.tx.cl_pay;
        $scope.data.deposit_uri       = $scope.data.deposit_short_uri+'?label=bitwallet_deposit?message=convert_bts_to_bitUSD';
        $scope.data.deposit_qrcode    = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.data.deposit_uri)+'&chld=H|0'
        //$scope.startTimer();
        $scope.data.step = 2;
        
        
      }, function(error){
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        return;
      });
    }, function(error){
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      return;
    });
    
  }
  
  // var counter_timeout = undefined; // the current timeoutID
  // // actual timer method, counts down every second, stops on zero
  // $scope.onTimeout = function() {
      // var seconds = $scope.remainingTime(); 
      // if(seconds<=0) {
          // $scope.$broadcast('timer-stopped', 0);
          // return;
      // }
      // $scope.data.timer = moment.duration(seconds, "seconds").format("mm:ss", { trim: false });
      // counter_timeout = $timeout($scope.onTimeout, 1000);
  // };
  // $scope.startTimer = function() {
      // counter_timeout = $timeout($scope.onTimeout, 1000);
  // };
  // // stops and resets the current timer
  // $scope.stopTimer = function() {
      // $scope.$broadcast('timer-stopped', 0);
      // //$scope.counter = 30;
      // $timeout.cancel(counter_timeout);
  // };
  // // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
  // $scope.$on('timer-stopped', function(event, remaining) {
    // if(remaining === 0) {
      // console.log('your time ran out!');
    // }
    // $scope.data.quote_expired = true;
    // $timeout.cancel(counter_timeout);
    
    // $timeout(function(){
      // var expiredPopup = $ionicPopup.alert({
         // title    : T.i('err.quote_expired'),
         // template : T.i('err.quote_expired_retry'),
       // });
       // expiredPopup.then(function(res) {
          // $scope.requote();
       // });
    // }, 250);
    
  // });
  
  $scope.doStopTimer = function(){
    $scope.data.timer.start=0;
    $scope.data.timer.stop=1;
  }
  
  $scope.doStartTimer = function(){
    $scope.doStopTimer();
    
    $scope.data.timer.remaining = undefined;
    $scope.data.timer.options   =  {
        //barColor: '#ef1e25',
        //trackColor: '#f9f9f9',
        scaleColor: '#dfe0e0',
        scaleLength: 5,
        //lineCap: 'round',
        //lineWidth: 3,
        size: 50,
        rotate: 0,
        animate:{
					duration:$scope.remainingTime()*1000,
					enabled:true
				},
        trackColor:'#01bbf4', //'#66cc33', //#498f24
				barColor:'#ffffff',
				scaleColor:'#dfe0e0'  ,//'#dfe0e0','#E67E22',
				lineWidth:18,
				lineCap:'circle',
        onStep: function(from, to, currentValue){
          //console.log('onStep: '+from +'-'+ to +'-'+ currentValue);
          //if(from!=to)
          //  $scope.parcont = (100-parseInt(currentValue));
        },
        onStop: function(from, to){
          console.log('onStop: '+from +'-'+ to);
          $scope.data.timer.expired =1;
        }
			};
      
      $scope.data.timer.expired = 0;
      $scope.data.timer.percent = 100;
      $timeout(
        function(){
          $scope.data.timer.start=1;
          $scope.data.timer.stop=0;
        }
        , 200);
  
  }

  $scope.copyUri = function(){
    $cordovaClipboard
      .copy($scope.data.deposit_uri)
      .then(function () {
        //success
        window.plugins.toast.show(T.i('deposit.uri_copied'), 'short', 'bottom');
      }, function () {
        //error
        window.plugins.toast.show(T.i('err.unable_to_copy_uri'), 'short', 'bottom');
      });
  }
  
  $scope.requote = function(){
    angular.copy($scope.default_data, $scope.data);
  }
})

