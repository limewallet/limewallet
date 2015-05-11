bitwallet_controllers.controller('AccountCtrl', function($translate, T, BitShares, $scope, $http, $timeout, $ionicPopup, $ionicLoading, $q, Account, Wallet, $interval, $stateParams) {
  
  $scope.recoverAccountData = function(){
    setTimeout(function() {
      var addy = Wallet.getMainAddress();
      Wallet.updateAccountFromNetwork(addy);  
    },100);
  }

  $scope.data = { name            : $scope.wallet.account.is_default==0?$scope.wallet.account.name:'', //$scope.wallet.account.name 
                  gravatar_id     : $scope.wallet.account.gravatar_id, 
                  use_gravatar    : !($scope.wallet.account.gravatar_id===undefined || $scope.wallet.account.gravatar_id==null || $scope.wallet.account.gravatar_id.length==0), 
                  initial_name    : $scope.wallet.account.is_default==0?$scope.wallet.account.name:'', 
                  watch_name      : $scope.wallet.account.is_default==0?$scope.wallet.account.name:'',  
                  gravatar_mail   : '', 
                  can_update      : false,
                  first_time      : 0};
  
  if (!angular.isUndefined($stateParams.first_time))
  {
    $scope.data.first_time = Number($stateParams.first_time);
  }
  console.log('$stateParams.first_time= ' + $stateParams.first_time);
  console.log('$scope.data.first_time= ' + $scope.data.first_time);
  
  // Generate MD5 for gravatar email.
  $scope.gravatarMD5 = function(value){
    if(!value || value.length==0)
    {
      return '';
    }
    return md5(value.toLowerCase());
  }
  
  
  var name_timeout = undefined;
  $scope.$watch('data.name', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(name_timeout)
    {
      $timeout.cancel(name_timeout);
      name_timeout = undefined;
    }
    name_timeout = $timeout(function () {
      $scope.data.watch_name = newValue;
      $timeout(function () {
        $scope.data.can_update = true;
      }, 500);
    }, 500);
  });
  
  var gravatar_timeout = undefined;
  $scope.$watch('data.gravatar_mail', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(gravatar_timeout)
    {
      $timeout.cancel(gravatar_timeout);
      gravatar_timeout = undefined;
    }
    gravatar_timeout = $timeout(function () {
      if($scope.data.gravatar_mail && $scope.data.gravatar_mail.length>0)
        $scope.data.gravatar_id = $scope.gravatarMD5($scope.data.gravatar_mail);
      else
        $scope.data.gravatar_id = undefined;

      $timeout(function () {
        $scope.data.can_update = true;
      }, 500);
    }, 500);
  });
  
  var use_gravatar_timeout = undefined;
  $scope.$watch('data.use_gravatar', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(use_gravatar_timeout)
    {
      $timeout.cancel(use_gravatar_timeout);
      use_gravatar_timeout = undefined;
    }
    //if(!newValue && ($scope.wallet.account.gravatar_id===undefined || $scope.wallet.account.gravatar_id==null || $scope.wallet.account.gravatar_id.length<1))
    //  return;
    use_gravatar_timeout = $timeout(function () {
      if(!$scope.data.use_gravatar)
        $scope.data.gravatar_mail = undefined;
      $scope.data.can_update = true;
    }, 500);
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
      template     : '<i class="icon ion-looping"></i> ' + T.i($scope.wallet.account.registered==0?'g.registering':'g.updating'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
   
  $scope.updateOrRegisterAccount = function(){
    if($scope.wallet.account.registered==0)
      $scope.registerAccount();
    else
      $scope.updateAccount();
  }
  
  //Update
  $scope.updateAccount = function(){
    $scope.showLoading();
    $scope.doUpdateAccount().then(function(){
      $scope.hideLoading();
      Wallet.loadAccount();
      $scope.goHome();
      window.plugins.toast.show( T.i('register.account_updated'), 'long', 'bottom');
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
  
  $scope.doUpdateAccount = function(){
    
    var deferred = $q.defer();
    
    // Check name is not null or empty;
    if($scope.data.use_gravatar && (!$scope.data.gravatar_mail || $scope.data.gravatar_mail.length<1))
    {
      deferred.reject({title:'err.invalid_email', message:'err.enter_valid_email'});
      return deferred.promise;
    }
      
    Account.updateGravatarId($scope.data.gravatar_id).then(function(){
      var addys         = [];
      var addys_keys    = Object.keys($scope.wallet.addresses);
      for(var i=0; i<addys_keys.length; i++) {
        var address     = {address:addys_keys[i]};
        addys.push(address);
      }
      var assets        = [];
      var assets_keys   = Object.keys($scope.wallet.assets);
      for(var i=0; i<assets_keys.length; i++) {
        assets.push(parseInt(assets_keys[i]));
      }
      var address = Wallet.getMainAddress();
      Account.update(address, addys, assets).then(function(result){
        if(result===undefined || !result.required_signatures || result.required_signatures===undefined || result.required_signatures.length==0 )
        {
          //Account.clearGravatarId().then(function(){
          //  deferred.reject({title:'err.occurred', message:'err.account_registration'});
          //});
          $scope.recoverAccountData();
          deferred.reject({title:'err.occurred', message:'err.account_registration'});
          return;
        }
        var prom = [];
        console.log(result.fee);
        result.tx.signatures = [];
        angular.forEach(result.required_signatures, function(req_addy) {
          var p = Address.by_address(req_addy)
            .then(function(addy) {
              return BitShares.compactSignatureForHash(result.to_sign, addy.privkey)
                .then(function(compact){
                  console.log(addy.address);
                  result.tx.signatures.push(compact);
                  console.log(compact);
                })
            });
          prom.push(p);
        });

        $q.all(prom).then(function() {
          BitShares.sendTx(result.secret, result.tx).then(function(result) {
            deferred.resolve(result);
          }, function(err) {
            deferred.reject({title:'err.occurred', message:err});
          });
        },function(error) {
          deferred.reject({title:'err.occurred', message:error});
        })
      },function(error){
        deferred.reject({title:'err.occurred', message:error});
        return;
      });
          
    },
    function(error){
      deferred.reject({title:'err.occurred', message:error});
    });
      
    return deferred.promise;
  }
  
  // Register
  $scope.registerAccount = function(){
    $scope.showLoading();
    $scope.doRegisterAccount().then(function(){
      $scope.hideLoading();
      Wallet.loadAccount();
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
    
    var account_reg_interval;
    var account_reg_count = 10;
    // validate name
    $scope.isNameAvailable($scope.data.name).then(
      function(){
        Account.storeProfile($scope.data.name, $scope.data.gravatar_id).then(function(){
          var addy = Wallet.getMainAddress();
          Account.register(addy).then(function(result){
            console.log('register.controller.js::register [Account.register OK]');
            if(result===undefined || !result.txid || result.txid===undefined || result.txid.length==0 )
            {
              console.log('register.controller.js::register [Account.register result is NULL]');
              Account.clearProfile().then(function(){
                deferred.reject({title:'err.occurred', message:'err.account_registration'});
              });
              return;
            }
            
            // Se pudo registrar, nos colgamos de un interval para validar que la transaccion se propago encuestando a account.
            account_reg_interval = $interval(function() {
              console.log('register.controller.js::register [INTERVAL:'+account_reg_count+']');
              BitShares.getAccount($scope.data.name).then(function(){
                console.log('register.controller.js::register [INTERVAL: Bitshares.getAccount OK]');
                $interval.cancel(account_reg_interval);
                account_reg_interval=undefined;
                Account.registeredOk().then(function(){
                  return deferred.resolve();
                },function(error){
                  return deferred.resolve();
                });
              },
              function(error){
                account_reg_count-=1;
                console.log('register.controller.js::register [INTERVAL: Bitshares.getAccount ERROR]');
                if(account_reg_count==0)
                {  
                  $interval.cancel(account_reg_interval);
                  account_reg_interval=undefined;
                  Account.clear().then(function(){
                    deferred.reject({title:'err.occurred', message:'err.account_registration'});
                  });
                  return;
                }
              });            
            }, 3000);
          },function(error){
            
            deferred.reject({title:'err.occurred', message:error=='unknown error'?'err.duplicate_key':error});
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

