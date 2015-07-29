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
  
  $scope.acceptQuote = function() {
    
    var deferred = $q.defer();

    $scope.showLoading('g.accept_tx_process');

    var keys = Wallet.getAccountAccessKeys();

    BitShares.acceptQuote($scope.data.quote, $scope.data.signature, keys, $scope.data.xtx.cl_recv_addr, $scope.data.xtx.extra_data, $scope.data.xtx.id ).then(function(xtx){
      console.log('BitShares.acceptReQuote:'+JSON.stringify(xtx));
      ExchangeTransaction.add(xtx.tx).finally(function() {
        Wallet.loadBalance().finally(function() {
          $scope.hideLoading();
          deferred.resolve();
          $scope.goHome();
        });
      });
    }, function(error){
      $scope.hideLoading();
      $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
      deferred.reject();
    });
    
    return deferred.promise;
  }
  
  $scope.refund = function(){
    $scope.closePopover();
    console.log(' --- going to refund. xtx_id:' + $scope.data.xtx.id);
    $state.go('app.refund', {xtx_id:$scope.data.xtx.id});
  }
  
  $scope.$on( '$ionicView.beforeLeave', function(){

  });

})

