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
        console.log('isNameAvailable.ok:'+JSON.stringify(data));
        deferred.reject('Name is not available');
      },
      function(error){
        console.log('isNameAvailable.error:'+JSON.stringify(error));
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
    
  $scope.registerAccount = function(){
    $scope.showLoading();
    $scope.doRegisterAccount().then(function(){
      $scope.hideLoading();
      $scope.goHome();
      window.plugins.toast.show( T.i('register.account_registered'), 'long', 'bottom');
    }, function(error){
      $scope.hideLoading();
      $ionicPopup.alert({
         title    : T.i(error.title) + ' <i class="fa fa-warning float_right"></i>',
         template : T.i(error.message),
         okType   : 'button-assertive', 
       });
       return;
    });
  }
  
  $scope.doRegisterAccount = function(){
    
    var deferred = $q.defer();
    
    console.log('name:'+$scope.data.name + ' / ' + $scope.data.name.length);
    // Check name is not null or empty;
    if(!$scope.data.name || $scope.data.name.length<1)
    {
      deferred.reject({title:'err.invalid_name', message:'err.enter_valid_name'});
      return deferred.promise;
    }
    
    // Check name is not null or empty;
    var match = String($scope.data.name).match(/^[a-z][a-z0-9\-]*[^\-]/g); // (?<!\-)
    console.log(match);
    if (!match || match.length==0 || match[0]!=$scope.data.name)
    {
      deferred.reject({title:'err.invalid_name', message:'err.valid_name_chars'});
      return deferred.promise;;
    }
    
    // validate name
    $scope.isNameAvailable($scope.data.name).then(
      function(){
        Account.store($scope.data.name, $scope.data.gravatar_id).then(function(){
          var addy = Wallet.getMainAddress();
          Account.register(addy).then(function(){
            /*
              stop = $interval(function() {
            
              stop=undefined;
              
            }, 1000);
            */
            Account.registeredOk().then(function(){
              return deferred.resolve();
            },function(error){
              return deferred.resolve();
            });
          },function(error){
            
            deferred.reject({title:'err.occurred', message:error});
            return;
          });
              
        },
        function(error){
          deferred.reject({title:'err.occurred', message:error});
        });
      },
      function(error){
        deferred.reject({title:'err.unavailable_name', message:'err.choose_another_name'});
        return;
      }
    )
    return deferred.promise;
  }
});

