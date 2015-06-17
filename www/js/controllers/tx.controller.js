bitwallet_controllers
.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, T, $translate){
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = { 
                  tx          : undefined, 
                  tx_id       : undefined,
                  asset       : undefined,
                  show_extra  : false}
                  
  if (!angular.isUndefined($stateParams.tx_id))
  {
    $scope.data.tx_id = $stateParams.tx_id;
    console.log('TxDetails for: '+$stateParams.tx_id);
    Operation.byTxIdEx($scope.data.tx_id).then(function(res){
        if(!res)
        {
          $scope.goHome();
          window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
          return;
        }
        $scope.data.tx        = res;
        $scope.data.asset     = $scope.wallet.assets[$scope.data.tx.asset_id];
        var original_amount   = $scope.data.tx.amount;
        $scope.data.tx.amount = original_amount/$scope.data.asset.precision;
        var original_fee      = $scope.data.tx.fee;
        $scope.data.tx.fee    = original_fee/$scope.data.asset.precision;
    }, function(error){
      $scope.goHome();
      window.plugins.toast.show( T.i('err.retrieving_tx'), 'long', 'bottom');
      console.log('TxCtrl ERROR 2 '); console.log(error);
    });
  }
  else{
    $scope.goHome();
    window.plugins.toast.show( T.i('err.invalid_xtx_id'), 'long', 'bottom');
  }

});


