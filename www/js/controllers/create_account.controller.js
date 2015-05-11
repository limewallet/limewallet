bitwallet_controllers
.controller('CreateAccountCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, ExchangeTransaction){
  
  $scope.data = { seed: 'quiz exist ridge blouse sauce delay mobile spell rebel review fish judge'}
  
  $scope.next = function(){
    $scope.setSeed($scope.data.seed);
    $scope.goTo('app.create_wallet_seed');
  }

  //console.log('$scope.init.mode = ' + $scope.init.mode);
});


