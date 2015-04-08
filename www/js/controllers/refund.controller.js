bitwallet_controllers
.controller('RefundCtrl', function($stateParams, $translate, T, Address, Account, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, ExchangeTransaction) {

$scope.data = {   xtx           : undefined, 
                  xtx_id        : undefined,
                  signature     : undefined,
                  refund_address: '' }
                  
  if (angular.isUndefined($stateParams.xtx_id))
  {
    $scope.goHome();
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  }

  $scope.data.refund_address = Wallet.getMainAddress().address;

  $scope.data.xtx_id = $stateParams.xtx_id;
  console.log(' --- RefundCtrl for: ' + $scope.data.xtx_id.toString());
  ExchangeTransaction.byXId($scope.data.xtx_id).then(function(res){
      $scope.data.xtx             = res;
  }, function(err){
    $scope.goHome();
    console.log('RefundCtrl db error:' + JSON.stringify(err));
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
       title    : T.i(title) + ' <i class="fa fa-warning float_right"></i>',
       template : T.i(message),
       okType   : 'button-assertive', 
     });
  }

  $scope.doRefund = function(){
    
    if (!$scope.data.refund_address || $scope.data.refund_address.length==0)
    {
      //window.plugins.toast.show(T.i('rate_changed.operation_completed'), 'long', 'bottom');      
      $scope.showAlert('g.btc_addr_error','g.btc_addr_error_input');
      return;
    }

    var confirmPopup = $ionicPopup.confirm({
       title    : T.i('rate_changed.refund_headline'),
       template : T.i('rate_changed.refund_content'),
     }).then(function(res) {
      if(!res)
        return;
      $scope.refund();
     });
  }

  $scope.refund = function(){
    $scope.showLoading('g.accept_tx_process');
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.refundXTx(token, $scope.data.xtx_id, $scope.data.refund_address ).then(function(result){
        $scope.hideLoading();
        console.log(' -- Refund result:'+JSON.stringify(result));
        
        Wallet.onNewXTx(result.tx);
        $scope.goHome();
        window.plugins.toast.show(T.i('refund.successful'), 'long', 'bottom');
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
    $timeout($scope.onWaitingTx, 5000);
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.getExchangeTx(token, $scope.data.xtx_id).then(function(xtx){
        //var my_xtx = Wallet.processXTx(xtx);
        //console.log('DepositCtrl::WatingTx: ui_type='+xtx.ui_type);
        if(BitShares.isWatingConfirmation(xtx))
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

  $scope.pasteBitcoinAddress = function(){
    $cordovaClipboard
      .paste()
      .then(function (result) {
        //success
        $scope.data.refund_address = result;
      }, function () {
        //error
        window.plugins.toast.show( T.i('err.unable_to_paste_btc_addr'), 'short', 'bottom');
      });
  }
})

