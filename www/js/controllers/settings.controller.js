bitwallet_controllers.controller('SettingsCtrl', function($scope, Wallet, Setting, $rootScope, Account, $ionicModal, $timeout, T) {
  
  $scope.data = {assets:[], selected_asset:{}, hide_balance:false};
  
  $scope.loadViewData = function() {
    var wallet = $scope.wallet;
    // Load assets
    Object.keys(wallet.assets).forEach(function(aid){
      var asset = wallet.assets[aid];
      $scope.data.assets.push({value:asset.id, label:asset.symbol});
      if(wallet.asset.id == asset.id)
        $scope.data.selected_asset = $scope.data.assets[$scope.data.assets.length-1];
    });
    
    // Load Account
    Account.get().then(function(account){
      if(!account){
        return;
      }
      $scope.data.name          = account.name;
      $scope.data.initial_name  = account.name;
      $scope.data.gravatar_id   = account.gravatar_id;
      if(account.gravatar_id)
        $scope.data.use_gravatar = true;
    });
  }

  // On asset change reload wallet asset.
  $scope.assetChanged = function(){
    Wallet.switchAsset($scope.data.selected_asset.value)
    .then(function() {
      window.plugins.toast.show( T.i('g.updated'), 'short', 'bottom');
    }, function(err) {
      window.plugins.toast.show( T.i('g.unable_to_refresh'), 'long', 'bottom');
    });
  }
  
  $scope.loadViewData();
  
});
