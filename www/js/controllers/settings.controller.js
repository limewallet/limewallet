bitwallet_controllers.controller('SettingsCtrl', function($scope, Wallet, Setting, $rootScope, Account, $ionicModal, $timeout, T) {
  
  $scope.data = {assets:[], selected_asset:{}, name:'', gravatar_id:'', use_gravatar:false, initial_name:'', watch_name:'',  gravatar_mail:'', profile_changed:false, hide_balance:false};
  
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
  
  // Generate MD5 for gravatar email.
  $scope.gravatarMD5 = function(value){
    if(!value || value.length==0)
    {
      return '';
    }
    return md5(value.toLowerCase());
  }
  
  var name_timeout = null;
  $scope.$watch('data.name', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    
    if(name_timeout)
      name_timeout = null;
    name_timeout = $timeout(function () {
      scope.data.watch_name = newValue;
      $timeout(function () {
        $scope.data.profile_changed = true;
      }, 500);
    }, 1000);
    
    
    
  });
  
  var gravatar_timeout = null;
  $scope.$watch('data.gravatar_mail', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(gravatar_timeout)
      gravatar_timeout = null;
    gravatar_timeout = $timeout(function () {
      scope.data.gravatar_id = scope.gravatarMD5(newValue);
      $timeout(function () {
        $scope.data.profile_changed = true;
      }, 500);
    }, 1000);
    
  });
  
  $scope.$watch('data.use_gravatar', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    $timeout(function () {
      $scope.data.profile_changed = true;
    }, 500);
  });

  $scope.updateProfile = function(){
    
  }
  
});
