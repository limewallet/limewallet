bitwallet_controllers.controller('SettingsCtrl', function($scope, Wallet, Setting, $rootScope, Account, $ionicModal, $timeout, T) {
  
  $scope.data = {assets:[]
    , selected_asset:{}
    , hide_balance:$scope.wallet.ui.balance.allow_hide};
  
  $scope.loadViewData = function() {
    var wallet = $scope.wallet;
    // Load assets
    Object.keys(wallet.assets).forEach(function(aid){
      var asset = wallet.assets[aid];
      $scope.data.assets.push({value:asset.id, label:asset.symbol});
      if(wallet.asset.id == asset.id)
        $scope.data.selected_asset = $scope.data.assets[$scope.data.assets.length-1];
    });
    $scope.data.hide_balance = $scope.wallet.ui.balance.allow_hide;
    console.log('$scope.data.hide_balance:'+$scope.data.hide_balance);
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
  
  // $scope.$watch('pushNotification.checked', function(newValue, oldValue) {
    // console.log('Push Notification Change: ' + newValue);
  // });
  var balance_timeout = undefined;
  $scope.$watch('data.hide_balance', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if($scope)
    {
      if(balance_timeout)
      {
        $timeout.cancel(balance_timeout);
        balance_timeout = undefined;
      }
      balance_timeout = $timeout(function () {
        Wallet.setUIHideBalance($scope.data.hide_balance);
      }, 500);
      console.log('Hide balance seteado: [$scope.data.hide_balance:'+$scope.data.hide_balance+']' );
      return;
    }
  });
  
  $scope.loadViewData();
  
});
