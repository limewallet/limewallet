bitwallet_controllers
.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams){

  $scope.getWithdraws = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='w')
        ops.push(op);
    })
    return ops;
  }
  $scope.getDeposits = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        ops.push(op);
    })
    return ops;
  }
  $scope.getFee = function(){
    var fee = 0;
    var precision = -1;
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        fee=fee-op.amount;
      else
        fee=fee+op.amount;
      if(precision==-1)
        precision = $scope.wallet.assets[op.asset_id].precision;
        //precision = $rootScope.asset.precision;
    })
    return fee/precision;
  }
});


