bitwallet_controllers
.controller('CreateAccountSeedCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, ExchangeTransaction){
  
  $scope.next = function(){
    $rootScope.goTo('app.create_account_password');
  }
});


