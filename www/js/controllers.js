var bitwallet_controllers = angular.module('bit_wallet.controllers', ['bit_wallet.services']);
bitwallet_controllers
.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $timeout, Wallet, $ionicPopup, $rootScope, $translate, $state, T) {
  
  $scope.$watch(function() { return $ionicSideMenuDelegate.isOpen(); }, function(isOpen) { 
    if(isOpen)
      $timeout(function () { jdenticon(); }, 150);
  });

  $scope.data = { in_progress : false};

  $scope.lockWallet= function() {
    var locked = Wallet.lock();
    if(locked==true)
    {  
      window.plugins.toast.show( T.i('g.wallet_locked'), 'long', 'bottom'); 
    }
    else
    {  

    }
  }

})
