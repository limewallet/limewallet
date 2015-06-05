var bitwallet_controllers = angular.module('bit_wallet.controllers', ['bit_wallet.services']);
bitwallet_controllers
.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $timeout, Wallet, $ionicPopup, $rootScope, $translate, $state, T) {
  
  $scope.$watch(function() { return $ionicSideMenuDelegate.isOpen(); }, function(isOpen) { 
    if(isOpen)
      $timeout(function () { jdenticon(); }, 150);
  });

  $scope.data = { in_progress : false};

  $scope.goToState = function(state){
    //$ionicHistory.clearHistory();
    //$ionicHistory.
    $state.go(state);
  }

  $scope.lockWallet= function(){
    $scope.data.in_progress = true;
    var locked = Wallet.lock();
    if(locked=true)
    {  
      window.plugins.toast.show( T.i('g.wallet_locked'), 'long', 'bottom'); 
      $scope.data.in_progress = false;
    }
    else
    {  
      $ionicPopup.alert({
        title    : T.i('err.wallet_locked_title'),
        template : 'essta',
        okType   : 'button-assertive'
      });
      $scope.data.in_progress = false;
    }

  }

  $scope.unLockWallet= function(){
    $scope.data.in_progress = true;

    $ionicPopup.prompt({
      title            : T.i('g.input_password'),
      inputPlaceholder : T.i('g.password'),
      inputType        : 'password',
    }).then(function(password) {
      if(!password){
        $scope.data.in_progress = false;
        return;
      }
      Wallet.unlock(password).then(function(){
        window.plugins.toast.show( T.i('g.wallet_unlocked'), 'long', 'bottom'); 
        $scope.data.in_progress = false;
      }, function(err){
        $ionicPopup.alert({
          title    : T.i('err.wallet_un_locked_title'),
          template : err,
          okType   : 'button-assertive', 
        });
        $scope.data.in_progress = false;
      });
    })

  }




})
