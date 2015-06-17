bitwallet_controllers
.controller('XtxRequoteCtrl', function($stateParams, $translate, T, Account, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, ExchangeTransaction, $ionicPopover) {

  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = { 
    xtx               : undefined,
    quote             : undefined,
    signature         : undefined
  }

  $ionicPopover.fromTemplateUrl('templates/rate_changed_popover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });

  $scope.openPopover = function($event) {
    // document.body.classList.remove('platform-ios');
    // document.body.classList.remove('platform-android');
    // document.body.classList.add('platform-ionic');
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };

  $scope.doRequote = function() {
    $scope.closePopover();
    $scope.showLoading('rate_changed.getting_quote');
    var keys = Wallet.getAccountAccessKeys();
    return BitShares.getRequote(keys, $scope.data.xtx.id).then(function(res){
      $scope.hideLoading();
      $scope.data.quote     = res.quote;
      $scope.data.signature = res.signature;
    }, function(error){
      console.log(' --- XtxRequoteCtrl error ' + JSON.stringify(error));
      $scope.hideLoading();
      window.plugins.toast.show( T.i(error.error), 'long', 'bottom');
    })
  }

  ExchangeTransaction.byXId($stateParams.xtx_id).then(function(xtx){
    console.log(' *** requote APENAS CARGO: ' + JSON.stringify(xtx));
    $scope.data.xtx = xtx;
    $scope.doRequote();
  }, function(err){
    $scope.goHome();
    console.log(' *** requote XtxRequoteCtrl db error:' + JSON.stringify(err));
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  });
  
  $scope.xxxx = function() {
    
    console.log('doAcceptReQuote');

    $scope.showLoading('g.accept_tx_process');

    var keys = Wallet.getAccountAccessKeys();

    BitShares.acceptQuote($scope.data.quote, $scope.data.signature, keys, $scope.data.xtx.cl_recv_addr, $scope.data.xtx.extra_data, $scope.data.xtx.id ).then(function(xtx){
      console.log('BitShares.acceptReQuote:'+JSON.stringify(xtx));
      ExchangeTransaction.add(xtx.tx).finally(function() {
        Wallet.loadBalance().finally(function() {
          $scope.hideLoading();
          $scope.goHome();
        });
      });
    }, function(error){
      $scope.hideLoading();
      $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
    });
  }
  
  $scope.refund = function(){
    $scope.closePopover();
    console.log(' --- going to refund. xtx_id:' + $scope.data.xtx.id);
    $state.go('app.refund', {xtx_id:$scope.data.xtx.id});
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

