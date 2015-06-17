bitwallet_controllers
.controller('XTxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, ExchangeTransaction, Wallet){
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = { 
                  tx          : undefined, 
                  x_id        : undefined,
                  asset       : undefined,
                  show_extra  : false };
                  
  if (!angular.isUndefined($stateParams.x_id))
  {
    $scope.data.x_id = $stateParams.x_id;
    console.log('TxDetails for: '+$stateParams.x_id);
    ExchangeTransaction.byXIdEx($scope.data.x_id).then(function(res){
       if(!res)
        {
          $scope.goHome();
          window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
          return;
        }
        
        $scope.data.tx  = res;
        var recv_asset  = Wallet.assetByName($scope.data.tx.cl_pay_curr);
        var pay_asset   = Wallet.assetByName($scope.data.tx.cl_recv_curr);

        console.log(' XTX Detail. pay_asset:'+JSON.stringify(pay_asset));
        console.log(' XTX Detail. recv_asset:'+JSON.stringify(recv_asset));
        if(!recv_asset){
          $scope.data.tx.btc_amount     = $scope.data.tx.cl_recv;
          $scope.data.tx.amount         = $scope.data.tx.cl_pay;
          $scope.data.tx.amount_asset   = pay_asset; 
          $scope.data.tx.bitcoin_txid   = $scope.data.tx.cl_pay_tx;
          $scope.data.tx.bitshares_txid = $scope.data.tx.cl_recv_tx;
        }
        else{
          $scope.data.tx.btc_amount     = $scope.data.tx.cl_pay;
          $scope.data.tx.amount         = $scope.data.tx.cl_recv;
          $scope.data.tx.amount_asset   = recv_asset; 
          $scope.data.tx.bitcoin_txid   = $scope.data.tx.cl_recv_tx;
          $scope.data.tx.bitshares_txid = $scope.data.tx.cl_pay_tx;
        }
        
    }, function(error){
      $scope.goHome();
      window.plugins.toast.show( T.i('err.retrieving_tx'), 'long', 'bottom');
      console.log('XTxCtrl ERROR 2 '); console.log(error);
    });
  }
  else{
    $scope.goHome();
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  }  
  
});


