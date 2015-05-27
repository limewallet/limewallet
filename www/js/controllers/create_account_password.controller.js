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
            'skip32_key'  : $scope.encrypt(keys.skip32_key.privkey, password),
            'memo_mpk'    : $scope.encrypt(keys.memo_mpk.extendedPrivateKey, password)
          };

          $q.all(proms).then(function(encryptedKeys) {

            keys.send_mpk.privkey            = encryptedKeys.privkey;
            keys.memo_mpk.extendedPrivateKey = encryptedKeys.memo_mpk;
            keys.skip32_key.privkey          = encryptedKeys.skip32_key;
            accountMpk.extendedPrivateKey    = encryptedKeys.account_mpk;
            mpk                              = encryptedKeys.mpk;
      
            deferred.resolve({ 
              'mpk'           : mpk,
              'account_mpk'   : accountMpk.extendedPrivateKey,
              'pubkey'        : keys.send_mpk.pubkey,
              'privkey'       : keys.send_mpk.privkey,
              'skip32_key'    : keys.skip32_key.privkey,
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

        var encrypted = $scope.data.password != '' ? 1 : 0;

        BitShares.derivePassword($scope.data.password).then(function(derived_password){

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
              Wallet.init();
              window.plugins.toast.show( T.i('g.wallet_created'), 'long', 'bottom');
              $scope.goTo('app.account');
            }, function(err) {
              console.log('ERROR TERMINO DB TXS ' + JSON.stringify(err));
              $scope.hideLoading();
            });


          }, function(err) {
            console.log('EGRRA:' +err);
            $scope.hideLoading();
          });

        }, function(err){
          console.log(JSON.stringify(err));
          $scope.hideLoading();  
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


