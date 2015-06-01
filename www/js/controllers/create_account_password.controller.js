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
          'send_mpk'   : BitShares.derivePrivate("", mpk, accountMpk.extendedPrivateKey, 0), 
          'memo_mpk'   : BitShares.derivePrivate("", mpk, accountMpk.extendedPrivateKey, 1),
          'skip32_key' : BitShares.derivePrivate("", mpk, accountMpk.extendedPrivateKey, 2) 
        };
        
        $q.all(proms).then(function(keys) {

          proms = { 
            'mpk'         : $scope.encrypt(mpk, password),
            'account_mpk' : $scope.encrypt(accountMpk.extendedPrivateKey, password),
            'privkey'     : $scope.encrypt(keys.send_mpk.privkey, password),
            'skip32_key'  : $scope.encrypt(keys.skip32_key.privkey_hex, password),
            'memo_mpk'    : $scope.encrypt(keys.memo_mpk.extendedPrivateKey, password)
          };

          $q.all(proms).then(function(encryptedKeys) {

            var plain_privkey     = keys.send_mpk.privkey;
            var plain_memo_mpk    = keys.memo_mpk.extendedPrivateKey;
            var plain_account_mpk = accountMpk.extendedPrivateKey;

            keys.send_mpk.privkey            = encryptedKeys.privkey;
            keys.memo_mpk.extendedPrivateKey = encryptedKeys.memo_mpk;
            keys.skip32_key.privkey_hex      = encryptedKeys.skip32_key;
            accountMpk.extendedPrivateKey    = encryptedKeys.account_mpk;
            mpk                              = encryptedKeys.mpk;
            
            console.log('AddAccount :: encrypted? ->' + ((password != '') ? '1' : '0'));
            deferred.resolve({ 
              'name'                : 'guest',
              'mpk'                 : mpk,
              'account_mpk'         : accountMpk.extendedPrivateKey,
              'pubkey'              : keys.send_mpk.pubkey,
              'privkey'             : keys.send_mpk.privkey,
              'skip32_key'          : keys.skip32_key.privkey_hex,
              'address'             : keys.send_mpk.address,
              'memo_mpk'            : keys.memo_mpk.extendedPrivateKey,
              'encrypted'           : (password != '') ? 1 : 0,
              'number'              : number,
              'plain_privkey'       : plain_privkey,
              'plain_memo_mpk'      : keys.memo_mpk.extendedPrivateKey,
              'plain_account_mpk'   : accountMpk.extendedPrivateKey,              
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

  $scope.getInfoIfRecovering = function(pubkey){
    var deferred = $q.defer();
    
    // if($scope.isCreateInitMode()==false)
    // {
    //   BitShares.isNameAvailable($scope.data.name).then(function(){
    //     var keys = Wallet.getAccountAccessKeys();
    //     if (!keys)
    //     {
    //       deferred.reject(T.i('err.no_active_account'));
    //       // $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
    //       // $scope.hideLoading();
    //       return;
    //     }
    //     BitShares.registerAccount(keys, name, pubkey).then(function(result) {
    //       deferred.resolve();
    //       return;
    //     }, function(error){
    //       deferred.reject(error);
    //       return;
    //     });  
    //   }, function(err){
    //     deferred.reject(T.i(err));
    //     return;
    //   });
    // }
    // else{
    //   deferred.resolve();
    // }
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

    BitShares.derivePassword($scope.data.password).then(function(derived_password){
      var password = derived_password.key;
      var prom = $scope.addNewAccount($scope.init.seed, password).then(function(accountInfo){

        // Is recovering wallet? Then check blockchain registration data!
        
        BitShares.signUp(accountInfo.plain_privkey, accountInfo.pubkey).then(function(keys){
          //  OK    -> Wallet.init()
          accountInfo.access_key = keys.akey;
          accountInfo.secret_key = keys.skey;
          accountInfo.name       = 'guest'+accountInfo.number;
          
          var account_cmd = Account._create(accountInfo);

          console.log(JSON.stringify(account_cmd));

          $scope.encrypt($scope.init.seed, password).then(function(encryptedSeed) {

            var encrypted = ($scope.data.password != '') ? 1 : 0;

            //BitShares.derivePassword($scope.data.password).then(function(derived_password){

              var seed_cmd          = Setting._set(Setting.SEED, JSON.stringify({'value':encryptedSeed, 'encrypted':encrypted}) );
              var mpk_cmd           = Setting._set(Setting.MPK,  JSON.stringify({'value':accountInfo.mpk, 'encrypted':encrypted}) );
              var password_hash_cmd = Setting._set(Setting.PASSWORD_HASH, derived_password.key_hash);

              return DB.db.transaction(function(transaction) {

                var proms = {
                  'account' :  transaction.executeSql(account_cmd.sql, account_cmd.params),
                  'seed'    :  transaction.executeSql(seed_cmd.sql, seed_cmd.params),
                  'mpk'     :  transaction.executeSql(mpk_cmd.sql, mpk_cmd.params),
                  'hash'    :  transaction.executeSql(password_hash_cmd.sql, password_hash_cmd.params)
                }

                $q.all(proms).then(function(res) {
                  console.log('TERMINO DB TXS OK');
                  $scope.hideLoading();

                  Wallet.load().then(function(){
                    Wallet.unlock($scope.data.password).then(function(){
                      Wallet.connectToBackend();
                      console.log('Create account completed papa!!!!!');
                      window.plugins.toast.show( T.i('g.wallet_created'), 'long', 'bottom');
                      $scope.goTo('app.account');

                    }, function(err){
                      console.log('Wallet.unlock error ' + JSON.stringify(err));
                      $scope.hideLoading();
                    });

                  }, function(err){
                    console.log('Wallet.load error ' + JSON.stringify(err));
                    $scope.hideLoading();
                  });

                }, function(err) {
                  console.log('ERROR TERMINO DB TXS ' + JSON.stringify(err));
                  $scope.hideLoading();
                });


              }, function(err) {
                console.log('EGRRA:' +err);
                $scope.hideLoading();
              });

            // }, function(err){
            //   console.log(JSON.stringify(err));
            //   $scope.hideLoading();  
            // });

          }, function(err){
            console.log(JSON.stringify(err));
            $scope.hideLoading();
          });
        }, function(err){

        });

      }, function(err){
        console.log(JSON.stringify(err));
        $scope.hideLoading();
      });
    
    }, function(err){
      console.log(JSON.stringify(err));
      $scope.hideLoading();
    });

    //prom.then(function(){
      //$scope.hideLoading();
      //Wallet.init();
      //window.plugins.toast.show( T.i('g.wallet_created'), 'long', 'bottom');
      //$scope.goTo('app.account');
    //}, function(err){

    //})
    //$scope.goHome();
  }
});


