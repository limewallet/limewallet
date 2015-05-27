bitwallet_controllers
.controller('CreateAccountPwdCtrl', function(Account, Setting, BitShares, $q, $scope, $rootScope, $ionicNavBarDelegate, $stateParams, T, DB, $ionicLoading, Wallet){
  
  $scope.data = { password:         '',
                  retype_password:  ''};
  
  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android"></ion-spinner> ' + T.i('g.creating_wallet'), 
      //template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'), creating_wallet
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 300,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }

  $scope.encrypt = function(plainData, password) {

    var deferred = $q.defer();
    
    if(password == '') {
      deferred.resolve(plainData);
      return deferred.promise;
    }

    console.log('MIRA PASS: [' + password + ']');

    BitShares.encryptString(plainData, password).then(function(encryptedData){
      deferred.resolve(encryptedData);
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  }

  $scope.addNewAccount = function(seed, password) {

    var deferred = $q.defer();

    var proms = {
      'mpk' :   BitShares.mnemonicToMasterKey(seed),
      'count':  Account.count()
    };

    $q.all(proms).then(function(res){

      var mpk    = res.mpk;
      var number = res.count;

      console.log('mnemonicToMasterKey mpk=> ' + mpk + ' // ' + number);
      BitShares.derivePrivate("", "", mpk, number).then(function(accountMpk){
        
        console.log('mnemonicToMasterKey accountMpk > ' + JSON.stringify(accountMpk));
        var proms = { 
          'send_mpk' : BitShares.derivePrivate("", mpk, accountMpk.extendedPrivateKey, 0), 
          'memo_mpk' : BitShares.derivePrivate("", mpk, accountMpk.extendedPrivateKey, 1) 
        };
        
        $q.all(proms).then(function(keys) {

          proms = { 
            'mpk'         : $scope.encrypt(mpk, password),
            'account_mpk' : $scope.encrypt(accountMpk.extendedPrivateKey, password),
            'privkey'     : $scope.encrypt(keys.send_mpk.privkey, password)
          };

          $q.all(proms).then(function(encryptedKeys) {

            keys.send_mpk.privkey         = encryptedKeys.privkey;
            accountMpk.extendedPrivateKey = encryptedKeys.account_mpk;
            mpk                           = encryptedKeys.mpk;
      
            deferred.resolve({ 
              'mpk'           : mpk,
              'account_mpk'   : accountMpk.extendedPrivateKey,
              'pubkey'        : keys.send_mpk.pubkey,
              'privkey'       : keys.send_mpk.privkey,
              'address'       : keys.send_mpk.address,
              'memo_mpk'      : keys.memo_mpk.extendedPrivateKey,
              'encrypted'     : password != '' ? 1 : 0,
              'number'        : number 
            });

          }, function(err) {
            deferred.reject('addNewAccount 1' + err);
          });


        }, function(err) {
          deferred.reject('addNewAccount 3' + err);
        });

      }, function(err){
        deferred.reject('addNewAccount 4' + err);
      });

    }, function(err) {
      deferred.reject(err);
    });
 
    return deferred.promise;

  }

  $scope.createWallet = function() {

    if($scope.data.password != $scope.data.retype_password)
    {
      $scope.data.error = T.i('err.password_mismatch');
      return;
    }

    //Mostrar loading
    $scope.showLoading();

    var prom = $scope.addNewAccount($scope.init.seed, $scope.data.password).then(function(accountInfo){

      var account_cmd = Account._create(accountInfo);

      $scope.encrypt($scope.init.seed, $scope.data.password).then(function(encryptedSeed) {

        var hashed_password = undefined; 
        var encrypted       = $scope.data.password != '' ? 1 : 0;
        var prom            = undefined;
        if(encrypted==1)
        {
          prom = BitShares.pbkdf2($scope.data.password).then(function(value){
            hashed_password = value.key_hash;
          }, function(err){
            deferred.reject(err);
            console.log('cant hash password:' +err);
            $scope.hideLoading();  
            return;
          });
        }

        $q.all(prom).then(function(){

          var seed_cmd          = Setting._set(Setting.SEED, JSON.stringify({'value':encryptedSeed, 'encrypted':encrypted}) );
          var mpk_cmd           = Setting._set(Setting.MPK,  JSON.stringify({'value':accountInfo.mpk, 'encrypted':encrypted}) );
          var password_hash_cmd = Setting._set(Setting.PASSWORD_HASH, hashed_password);
          
          DB.db.transaction(function(transaction) {

            transaction.executeSql(account_cmd.sql, account_cmd.params);
            transaction.executeSql(seed_cmd.sql, seed_cmd.params);
            transaction.executeSql(mpk_cmd.sql, mpk_cmd.params);
            transaction.executeSql(password_hash_cmd.sql, password_hash_cmd.params);

          }, function(err) {
            deferred.reject(err);
            console.log('EGRRA:' +err);
            $scope.hideLoading();
          });

        }, function(err){
          deferred.reject(err);
          console.log(JSON.stringify(err));
          $scope.hideLoading();  
        });

      }, function(err){
        deferred.reject(err);
        console.log(JSON.stringify(err));
        $scope.hideLoading();
      });

    }, function(err){
      deferred.reject(err);
      console.log(JSON.stringify(err));
      $scope.hideLoading();
    });
    
    prom.then(function(){
      $scope.hideLoading();
      Wallet.init();
      window.plugins.toast.show( T.i('g.wallet_created'), 'long', 'bottom');
      $scope.goTo('app.account');
    }, function(err){

    })
    //$scope.goHome();
  }
});


