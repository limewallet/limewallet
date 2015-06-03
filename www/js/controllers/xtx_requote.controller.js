bitwallet_controllers
.controller('XtxRequoteCtrl', function($stateParams, $translate, T, Account, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, ExchangeTransaction) {

$scope.data = {   xtx           : undefined, 
                  xtx_id        : undefined,
                  amount_btc    : 0,
                  amount_asset  : 0,
                  rate          : 0,
                  quote         : undefined,
                  signature     : undefined,
                  pay_curr      : '',
                  recv_curr     : '',
                  show_inverse_rate : false }
                  
  if (angular.isUndefined($stateParams.xtx_id))
  {
    $scope.goHome();
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  }

  $scope.data.xtx_id = $stateParams.xtx_id;
  console.log(' --- XtxRequoteCtrl for: ' + $scope.data.xtx_id.toString());
  ExchangeTransaction.byXIdEx($scope.data.xtx_id).then(function(res){
      $scope.data.xtx    = res;
      $timeout(function(){
        //$scope.doReQuote(); HACK O
      }, 10);
  }, function(err){
    $scope.goHome();
    console.log('XtxRequoteCtrl db error:' + JSON.stringify(err));
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  });
  
  
  $scope.showLoading = function(text_to_translate){
    $ionicLoading.show({
      //template     : '<i class="icon ion-looping"></i> ' + T.i(text_to_translate),
      template     : '<ion-spinner icon="android"></ion-spinner> ' + T.i(text_to_translate),
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

  $scope.doReQuote = function(){
    
    $scope.showLoading('rate_changed.getting_quote');
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.getReQuote(token, $scope.data.xtx_id).then(function(res){
        $scope.hideLoading();
        var cl_cmd                  = res.quote.cl_cmd.split(' ');
        //sell 4.09200000 bitUSD BTC
        if(cl_cmd[2]!='BTC')
        {
          $scope.data.rate            = Number(1/Number(res.quote.rate));
          $scope.data.inverse_rate    = Number(res.quote.rate);
        }
        else
        {  
          $scope.data.rate            = Number(res.quote.rate);
          $scope.data.inverse_rate    = Number(1/Number(res.quote.rate));
        }
        $scope.data.amount_asset    = (res.cl_pay_curr=='BTC')?Number(res.quote.cl_pay):Number(res.quote.cl_recv);
        $scope.data.amount_btc      = (res.cl_pay_curr=='BTC')?Number(res.quote.cl_recv):Number(res.quote.cl_pay);
        $scope.data.quote           = res.quote;
        $scope.data.signature       = res.signature;
        $scope.data.pay_curr        = (res.cl_pay_curr=='BTC')?'BTC':$scope.wallet.asset.symbol;
        $scope.data.recv_curr       = (res.cl_pay_curr=='BTC')?$scope.wallet.asset.symbol:'BTC';
      }, function(error){
        console.log(' --- XtxRequoteCtrl error ' + JSON.stringify(error));
        $scope.hideLoading();
        $scope.data.quote           = undefined;
        $scope.data.signature       = undefined;
        window.plugins.toast.show( T.i(error.error), 'long', 'bottom');
      })
    }, function(error){
        console.log(' --- XtxRequoteCtrl cant get token ' + JSON.stringify(error));
        $scope.hideLoading();
        $scope.data.quote           = undefined;
        $scope.data.signature       = undefined;
        window.plugins.toast.show( T.i(error.error), 'long', 'bottom');
    })
  }

  $scope.acceptReQuote = function(){
    
    var confirmPopup = $ionicPopup.confirm({
       title    : T.i('rate_changed.accept_headline'),
       template : T.i('rate_changed.accept_content'),
     }).then(function(res) {
      if(!res)
      {
        console.log('User didnt like quote :(');
        return;
      }
      console.log('User DID like quote :)');
      $scope.doAcceptReQuote();
     });
  }

  $scope.doAcceptReQuote = function(){
    $scope.showLoading('g.accept_tx_process');
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptReQuote($scope.data.quote, $scope.data.signature, token, addy.address, BitShares.X_DEPOSIT, $scope.data.xtx_id ).then(function(result){
        
        console.log('BitShares.acceptReQuote:'+JSON.stringify(result));
        
        //$scope.data.tx                = result.tx;
        Wallet.onNewXTx(result.tx);
        $scope.hideLoading();
        $scope.startWaitingTx();
      }, function(error){
        if(error=='auth_failed')
          Setting.remove(Setting.BSW_TOKEN);
        $scope.hideLoading();
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        return;
      });
    }, function(error){
      $scope.hideLoading();
      console.log(error);
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      return;
    });
  }
  
  $scope.refund = function(){
    
    $timeout(function(){
      $state.go('app.refund', {xtx_id:$scope.data.xtx_id});
    }, 10);
    
  }

  $scope.nanobar = undefined;
  var w_ttl = 24;
  var w_counter_timeout = w_ttl;

  $scope.startWaitingTx = function() {
    if($scope.nanobar===undefined)
    {
      var options = {
        target: document.getElementById('quote_ttl'),
        id: 'mynano',
        bg: '#5abb5c'
      };
      $scope.nanobar = new Nanobar( options );
    }
    $timeout($scope.onWaitingTx, 1000);
  };
  
  $scope.stopWaitingTx = function() {
    //w_counter_timeout = w_ttl;
    w_counter_timeout = 0;
    if($scope.nanobar)
      $timeout(function(){
          $scope.nanobar.go(0);
        }, 1000);
  }
  
  $scope.onWaitingTx = function() {
    
    w_counter_timeout = w_counter_timeout - 1;
    if(w_counter_timeout<=0)
    {
      $scope.stopWaitingTx();
      $scope.nanobar.go(100);
      return;
    }
    $scope.nanobar.go((w_ttl-w_counter_timeout)*100/w_ttl);
    $timeout($scope.onWaitingTx, 1000);
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.getExchangeTx(token, $scope.data.xtx_id).then(function(xtx){
        //var my_xtx = Wallet.processXTx(xtx);
        //console.log('DepositCtrl::WatingTx: ui_type='+xtx.ui_type);
        if(BitShares.notRateChanged(xtx))
        {
          $scope.stopWaitingTx();
          window.plugins.toast.show(T.i('rate_changed.operation_completed'), 'long', 'bottom');
          $scope.goHome();
        }
      }, function(error){
        console.log('requote waitingtx error 1:'+JSON.stringify(error));
      })
    }, function(error){
        console.log('requote waitingtx error 2:'+JSON.stringify(error));
    });
    
  }
  
  $scope.$on( '$ionicView.beforeLeave', function(){
    // Destroy timers
    console.log('RequoteCtrl.ionicView.beforeLeave killing timers.');
    w_counter_timeout=0;
    //$scope.stopTimer();
  });

})

