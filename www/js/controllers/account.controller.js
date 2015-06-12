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

  $scope.doRegister = function(name, pubkey){
    var deferred = $q.defer();
    
    if($scope.data.do_register==true)
    {
      BitShares.isNameAvailable($scope.data.name).then(function(){
        var keys = Wallet.getAccountAccessKeys();
        if (!keys)
        {
          deferred.reject(T.i('err.no_active_account'));
          // $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
          // $scope.hideLoading();
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

    if($scope.wallet.account.registered==1)
    {
      return;
    }
    console.log(' Chosen name:'+$scope.data.name);
    $scope.showLoading();
    // Check name is not null or empty;
    var is_valid_name_res = BitShares.isValidBTSName($scope.data.name);
    if(!is_valid_name_res.valid)
    {
      $scope.hideLoading();
      $scope.alert(is_valid_name_res);
      return;
    }

    Account.active().then(function(account){
      if(!account || account==undefined){
        $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
        $scope.hideLoading();
        return;
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
          $scope.goTo('app.home');
        }, function(error){
          $scope.alert({title:'err.occurred', message:'err.account_registration'});
          $scope.hideLoading();
        });
      }, function(err){
        $scope.alert({title:'err.occurred', message:err});
        $scope.hideLoading();
        return;
      })
    }, function(err){
        $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
        $scope.hideLoading();
        return;
    })
    
    

  }

  $scope.alert = function(error){
    $ionicPopup.alert({
      title    : T.i(error.title),
      template : T.i(error.message),
      okType   : 'button-assertive', 
    });
    return;
  }
  


});

