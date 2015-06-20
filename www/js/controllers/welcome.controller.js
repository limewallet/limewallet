bitwallet_controllers
.controller('WelcomeCtrl', function($scope, $timeout, $rootScope, $ionicNavBarDelegate, $cordovaSplashscreen){
  
  $scope.createWallet = function(){
    $rootScope.setInitMode($scope.INIT_MODE_CREATE_WALLET);
    $scope.goToState('app.create_wallet');
  }

  $scope.recoverWallet = function(){
    $rootScope.setInitMode($scope.INIT_MODE_RECOVER_WALLET);
    $scope.goToState('app.create_wallet_seed');
  }

  $timeout(function() {
    $cordovaSplashscreen.hide();
  }, 2000);
  
});


