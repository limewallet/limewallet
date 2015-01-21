bitwallet_services
.service('BitShares', function($translate, $q, $http, MasterKey, $rootScope, Setting, ENVIRONMENT) {
    var self = this;

    self.compactSignatureForMessage = function(msg, wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.compactSignatureForMessage(
        function(data){
          deferred.resolve(data.compactSignatureForHash);
        },
        function(error){
          deferred.reject(error);
        },
        msg, 
        wif
      );
    
      return deferred.promise;
    };

    self.recoverPubkey = function(msg, signature) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.recoverPubkey(
        function(data){
          deferred.resolve(data.pubKey);
        },
        function(error){
          deferred.reject(error);
        },
        msg, 
        signature
      );
    
      return deferred.promise;
    };


    self.createMasterKey = function() {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMasterKey(
        function(data){
          //deferred.resolve('xprv9s21ZrQH143K3ijyttwKLLMY5TXj9QxrGoEg8EbLpsSyNabQ4QrbMzFj5j5FPkc8m58AZrVo8TMH5XEYuL2bdWaD2yhgiF68f9vsMkSTkkS');
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

    self.apiCall = function(url, payload) {
      var deferred = $q.defer();
      console.log('Bitshares::apiCall ' + url);

      var req;
      
      if(payload !== undefined)
      {
        console.log('ApiCall POST ' + JSON.stringify(payload));
        req = $http.post(url, payload ,{timeout:ENVIRONMENT.timeout});
      }
      else
        req = $http.get(url, {timeout:ENVIRONMENT.timeout});

      req.success(function(res) {
        console.log('vuelve APICALL ' + JSON.stringify(res));
        if(!angular.isUndefined(res.error))
          deferred.reject(res.error);
        else
          deferred.resolve(res);
      })
      .error(function(data, status, headers, config) {
        deferred.reject();
      });

      return deferred.promise;
    }

    self.getBalance = function(address) {
      var url = ENVIRONMENT.apiurl('/addrs/'+address+'/balance');
      return self.apiCall(url);
    }

    self.getSignupInfo = function() {
      var url = ENVIRONMENT.apiurl('/signup');
      return self.apiCall(url);
    }
    
    self.getAccount = function(name) {
      var url = ENVIRONMENT.apiurl('/account/'+name);
      return self.apiCall(url);
    }
    
    self.pushSignupInfo = function(signupInfo) {
      var url = ENVIRONMENT.apiurl('/signup');
      return self.apiCall(url, signupInfo);
    }

    self.registerAccount = function(token, address, account) {
      var url = ENVIRONMENT.apiurl('/account');

      var payload = {
        name       : account.name,
        pubkey     : address.pubkey, 
        gravatarId : account.gravatar_id,
        token      : token
      }

      return self.apiCall(url, payload);
    }
    
    self.getBackendToken = function(address) {

      var deferred = $q.defer();

      Setting.get(Setting.BSW_TOKEN).then(function(res) {

        if(res !== undefined) {
          deferred.resolve(res.value);
          return;
        }

        self.getSignupInfo().then(function(res) {
          self.recoverPubkey(res.msg, res.signature).then(function(pubkey) {
            if( pubkey != ENVIRONMENT.apiPubkey ) {
              deferred.reject('invalid pub key');
              return;
            }
            self.compactSignatureForMessage(res.msg, address.privkey).then(function(signature) {
              var myData = {
                message   : res.msg,
                signature : signature,
                pubkey    : address.pubkey
              };
              
              self.pushSignupInfo(myData).then(function(res) {

                if(angular.isUndefined(res.token)) {
                  deferred.reject('invalid token');
                  return;
                }

                Setting.set(Setting.BSW_TOKEN, res.token).then(function() {
                  deferred.resolve(res.token);
                }, function(err) {
                  deferred.reject(err);
                });

              }, function(err) {
                deferred.reject(err);
              });

            }, function(err) {
              deferred.reject(err);
            });

          }, function(err) {
            deferred.reject(err);
          });

        }, function(err) {
          deferred.reject(err);
        });

      }, function(err) {
        deferred.reject(err); 
      });

      return deferred.promise;
    }

    return self;
});
