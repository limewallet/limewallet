bitwallet_controllers
.controller('AssetsCtrl', function($translate, T, Balance, $scope, $rootScope, $http, $timeout) {
  
  $scope.data = {balances : []}

  $scope.loadData = function(){
    Balance.all().then(function(res){
      $scope.data.balances = res;
    }, function(err){

    });  
  }
  
  $scope.loadData();
  
})

