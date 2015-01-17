bitwallet_controllers.controller('SettingsCtrl', function($scope, Setting, $rootScope, Account, $ionicModal, $timeout) {
  
  $scope.data = {assets:[], selected_asset:{}, name:'', gravatar_id:'', use_gravatar:false, initial_name:'', watch_name:'',  gravatar_mail:'', profile_changed:false, hide_balance:false};
  
  $scope.loadViewData = function() {
    // Load assets
    Object.keys($scope.assets).forEach(function(aid){
      var asset = $scope.assets[aid];
      $scope.data.assets.push({value:asset.id, label:asset.symbol});
      if($scope.asset_id == asset.id)
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
    Setting.set(Setting.DEFAULT_ASSET, $scope.data.selected_asset.value).then(function() {
      console.log('selected:'+$scope.data.selected_asset);
      if($rootScope.asset_id!=$scope.data.selected_asset.value)
        $timeout(function () {
          $rootScope.assetChanged($scope.data.selected_asset.value);
        }, 250);  
    }, function(err) {
      console.log('ERROR: '+err);  
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
    $timeout(function () {
      scope.data.watch_name = newValue;
    }, 500);
    
    $timeout(function () {
      $scope.data.profile_changed = true;
    }, 500);
    
  });
  
  var gravatar_timeout = null;
  $scope.$watch('data.gravatar_mail', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(gravatar_timeout)
      gravatar_timeout = null;
    $timeout(function () {
      scope.data.gravatar_id = scope.gravatarMD5(newValue);
      scope.data.gravatar_id = scope.gravatarMD5(newValue);
    }, 500);
    $timeout(function () {
      $scope.data.profile_changed = true;
    }, 500);
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
  
})
