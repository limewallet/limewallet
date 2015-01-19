bitwallet_controllers
.controller('RegisterCtrl', function($translate, T, Address, MasterKey, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard) {
  $scope.data = { name:'', gravatar_id:'', use_gravatar:false, initial_name:'', watch_name:'',  gravatar_mail:'', profile_changed:false};
  
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
});

