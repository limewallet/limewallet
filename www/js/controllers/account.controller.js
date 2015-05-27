bitwallet_controllers.controller('AccountCtrl', function($translate, T, BitShares, $scope, $timeout, $ionicPopup, $ionicLoading, $q, Account, Wallet, $interval) {
  
  $scope.recoverAccountData = function(){
    setTimeout(function() {
      var addy = Wallet.getMainAddress();
      Wallet.updateAccountFromNetwork(addy);  
    },100);
  }

  $scope.data = { name            : '',
                  watch_name      : '',  
                  hash_name       : '',  
                  can_update      : false};
  
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
      $scope.data.watch_name  = newValue;
      BitShares.sha256(newValue).then(function(hash){
        console.log('BitShares.sha256('+newValue+') = '+ hash);
        $scope.data.hash_name = hash;
        $timeout(function () { jdenticon(); }, 250);
        $scope.data.can_update = true;
      }, function(err){

        console.log('error sha256 account.constroller '+JSON.stringify(err));
      })
      //jdenticon($scope.data.hash_name);
    }, 750);
  });
  
  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android" class="float_r"></ion-spinner> ' + T.i('g.updating'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }


  $scope.saveProfile = function(){
    console.log(' Chosen name:'+$scope.data.name);
    $scope.showLoading();
    // Check name is not null or empty;
    var is_valid_name = BitShares.isValidBTSName($scope.data.name);
    if(!is_valid_name.valid)
    {
      $scope.hideLoading();
      $scope.alert(is_valid_name);
      return;
    }

    Account.active().then(function(account){
      if(!account || account==undefined){
        $scope.alert({title:'err.invalid_name', message:'err.valid_name_chars'});
        $scope.hideLoading();
        return;
      }
      account['name']         = $scope.data.name;
      account['avatar_hash']  = $scope.data.hash_name;
      
      Account.setProfileInfo(account).then(function(res){
        $scope.hideLoading();
        window.plugins.toast.show( T.i('register.account_name_saved'), 'long', 'bottom');        
        $scope.goTo('app.register');
      }, function(error){
        $scope.alert({title:'err.occurred', message:'err.account_registration'});
        $scope.hideLoading();
      });
      

    }, function(err){
      $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
      $scope.hideLoading();
      return;
    })

  }

  $scope.alert = function(error){
    $ionicPopup.alert({
      title    : T.i(error.title) + ' <i class="fa fa-warning float_right"></i>',
      template : T.i(error.message),
      okType   : 'button-assertive', 
    });
    return;
  }
  

  // *********************
  // Unused functions. Para despues.
  // *********************
  
   


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

