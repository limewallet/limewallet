bitwallet_controllers
.controller('SuccessfulCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, ExchangeTransaction){
  
  $scope.data = { title       : "title",
                  amount      : 0,
                  currency    : "USD",
                  sub_title   : "Recipient",
                  sub_data    : "recipient?",
                  sub_title2  : "Memo",
                  sub_data2   : "memo?",
                  oper_id     : 0,
                  xtx_id      : 0
                }
                  
  if (!angular.isUndefined($stateParams.xtx_id))
  {
    $scope.data.xtx_id = $stateParams.xtx_id;
    ExchangeTransaction.byXId($scope.data.xtx_id).then(function(res){
      $scope.data.xtx    = res;
      if($scope.data.xtx.tx_id===null)
        $scope.goHome();
      
      $scope.data.title       = T.i('g.'+$scope.data.xtx.tx_type);
      $scope.data.amount      = $scope.data.xtx.cl_recv;
      $scope.data.currency    = $scope.data.xtx.cl_recv_curr;
      $scope.data.sub_title   = $scope.data.xtx.cl_recv_curr;
      $scope.data.sub_data    = "";

    }, function(error){
      console.log('XTxCtrl ERROR 2 '); console.log(error);
    });
  }
  else if (!angular.isUndefined($stateParams.oper_id))
  {
    $scope.data.oper_id = $stateParams.oper_id;
    Operation.byId($scope.data.xtx_id).then(function(res){
      $scope.data.xtx    = res;
      if($scope.data.xtx.tx_id===null)
        $scope.goHome();
      
      $scope.data.title       = "";
      $scope.data.amount      = "";
      $scope.data.currency    = "";
      $scope.data.sub_title   = "";
      $scope.data.sub_data    = "";

    }, function(error){
      console.log('XTxCtrl ERROR 2 '); console.log(error);
    });
  }
  
  
});


