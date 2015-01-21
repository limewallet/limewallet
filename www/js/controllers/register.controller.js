bitwallet_controllers
.controller('RegisterCtrl', function($translate, T, BitShares, $scope, $rootScope, $http, $timeout, $ionicPopup, $ionicLoading, $q, Account, Wallet) {
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
  
  $scope.isNameAvailable = function(name) {
    var deferred = $q.defer();
    BitShares.getAccount($scope.data.name).then(
      function(data){
        deferred.reject('Name is not available');
      },
      function(error){
        if (error === undefined)
        {
          deferred.reject('Unknown Error - Check internet connection and try again later.');
          return;
        }
        deferred.resolve();
      }
    )
    return deferred.promise;
  }
    
  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
    
  $scope.register = function(){
    
    console.log('name:'+$scope.data.name + ' / ' + $scope.data.name.length);
    // Check name is not null or empty;
    if(!$scope.data.name || $scope.data.name.length<1)
    {
       $ionicPopup.alert({
         title    : T.i('err.invalid_name') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.enter_valid_name'),
         okType   : 'button-assertive', 
       });
       return;
    }
    
    // Check name is not null or empty;
    var match = String($scope.data.name).match(/^[a-z][a-z0-9\-]*[^\-]/g); // (?<!\-)
    if (!match || match.length==0 || match[0]!=$scope.data.name)
    {
       $ionicPopup.alert({
         title    : T.i('err.invalid_name') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.valid_name_chars'),
         okType   : 'button-assertive', 
       });
       return;
    }
    
    $scope.showLoading();
    // validate name
    $scope.isNameAvailable($scope.data.name).then(
      function(){
        Account.store($scope.data.name, $scope.data.gravatar_id).then(function(){
          var addy = Wallet.getMainAddress();
          Account.register(addy).then(function(){
            Account.registeredOk().then(function(){
              $scope.hideLoading();
              $scope.goHome();
              window.plugins.toast.show( T.i('register.account_registered'), 'long', 'bottom');
            },function(error){
              $scope.hideLoading();
              $scope.goHome();
              window.plugins.toast.show( T.i('register.account_registered'), 'long', 'bottom');
            });
            
          },function(error){
            $ionicPopup.alert({
              title    : T.i('err.occurred') + ' <i class="fa fa-warning float_right"></i>',
              template : error,
              okType   : 'button-assertive', 
            });
            return;
          });
              
        },
        function(error){
          $scope.hideLoading();
          window.plugins.toast.show( error, 'long', 'bottom');
        });
      },
      function(error){
        $scope.hideLoading();
        //window.plugins.toast.show( error, 'long', 'bottom');
        $ionicPopup.alert({
          title    : T.i('err.unavailable_name') + ' <i class="fa fa-warning float_right"></i>',
          template : T.i('err.choose_another_name'),
          okType   : 'button-assertive', 
        });
        return;
      }
    )
    // return;
    // //check addy
    // var addy = Wallet.getMainAddress();
    // console.log('TOMA addy ' + JSON.stringify(addy));
    // Account.store('menchomedina', '').then(function() {
      // Account.register(addy);
    // }, function(err) {

    // });
  }
});

