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
          //deferred.resolve('xprv9s21ZrQH143K3ijyttwKLLMY5TXj9QxrGoEg8EbLpsSyNabQ4QrbMzFj5j5FPkc8m58AZrVo8TMH5XEYuL2bdWaD2yhgiF68f9vsMkSTkkS'); // nisman
          deferred.resolve('xprv9s21ZrQH143K28Eo8MEiEbchHxrSFDFMtb73UEh5htu9vzrqpReaeS5vmJHi7aipUb9ck3FTfoj3AQJhdWJ7HL6ywwsuYdMupmPv13osE5c'); // daniel-hadad
          //deferred.resolve(data.masterPrivateKey);
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
        //console.log('ApiCall POST ' + JSON.stringify(payload));
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

    // *************************************************** //
    // Exchange Service Api Calls ************************ //
    self.listExchangeTxs = function(token, last_id) {
      if(last_id!==undefined)
        return self.updateExchangeTxs(token, last_id);
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/list');
      return self.apiCall(url);
    }
    
    self.updateExchangeTxs = function(token, last_id) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/list/newer/'+last_id);
      return self.apiCall(url);
    }
    
    self.getExchangeTx = function(token, txid) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid);
      return self.apiCall(url);
    }
    
    self.getSellQuote = function(asset, amount) {
      var url = ENVIRONMENT.apiurl('/sell/'+asset+'/'+amount);
      return self.apiCall(url);
    }
    
    self.getBuyQuote = function(asset, amount) {
      var url = ENVIRONMENT.apiurl('/buy/'+asset+'/'+amount);
      return self.apiCall(url);
    }
    
    self.X_DEPOSIT    = 'deposit';
    self.X_WITHDRAW   = 'withdraw';
    self.X_BTC_PAY    = 'btc_pay';
    
    self.acceptQuote = function(quote, signature, token, address, extra_data) {
      var url = ENVIRONMENT.apiurl('/accept');

      var payload = {
        quote       : quote,
        signature   : signature, 
        destination : address,
        token       : token,
        extra_data  : extra_data
      }

      return self.apiCall(url, payload);
    }
    
    // *************************************************** //
    // Assets Operations Api Calls *********************** //
    
    self.getBalance = function(address, last_block_id) {
      // var url = ENVIRONMENT.apiurl('/addrs/'+address+'/balance');
      // return self.apiCall(url);
      if(last_block_id!==undefined)
        return self.updateBalance(address, last_block_id);
      var url = ENVIRONMENT.apiurl('/addrs/'+address+'/history');
      return self.apiCall(url);
    }

    self.updateBalance = function(address, last_block_id) {
      //var url = ENVIRONMENT.apiurl('/addrs/'+address+'/balance/' + asset_id);
      var url = ENVIRONMENT.apiurl('/addrs/'+address+'/history/newer/'+last_block_id);
      return self.apiCall(url);
    }
    
    self.prepareSendAsset = function(asset, from, to, amount) {
      var url = ENVIRONMENT.apiurl('/txs/new');

      var payload = {
        "asset" : asset, 
        "from"  : from,
        "to"    : [{
            "address" : to, 
            "amount"  : amount
        }]
      }

      return self.apiCall(url, payload);
    }
    
    self.sendAsset = function(tx, secret) {
      var url = ENVIRONMENT.apiurl('/txs/send');

      var payload = {
        'tx'      : tx, 
        'secret'  : secret
      }
      
      return self.apiCall(url, payload);
    }
    
    // *************************************************** //
    // Account Api Calls ********************************* //
    
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
    
    self.updateAccount = function(token, addys, assets, account) {
      var url = ENVIRONMENT.apiurl('/txs/update_account');

      var payload = {
        pay_from      : addys,
        pay_in        : assets, 
        name          : account.name,
        public_data   : {gravatarId:account.gravatar_id},
        token         : token
      }

      return self.apiCall(url, payload);
    }
    
    self.sendTx = function(token, secret, tx) {
      var url = ENVIRONMENT.apiurl('/txs/send');

      var payload = {
        secret      : secret,
        tx          : tx,
        token       : token
      }

      return self.apiCall(url, payload);
    }
    
    self.getBackendToken = function(address) {

      var deferred = $q.defer();

      Setting.get(Setting.BSW_TOKEN).then(function(res) {

        if(res !== undefined) {
          console.log('BitShares.getBackendToken:'+res.value);
          deferred.resolve(res.value);
          return;
        }

        self.getSignupInfo().then(function(res) {
          self.recoverPubkey(res.msg, res.signature).then(function(pubkey) {
            //console.log(pubkey);
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
                  console.log('BitShares.getBackendToken:'+res.token);
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
