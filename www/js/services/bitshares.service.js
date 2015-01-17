bit_wallet_services
//Bitshares Service
.factory('BitShares', function($translate, $q, $http, MasterKey, $rootScope, ENVIRONMENT) {
    var self = this;

    self.createMasterKey = function() {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMasterKey(
        function(data){
          deferred.resolve(data.masterPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
      );
    
      return deferred.promise;
    };

    self.extractDataFromKey = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extractDataFromKey(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.extendedPublicFromPrivate = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extendedPublicFromPrivate(
        function(data){
          deferred.resolve(data.extendedPublicKey);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.encryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.encryptString(
        function(data){
          deferred.resolve(data.encryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.decryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.decryptString(
        function(data){
          deferred.resolve(data.decryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.isValidKey = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidKey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.isValidWif = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidWif(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        wif
      );

      return deferred.promise;
    };

    self.derivePrivate = function(key, deriv) {
      var deferred = $q.defer();
      
      window.plugins.BitsharesPlugin.derivePrivate(
        function(data){
          deferred.resolve(data.extendedPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
        , key
        , deriv
      );

      return deferred.promise;
    };

    self.compactSignatureForHash = function(hash, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.compactSignatureForHash(
        function(data){
          deferred.resolve(data.compactSignatureForHash);
        },
        function(error){
          deferred.reject(error);
        }
        , hash
        , key
      );

      return deferred.promise;
    };

    self.btsWifToAddress = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsWifToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , wif
      );

      return deferred.promise;
    };

    self.btsPubToAddress = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsPubToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , pubkey
      );

      return deferred.promise;
    };

    self.btsIsValidAddress = function(addy) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidAddress(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        addy
      );

      return deferred.promise;
    };

    self.btsIsValidPubkey = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidPubkey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        pubkey
      );

      return deferred.promise;
    };
    
    self.setTest = function(value) {
      
      if (typeof window.plugins.BitsharesPlugin.setTest === "function") { 
        window.plugins.BitsharesPlugin.setTest(value);
      }
      return;
    };

    self.getBalance = function(address) {
      var url      = ENVIRONMENT.apiurl('/addrs/'+address+'/balance');
      var deferred = $q.defer();

      $http.get(url, {timeout:ENVIRONMENT.timeout})
      .success(function(res) {
        if(!angular.isUndefined(res.error))
          return deferred.reject(res.error);
        return deferred.resolve(res);
      })
      .error(function(data, status, headers, config) {
        return deferred.reject();
      });

      return deferred.promise;
    }


    return self;
});

