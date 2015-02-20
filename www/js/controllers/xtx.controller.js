bitwallet_controllers
.controller('XTxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, RawOperation, ExchangeTransaction){
  
  $scope.data = { xtx         : undefined,
                  x_id        : undefined}
                  
  if (!angular.isUndefined($stateParams.x_id))
  {
    $scope.data.x_id = $stateParams.x_id;
    ExchangeTransaction.byXId($scope.data.x_id).then(function(res){
      $scope.data.xtx    = res;
    });
  }
});


