bitwallet_controllers
.controller('DepositCtrl', function($translate, T, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, Setting) {
  
  // python send_btc.py BzxyUCprnJWYXmQ6gGwREFPboTxhU1JB3E CCDVYmCptt5b3HnxPwHgdKZ8zXEywMB1Rb 0.05 yes
  // bitcoin://CCDVYmCptt5b3HnxPwHgdKZ8zXEywMB1Rb?amount=0.10000000?label=bitwallet_deposit?message=convert_btc_to_bitasset
  
  $scope.data = {
        input_amount      : 0, 
        input_curr        : 'BTC', 
        input_in_btc      : true,

        amount_usd:         undefined,
        amount_btc:         undefined,
        quoting_usd:        false,
        quoting_btc:        false,
        quoting_btc_error:  undefined,
        quoting_usd_error:  undefined,

        step:               1, // HACK UI: PONELE 2 y ves la pantalla del qr
        timer:              {options:{}, remaining:undefined, percent:undefined, start:0, stop:0, expired:0, waiting:0},
        
        deposit_uri:        undefined,
        deposit_qrcode:     undefined,
        deposit_short_uri:  undefined,  
        
        quote:              undefined,
        quote_timestamp:    0, 
        signature:          undefined,
        tx:                 undefined,

        from_in_progress:   false
  }
  
  // HACK UI: for testing
  $scope.data.tx              = {cl_pay:22.15, cl_pay_addr: 'Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi'}
  $scope.data.deposit_uri     = 'bitcoin://Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi?amount=22.15&label=bitwallet_deposit&message=convert_btc_to_bitasset';
  $scope.data.deposit_qrcode    = 'http://zxing.org/w/chart?chs=300x300&cht=qr&choe=UTF-8&chld=L|1&chl=7'+encodeURIComponent($scope.data.deposit_uri);

  
  $scope.toggleInputCurrency = function(){
    $scope.data.input_in_btc = $scope.data.input_in_btc?false:true;
    $scope.data.input_amount=0;
    if($scope.data.input_in_btc==false){
      $scope.data.input_curr='USD';
    }
    else{
      $scope.data.input_curr='BTC';
    }
    console.log('$scope.data.input_curr: '+$scope.data.input_curr);
  }

  // Disable and enable form handlers
  // $scope.data   = {from_in_progress:false};

  $scope.formInProgress = function(){
    $scope.data.from_in_progress = true;
    console.log(' -- DepositCtrl Form DISABLED');
  }

  $scope.formDone = function(){
    $scope.data.from_in_progress = false; 
    console.log(' -- DepositCtrl Form ENABLED!!!!');
  }

  $scope.default_data = {};
  angular.copy($scope.data, $scope.default_data);
  
  $scope.quote_data = { 'quote_curr'     : $scope.wallet.asset.x_symbol+'_BTC'
                        , 'quote_btc'    : 'BTC_'+$scope.wallet.asset.x_symbol};
  
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
      // Quote current request
      BitShares.getBuyQuote($scope.quote_data.quote_curr, $scope.data.amount_usd).then(function(res){
        $scope.data.amount_btc      = Number(res.quote.cl_pay);
        $scope.data.quote           = res.quote;
        // Set quote timestamp locally. It's not estrict.
        $scope.data.quote_timestamp = parseInt((new Date()).getTime()); 
        $scope.data.signature       = res.signature;
        $timeout(function () {
          $scope.data.quoting_btc   = false;
        } , 10);
        //console.log(res);
      }, function(error){
        //$scope.stopTimer();
        $scope.data.quoting_btc     = false;
        $scope.setMessageErr('BTC', error);
        //console.log(error);
        $scope.data.quote           = undefined;
        $scope.data.signature       = undefined;
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
      BitShares.getSellQuote($scope.quote_data.quote_btc, $scope.data.amount_btc).then(function(res){
        $scope.data.amount_usd  = Number(res.quote.cl_recv);
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_usd = false;
        } , 10);
        //console.log(res);
      }, function(error){
        //$scope.stopTimer();
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
  
  $scope.showLoading = function(message){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + T.i(message),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.showAlert = function(title, message){
    $ionicPopup.alert({
       title    : T.i(title) + ' <i class="fa fa-warning float_right"></i>',
       template : T.i(message),
       okType   : 'button-assertive', 
     });
  }
  
  $scope.next = function(){

    // HACK
    $scope.data.step=2;
    return;

    if(!$scope.data.signature || !$scope.data.quote)
    {
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      return;
    }

    // Disable Form
    $scope.formInProgress();

    $scope.showLoading('g.accept_tx_process');
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data.quote, $scope.data.signature, token, addy.address, BitShares.X_DEPOSIT).then(function(result){
        
        console.log('BitShares.acceptQuote:'+JSON.stringify(result));
        
        $scope.data.tx                = result.tx;
        $scope.data.deposit_short_uri = 'bitcoin://'+$scope.data.tx.cl_pay_addr+'?amount='+$scope.data.tx.cl_pay;
        $scope.data.deposit_uri       = $scope.data.deposit_short_uri+'&label=bitwallet_deposit&message=convert_btc_to_bitasset';
        //$scope.data.deposit_qrcode    = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.data.deposit_uri)+'&chld=H|0'
        $scope.data.deposit_qrcode    = 'http://zxing.org/w/chart?chs=300x300&cht=qr&choe=UTF-8&chld=L|1&chl=7'+encodeURIComponent($scope.data.deposit_uri);
        $scope.data.step = 2;
        
        Wallet.onNewXTx($scope.data.tx);
        
        $scope.alreadyPaid();

        $scope.hideLoading();

        // Enable form
        $scope.formDone();
      }, function(error){
        if(error=='auth_failed')
          Setting.remove(Setting.BSW_TOKEN);
        $scope.hideLoading();
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        // Enable form
        $scope.formDone();
      });
    }, function(error){
      $scope.hideLoading();
      console.log(error);
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      // Enable form
      $scope.formDone();
    });
    
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
  
  $scope.alreadyPaid = function(){
    
    // Disable Form
    $scope.formInProgress();

    $scope.startWaitingPayment();
    
    // 1.- Lanza un timer de 5 minutos para espera.
    // 2.- Se pone a esperar la txid.
    // 3.- Si llega, redirect a home + toast
    // 4.- Si no llega, toast e indicamos que si luego llega se vera en home.
  }
  
  $scope.nanobar = undefined;
  var w_ttl = 300;
  var w_counter_timeout = w_ttl;
  
  $scope.startWaitingPayment = function() {
    if($scope.nanobar===undefined)
    {
      var options3 = {
        target: document.getElementById('quote_ttl'),
        id: 'mynano3',
        bg: '#5abb5c'
      };
      $scope.nanobar = new Nanobar( options3 );
    }
    $scope.data.timer.waiting = 1;
    $timeout($scope.onWaitingPayment, 1000);
  };
  
  $scope.stopWaitingPayment = function() {
    w_counter_timeout = 0;
    if($scope.nanobar)
      $timeout(function(){
          $scope.nanobar.go(0);
        }, 1000);
    // Enable Form
    $scope.formDone();
  }
  
  $scope.onWaitingPayment = function() {
    
    w_counter_timeout = w_counter_timeout - 1;
    if(w_counter_timeout<=0)
    {
      $scope.stopWaitingPayment();
      $scope.nanobar.go(100);
      $scope.data.timer.waiting = 0;
      return;
    }
    $scope.nanobar.go((w_ttl-w_counter_timeout)*100/w_ttl);
    $timeout($scope.onWaitingPayment, 1000);
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.getExchangeTx(token, $scope.data.tx.id).then(function(xtx){
        //var my_xtx = Wallet.processXTx(xtx);
        //console.log('DepositCtrl::WatingTx: ui_type='+xtx.ui_type);
        if(BitShares.isXtxPartiallyOrFullyPaid(xtx))
        {
          $scope.stopWaitingPayment();
          window.plugins.toast.show(T.i('deposit.deposit_successful'), 'long', 'bottom');
          Wallet.onNewXTxAndLoad(xtx);
          $scope.goHome();
        }
      }, function(error){
      
      })
    }, function(error){
    
    });
    
  }
  
  $scope.$on( '$ionicView.beforeLeave', function(){
    // Destroy timers
    console.log('DepositCtrl.ionicView.beforeLeave killing timers.');
    //w_counter_timeout=0;
    $scope.stopWaitingPayment();
  });
})

