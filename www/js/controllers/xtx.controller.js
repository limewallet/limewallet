bitwallet_controllers
.controller('XTxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, RawOperation, ExchangeTransaction){
  
  $scope.data = { xtx         : undefined,
                  x_id        : undefined,
                  ops         : [],
                  tx_deposits : [],
                  tx_withdraws: [],
                  fee         : 0}
                  
  if (!angular.isUndefined($stateParams.x_id))
  {
    $scope.data.x_id = $stateParams.x_id;
    ExchangeTransaction.byXId($scope.data.x_id).then(function(res){
      $scope.data.xtx    = res;
      if($scope.data.xtx.tx_id===null)
        return;
      $scope.data.ops = RawOperation.allForTx($scope.data.xtx.tx_id).then(function(res){
        $scope.data.ops           = res;
        $scope.data.tx_withdraws  = $scope.getWithdraws();
        $scope.data.tx_deposits   = $scope.getDeposits();
      }, function(error){
        console.log('XTxCtrl ERROR 1 '); console.log(error);
      });
    }, function(error){
      console.log('XTxCtrl ERROR 2 '); console.log(error);
    });
  }
  
  $scope.getWithdraws = function(){
    var ops = [];
    angular.forEach($scope.data.ops, function(op){
      if(op.op_type=='w')
        ops.push(op);
    })
    return ops;
  }
  
  $scope.getDeposits = function(){
    var ops = [];
    angular.forEach($scope.data.ops, function(op){
      if(op.op_type=='d')
        ops.push(op);
    })
    return ops;
  }
});


