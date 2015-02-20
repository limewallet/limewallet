bitwallet_controllers
.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, RawOperation, Operation){
  
  $scope.data = { ops         : [],
                  tx_deposits : [],
                  tx_withdraws: [],
                  fee         : 0,
                  tx          : undefined, 
                  tx_id       : undefined
                }
                  
  if (!angular.isUndefined($stateParams.tx_id))
  {
    $scope.data.tx_id = $stateParams.tx_id;
    console.log('TxDetails for: '+$stateParams.tx_id);
    $scope.data.ops = RawOperation.allForTx($stateParams.tx_id).then(function(res){
      $scope.data.ops           = res;
      $scope.data.tx_withdraws  =  $scope.getWithdraws();
      $scope.data.tx_deposits   =  $scope.getDeposits();
      $scope.data.fee           =  $scope.getFee();
    }, function(error){
    }).then(function(){
      Operation.byTxId($scope.data.tx_id).then(function(res){
        $scope.data.tx    = res;
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
  $scope.getFee = function(){
    var fee = 0;
    var precision = -1;
    angular.forEach($scope.data.ops, function(op){
      if(op.op_type=='d')
        fee=fee-parseFloat(op.amount);
      else
        fee=fee+parseFloat(op.amount);
      console.log('getFee for asset:'+op.asset_id);
      if(precision==-1 && op.asset_id!==undefined)
        precision = $scope.wallet.assets[op.asset_id].precision;
        //precision = $rootScope.asset.precision;
    })
    return fee/precision;
  }
});


