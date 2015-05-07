bitwallet_controllers
.controller('CreateAccountCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, ExchangeTransaction){
  
  $scope.data = { seed: 'quiz exist ridge blouse sauce delay mobile spell rebel review fish judge'}
  
  $scope.next = function(){
    $rootScope.goTo('app.create_account_seed');
  }
});


