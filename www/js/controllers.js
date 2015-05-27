var bitwallet_controllers = angular.module('bit_wallet.controllers', ['bit_wallet.services']);
bitwallet_controllers
.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $timeout, Wallet, $ionicPopup) {
  
  $scope.$watch(function() { return $ionicSideMenuDelegate.isOpen(); }, function(isOpen) { 
    if(isOpen)
      $timeout(function () { jdenticon(); }, 150);
  });

  $scope.data = { in_progress : false};

  $scope.lockWallet= function(){
    $scope.data.in_progress = true;
    Wallet.lock().then(function(){
      window.plugins.toast.show( T.i('g.wallet_locked'), 'long', 'bottom'); 
      $scope.data.in_progress = false;
    }, function(err){
      $ionicPopup.alert({
        title    : T.i('err.wallet_locked_title') + ' <i class="fa fa-warning float_right"></i>',
        template : T.i(err.message),
        okType   : 'button-assertive', 
      });
      $scope.data.in_progress = false;
    });
  }

  $scope.unLockWallet= function(){
    $scope.data.in_progress = true;

    $ionicPopup.prompt({
      title            : T.i('g.input_password'),
      inputPlaceholder : T.i('g.password'),
      inputType        : 'password',
    }).then(function(password) {
      if(password === undefined){
        $scope.data.in_progress = false;
        return;
      }
      Wallet.unLock(password).then(function(){
        window.plugins.toast.show( T.i('g.wallet_unlocked'), 'long', 'bottom'); 
        $scope.data.in_progress = false;
      }, function(err){
        $ionicPopup.alert({
          title    : T.i('err.wallet_un_locked_title') + ' <i class="fa fa-warning float_right"></i>',
          template : T.i(err.message),
          okType   : 'button-assertive', 
        });
        $scope.data.in_progress = false;
      });
    })

  }




})
