bitwallet_controllers.controller('AccountCtrl', function($translate, T, BitShares, $scope, $timeout, $ionicPopup, $ionicLoading, $q, Account, Wallet, $interval) {
  
  // $scope.recoverAccountData = function(){
  //   setTimeout(function() {
  //     var addy = Wallet.getMainAddress();
  //     Wallet.updateAccountFromNetwork(addy);  
  //   },100);
  // }

  $scope.data = { name            : $scope.wallet.account.name,
                  watch_name      : '',  
                  hash_name       : '',
                  do_register     : true,
                  can_update      : false};
  
  $timeout(function () { jdenticon(); }, 500);

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
  
  $scope.doRegister = function(name, pubkey){
    var deferred = $q.defer();
    
    if($scope.data.do_register==true)
    {
      BitShares.isNameAvailable($scope.data.name).then(function(){
        var keys = Wallet.getAccountAccessKeys();
        if (!keys)
        {
          deferred.reject(T.i('err.no_active_account'));
          return;
        }
        BitShares.registerAccount(keys, name, pubkey).then(function(result) {
          deferred.resolve();
          return;
        }, function(error){
          deferred.reject(error);
          return;
        });  
      }, function(err){
        deferred.reject(T.i(err));
        return;
      });
    }
    else{
      deferred.resolve();
    }
    return deferred.promise;
  }

  $scope.saveProfile = function(){
    
    var deferred = $q.defer();

    console.log('saveProfile oneClicked!!');
    if($scope.wallet.account.registered==1)
    {
      deferred.reject('account.already_registered');
      return deferred.promise;
    }
    //console.log(' Chosen name:'+$scope.data.name);
    $scope.showLoading('account.updating');
    // Check name is not null or empty;
    var is_valid_name_res = BitShares.isValidBTSName($scope.data.name);
    if(!is_valid_name_res.valid)
    {
      $scope.hideLoading();
      $scope.showAlert(is_valid_name_res.title, is_valid_name_res.message);
      deferred.reject('err.invalid_name');
      return deferred.promise;
    }

    Account.active().then(function(account){
      if(!account || account==undefined){
        $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
        $scope.hideLoading();
        deferred.reject('err.no_active_account');
        return deferred.promise;
      }
      $scope.doRegister($scope.data.name, account.pubkey).then(function(){
        account['name']         = $scope.data.name;
        account['avatar_hash']  = $scope.data.hash_name;
        account['registered']   = $scope.data.do_register?1:0;

        console.log('doregister: '+JSON.stringify(account));

        Account.setProfileInfo(account).then(function(res){
          $scope.hideLoading();
          window.plugins.toast.show( T.i('register.account_name_saved'), 'long', 'bottom');        
          Wallet.updateActiveAccount(account['name'], account['registered'], account['avatar_hash']);
          deferred.resolve();
          $scope.goHome();
        }, function(error){
          $scope.showAlert('err.occurred', 'err.account_registration');
          $scope.hideLoading();
          deferred.reject('err.account_registration');
        });
      }, function(err){
        $scope.showAlert('err.occurred', err);
        $scope.hideLoading();
        deferred.reject(err);
      })
    }, function(err){
        $scope.showAlert('err.no_active_account', 'err.no_active_account_create');
        $scope.hideLoading();
        deferred.reject('err.no_active_account');
    })
  
    return deferred.promise;
  }

});

