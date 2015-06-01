bitwallet_controllers
.controller('WelcomeCtrl', function($scope, $rootScope, $ionicNavBarDelegate){
  
  $scope.createWallet = function(){
    $rootScope.setInitMode($scope.INIT_MODE_CREATE_WALLET);
    $scope.goTo('app.create_wallet');
  }

  $scope.recoverWallet = function(){
    $rootScope.setInitMode($scope.INIT_MODE_RECOVER_WALLET);
    $scope.goTo('app.create_wallet_seed');
  }
  
});


