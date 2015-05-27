var bitwallet_controllers = angular.module('bit_wallet.controllers', ['bit_wallet.services']);
bitwallet_controllers
.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $timeout) {
  
  $scope.$watch(function() { return $ionicSideMenuDelegate.isOpen(); }, function(isOpen) { 
    if(isOpen)
      $timeout(function () { jdenticon(); }, 150);
  });

})
