bitwallet_controllers
.controller('DepositCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares) {
  
  $scope.data = {
        amount_usd:         undefined,
        amount_btc:         undefined,
        quoting_usd:        false,
        quoting_btc:        false,
        step:               1,
        quote_expired:      false,
        
        deposit_uri:        undefined,
        deposit_qrcode:     undefined,
        deposit_short_uri:  undefined,  
        quote:              undefined,
        signature:          undefined,
        tx:                 undefined,
        
        timer:              undefined,
        quote_ttl:          60,
        
        active_tab:         1
  }
  
  var usd_timeout = undefined;
  $scope.$watch('data.amount_usd', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
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
        } , 150);
        console.log(res);
      }, function(error){
        $scope.data.quoting_btc = false;
        console.log(error);
        $scope.data.quote       = undefined;
        $scope.data.signature   = undefined;
      });
    }, 750);
  });
  
  var btc_timeout = undefined;
  $scope.$watch('data.amount_btc', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
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
        } , 150);
        console.log(res);
      }, function(error){
        $scope.data.quoting_usd = false;
        $scope.data.quote       = undefined;
        $scope.data.signature   = undefined;
        console.log(error);
      });
    }, 750);
  });
  
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
    console.log('['+$scope.data.quote.timestamp+'] + ['+$scope.data.quote_ttl+'] - ['+n+'] = '+($scope.data.quote.timestamp+$scope.data.quote_ttl-n));
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
    
    if($scope.remainingTime()<0)
    {
      $scope.showAlert('err.quote_expired', 'err.quote_expired_retry');
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data.quote, $scope.data.signature, token, addy).then(function(result){
        
        console.log('BitShares.acceptQuote:'+JSON.stringify(result));
        
        $scope.data.tx                = result.tx;
        $scope.data.deposit_short_uri = 'bitcoin:'+$scope.data.tx.cl_pay_addr+'?amount='+$scope.data.tx.cl_pay;
        $scope.data.deposit_uri       = $scope.data.deposit_short_uri+'?label=bitwallet_deposit?message=convert_bts_to_bitUSD';
        $scope.data.deposit_qrcode    = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.data.deposit_uri)+'&chld=H|0'
        $scope.startTimer();
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
  
  var counter_timeout = undefined; // the current timeoutID
 
  // actual timer method, counts down every second, stops on zero
  $scope.onTimeout = function() {
      var seconds = $scope.remainingTime(); 
      if(seconds<0) {
          $scope.$broadcast('timer-stopped', 0);
          return;
      }
      $scope.data.timer = moment.duration(seconds, "seconds").format("mm:ss", { trim: false });
      counter_timeout = $timeout($scope.onTimeout, 1000);
  };

  $scope.startTimer = function() {
      counter_timeout = $timeout($scope.onTimeout, 1000);
  };

  // stops and resets the current timer
  $scope.stopTimer = function() {
      $scope.$broadcast('timer-stopped', 0);
      //$scope.counter = 30;
      $timeout.cancel(counter_timeout);
  };

  // triggered, when the timer stops, you can do something here, maybe show a visual indicator or vibrate the device
  $scope.$on('timer-stopped', function(event, remaining) {
      if(remaining === 0) {
        console.log('your time ran out!');
      }
      $scope.data.quote_expired = true;
      $timeout.cancel(counter_timeout);
  });
  
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
})

