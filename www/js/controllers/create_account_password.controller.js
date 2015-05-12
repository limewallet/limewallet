bitwallet_controllers
.controller('CreateAccountPwdCtrl', function(Account, Setting, BitShares, $q, $scope, $rootScope, $ionicNavBarDelegate, $stateParams, T, DB){
  
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

    var proms = [BitShares.mnemonicToMasterKey(seed),  Account.count()];
    $q.all(proms).then(function(res){

      var mpk    = res[0];
      var number = res[1];
      console.log('mnemonicToMasterKey > ' + mpk + ' // ' + number);
      BitShares.derivePrivate("", mpk, number).then(function(intermediateKey){
        
        console.log('mnemonicToMasterKey > ' + intermediateKey );
        var proms = [ BitShares.derivePrivate(mpk, intermediateKey, 0), BitShares.derivePrivate(mpk, intermediateKey, 1) ];
        
        $q.all(proms).then(function(keys) {

          BitShares.extractDataFromKey(intermediateKey, keys[0]).then( function(keyInfo) {
            
            proms = [ $scope.encrypt(keyInfo.privkey, password), $scope.encrypt(keys[1], password) ];
            $q.all(proms).then(function(encryptedData) {

              keyInfo.privkey = encryptedData[0];
              keys[1]         = encryptedData[1];
        
              deferred.resolve({ 
                  'pubkey'        : keyInfo.pubkey,
                  'address'       : keyInfo.address,
                  'priv_account'  : keyInfo.privkey,
                  'priv_memos'    : keys[1],
                  'encrypted'     : password != '' ? 1 : 0,
                  'number'        : number 
              });

            }, function(err) {
              deferred.reject('addNewAccount 1' + err);
            });

          }, function(err) {
            deferred.reject('addNewAccount 2' + err);
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

    $scope.addNewAccount($scope.init.seed, $scope.data.password).then(function(accountInfo){

      var tmp0 = Account._create(accountInfo.pubkey, accountInfo.address, accountInfo.number, accountInfo.priv_account, accountInfo.priv_memos, accountInfo.memo_index, accountInfo.encrypted);

      $scope.encrypt($scope.init.seed, $scope.data.password).then(function(encryptedSeed) {

        var encrypted = $scope.data.password != '' ? 1 : 0;
        var tmp1 = Setting._set(Setting.SEED, JSON.stringify({'seed':encryptedSeed, 'encrypted':encrypted}) );

        DB.db.transaction(function(transaction) {

          transaction.executeSql(tmp0[0], tmp0[1]);
          transaction.executeSql(tmp1[0], tmp1[1]);

        }, function(err) {
          console.log('EGRRA:' +err);
        });

        // DB.query(sql, params).then(function(res){
        //     console.log('ORKOTT!!');
        // }, function(err){
        //   console.log(JSON.stringify(err));
        // });

      }, function(err){
        console.log(JSON.stringify(err));
      });

    }, function(err){
      console.log(JSON.stringify(err));
    });

    //$scope.goHome();
  }
});


