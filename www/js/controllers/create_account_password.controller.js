bitwallet_controllers
.controller('CreateAccountPwdCtrl', function(Account, Setting, BitShares, $q, $scope, $rootScope, $ionicNavBarDelegate, $stateParams, T, DB, $ionicLoading, Wallet){
  
  $scope.data = { password:         '',
                  retype_password:  ''};
  
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
              'mpk'                 : mpk,
              'account_mpk'         : accountMpk.extendedPrivateKey,
              'pubkey'              : keys.send_mpk.pubkey,
              'privkey'             : keys.send_mpk.privkey,
              'skip32_key'          : keys.skip32_key.privkey_hex,
              'address'             : keys.send_mpk.addy,
              'memo_mpk'            : keys.memo_mpk.extendedPrivateKey,
              'encrypted'           : (password != '') ? 1 : 0,
              'number'              : number,
              'plain_privkey'       : plain_privkey,
              'plain_memo_mpk'      : keys.memo_mpk.extendedPrivateKey,
              'plain_account_mpk'   : accountMpk.extendedPrivateKey,              
              'registered'          : 0
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
    
    if($scope.isCreateInitMode()==false)
    {
      BitShares.getAccount(pubkey).then(function(res){
        if( res.error !== undefined ) 
        {
          //deferred.reject(err);
          console.log('#-# getInfoIfRecovering error #1 '+JSON.stringify(res.error));
          deferred.resolve(undefined);
          return;
        }
        console.log(' #*# getInfoIfRecovering OK #1 '+JSON.stringify(res));
        var name = res[pubkey]['name'];
        BitShares.sha256(name).then(function(hash){
          deferred.resolve({'name':name, 'avatar_hash':hash});
        }, function (err){
          //deferred.reject(err);
          deferred.resolve(undefined);
        });
        
      }, function(err){
        //deferred.reject(err);
        console.log(' #-# getInfoIfRecovering error #2 '+JSON.stringify(res.err));
        deferred.resolve(undefined);
        return;
      });
    }
    else{
      console.log(' #-# getInfoIfRecovering NOT RECOVERING :(');
      deferred.resolve(undefined);
    }
    return deferred.promise;
  }

  $scope.createWallet = function() {

    if($scope.data.password != $scope.data.retype_password)
    {
      $scope.data.error = T.i('err.password_mismatch');
      return;
    }

    //Mostrar loading
    var title = $scope.isCreateInitMode()?'g.creating_wallet':'g.recovering_wallet';
    $scope.showLoading(title);

    BitShares.randomData(32).then(function(salt) {

      BitShares.derivePassword($scope.data.password, salt).then(function(derived_password){
        var password = derived_password.key;
        var prom = $scope.addNewAccount($scope.init.seed, password).then(function(accountInfo){

          // Is recovering wallet? Then check blockchain registration data!
          $scope.getInfoIfRecovering(accountInfo.pubkey).then(function(recovered_data){
            accountInfo.name       = 'guest'+accountInfo.number;
            if(recovered_data)
            {
              accountInfo.name        = recovered_data.name;
              accountInfo.avatar_hash = recovered_data.avatar_hash;
              accountInfo.registered  = 1;
            }
            console.log(' -- call getInfoIfRecovering return: '+accountInfo.name);

            BitShares.signUp(accountInfo.plain_privkey, accountInfo.pubkey).then(function(keys){
              accountInfo.access_key = keys.akey;
              accountInfo.secret_key = keys.skey;
              
              
              var account_cmd = Account._create(accountInfo);

              console.log(' ++++ ACCOUNT create command');
              console.log('CMD: '+JSON.stringify(account_cmd));
              console.log(' -- ');

              $scope.encrypt($scope.init.seed, password).then(function(encryptedSeed) {

                var encrypted = ($scope.data.password != '') ? 1 : 0;
                
                var sql_cmd    = [];
                var sql_params = [];
                
                var seed_cmd  = Setting._set(Setting.SEED, JSON.stringify({'value':encryptedSeed, 'encrypted':encrypted}) );
                var mpk_cmd   = Setting._set(Setting.MPK,  JSON.stringify({'value':accountInfo.mpk, 'encrypted':encrypted}) );
                var salt_cmd  = Setting._set(Setting.SALT, salt);

                sql_cmd.push(seed_cmd.sql);
                sql_params.push(seed_cmd.params);
                  
                sql_cmd.push(mpk_cmd.sql);
                sql_params.push(mpk_cmd.params);
                
                sql_cmd.push(salt_cmd.sql);
                sql_params.push(salt_cmd.params);
                  
                sql_cmd.push(account_cmd.sql);
                sql_params.push(account_cmd.params);
                  
                DB.queryMany(sql_cmd, sql_params).then(function() {
                    console.log('TERMINO DB TXS OK');
                    //$scope.hideLoading();
                    Wallet.load().then(function(){
                      console.log('WALLET LOADED!');
                      Wallet.unlock($scope.data.password).then(function(){
                        console.log('WALLET UNLOCKED!');
                        Wallet.connectToBackend();
                        console.log('Create account completed papa!!!!!');
                        Wallet.refreshBalance();
                        $scope.hideLoading();
                        if($scope.isCreateInitMode()){
                          window.plugins.toast.show( T.i('g.wallet_created'), 'long', 'bottom');
                          $scope.goToState('app.account');
                        }
                        else{
                          window.plugins.toast.show( T.i('g.wallet_recovered'), 'long', 'bottom');
                          $scope.goHome();
                        }
                      }, function(err){
                        console.log('Wallet.unlock error ' + JSON.stringify(err));
                        $scope.hideLoading();
                      });

                    }, function(err){
                      console.log('Wallet.load error ' + JSON.stringify(err));
                      $scope.hideLoading();
                    });

                  }, function(err) {
                    console.log('ERROR DB TXS ' + JSON.stringify(err));
                    $scope.hideLoading();
                  });

              }, function(err){
                console.log( ' -- encrypt error: ' +JSON.stringify(err));
                $scope.hideLoading();
              });
            }, function(err){
              console.log(' signup error :' +JSON.stringify(err));
              $scope.hideLoading();
            });

          }, function(err){
            console.log(' getInfoIfRecovering error: '+JSON.stringify(err));
            $scope.hideLoading();
          });

        }, function(err){
          console.log(' derivePassword error: '+JSON.stringify(err));
          $scope.hideLoading();
        });
      
      }, function(err){
        console.log(JSON.stringify(err));
        $scope.hideLoading();
      });

    }, function(err) {
      console.log(JSON.stringify(err));
      $scope.hideLoading();
    });

  }
});


