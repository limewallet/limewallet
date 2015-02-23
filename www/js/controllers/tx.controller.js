bitwallet_controllers
.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, RawOperation, Operation){
  
  $scope.data = { ops         : [],
                  tx_deposits : [],
                  tx_withdraws: [],
                  tx          : undefined, 
                  tx_id       : undefined,
                  fee         : 0
                }
                  
  if (!angular.isUndefined($stateParams.tx_id))
  {
    $scope.data.tx_id = $stateParams.tx_id;
    console.log('TxDetails for: '+$stateParams.tx_id);
    $scope.data.ops = RawOperation.allForTx($stateParams.tx_id).then(function(res){
      $scope.data.ops           = res;
      $scope.data.tx_withdraws  = $scope.getWithdraws();
      $scope.data.tx_deposits   = $scope.getDeposits();
    }, function(error){
    }).then(function(){
      Operation.byTxId($scope.data.tx_id).then(function(res){
        $scope.data.tx    = res;
        $scope.data.fee   = res.fee;
      });
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


