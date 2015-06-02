bitwallet_controllers
.controller('DepositCtrl', function($translate, T, ExchangeTransaction, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, Setting) {
  
  // HACK UI: for testing
  //$scope.data.tx              = {cl_pay:22.15, cl_pay_addr: 'Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi'}
  //$scope.data.deposit_uri     = 'bitcoin://Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi?amount=22.15&label=bitwallet_deposit&message=convert_btc_to_bitasset';
  //$scope.data.deposit_qrcode    = 'http://zxing.org/w/chart?chs=300x300&cht=qr&choe=UTF-8&chld=L|1&chl=7'+encodeURIComponent($scope.data.deposit_uri);
  // python send_btc.py BzxyUCprnJWYXmQ6gGwREFPboTxhU1JB3E CCDVYmCptt5b3HnxPwHgdKZ8zXEywMB1Rb 0.05 yes
  // bitcoin://CCDVYmCptt5b3HnxPwHgdKZ8zXEywMB1Rb?amount=0.10000000?label=bitwallet_deposit?message=convert_btc_to_bitasset
  // HACK UI : PONELE 2 y ves la pantalla del qr 
  
  $scope.data = {
    from_in_progress : false,
    valid_quote      : false,
    quoting          : false,
    input_timeout    : undefined,
    input_in_btc     : false,
    input_amount     : undefined,
    input_curr       : 'USD',
    other_amount     : undefined,
    other_curr       : 'BTC',
    step             : 1,
    timer:           { 
      options   : {},
      remaining : undefined,
      percent   : undefined,
      start     : 0,
      stop      : 0,
      expired   : 0,
      waiting   : 0
    }
  }
  
  $scope.toggleInputCurrency = function(){
    $scope.data.input_in_btc = !$scope.data.input_in_btc;

    $scope.data.input_amount = undefined;
    $scope.data.input_curr   = !$scope.data.input_in_btc ? Wallet.data.asset.symbol : 'BTC';

    $scope.data.other_curr   = !$scope.data.input_in_btc ? 'BTC' : Wallet.data.asset.symbol;
    $scope.data.other_amount = undefined;
  }

  $scope.formInProgress = function(){
    $scope.data.from_in_progress = true;
    console.log(' -- DepositCtrl Form DISABLED');
  }

  $scope.formDone = function(){
    $scope.data.from_in_progress = false; 
    console.log(' -- DepositCtrl Form ENABLED!!!!');
  }

  //$scope.default_data = {};
  //angular.copy($scope.data, $scope.default_data);
  
  //$scope.quote_data = { 'quote_curr'     : $scope.wallet.asset.x_symbol+'_BTC'
                        //, 'quote_btc'    : 'BTC_'+$scope.wallet.asset.x_symbol};
  
  //$scope.usd_timeout = undefined;
  $scope.$watch('data.input_amount', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    //$scope.clearErrors();
    $scope.data.valid_quote  = false;
    $scope.data.other_amount = undefined;

    $timeout.cancel($scope.input_timeout);

    if(!$scope.data.input_amount) {
      $scope.data.quoting = false;
      return;
    }

    $scope.data.quoting = true;

    $scope.input_timeout = $timeout(function () {

      var prom;
      if ( $scope.data.input_in_btc ) {
        prom = BitShares.getQuote('sell', $scope.data.input_amount, 'BTC', Wallet.data.asset.name);
      } else {
        prom = BitShares.getQuote('buy', $scope.data.input_amount, Wallet.data.asset.name, 'BTC');
      }

      prom.then(function(res){

        $scope.data.other_amount    = $scope.data.input_in_btc ? Number(res.quote.cl_recv) : Number(res.quote.cl_pay);
        $scope.data.quote           = res;
        $scope.data.quote_timestamp = parseInt((new Date()).getTime());
        $scope.data.valid_quote     = true;
        $scope.data.quoting         = false;
      }, function(err){
        console.log(err);
        $scope.data.quoting = false;
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
        
        
  //$scope.clearErrors = function(){
    //$scope.data.quoting_btc_error = undefined;
    //$scope.data.quoting_usd_error = undefined;
  //};
  
  $scope.showLoading = function(message){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android"></ion-spinner> ' + T.i(message),
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
       title    : T.i(title),
       template : T.i(message),
       okType   : 'button-assertive', 
     });
  }

  $scope.next = function() {

    if ( !$scope.data.valid_quote ) {
      return;
    }

    var keys = Wallet.getAccountAccessKeys();

    BitShares.acceptQuote(
      $scope.data.quote.quote, 
      $scope.data.quote.signature, 
      keys, 
      Wallet.data.account.address,
      'deposit'
    ).then(function(xtx) {
      ExchangeTransaction.add(xtx.tx).then(function(res) {

        var uri = 'bitcoin://'+ xtx.tx.cl_pay_addr +'?amount='+ xtx.tx.cl_pay +'&label=Lime%20Deposit&message=Deposit%20'+xtx.tx.cl_recv+' '+xtx.tx.cl_recv_curr;
        var qrcode = new QRCode(document.getElementById("deposit_qrcode"), {
          text         : uri,
          width        : 256,
          height       : 256,
          colorDark    : "#000000",
          colorLight   : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });

        $scope.data.step=2;
        Wallet.loadBalance();

      }, function(err) {
        console.log(err);
      });

    }, function(err) {
      console.log(err);
    });

  }
  
  $scope.next_2 = function(){

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

