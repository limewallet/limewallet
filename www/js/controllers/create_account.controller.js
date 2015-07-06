bitwallet_controllers
.controller('CreateAccountCtrl', function(BitShares, $scope, $rootScope, $ionicNavBarDelegate, $stateParams, $cordovaClipboard, T){
  
  $scope.data = { seed: ''}
  
  $scope.next = function(){
    $scope.setSeed($scope.data.seed);
    $scope.goToState('app.create_wallet_seed');
  }

  $scope.copySeed = function(){
    $cordovaClipboard
      .copy($scope.data.seed)
      .then(function () {
        window.plugins.toast.show(T.i('g.seed_copied'), 'short', 'bottom');
      }, function () {
        window.plugins.toast.show(T.i('err.seed_copied'), 'short', 'bottom');
      });
  }

  BitShares.createMnemonic(128).then(function(words){
    $scope.data.seed = words;
  }, function(err) {

  });
  
});


