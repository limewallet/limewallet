bitwallet_services
.service('BitShares', function($translate, $q, $http, $rootScope, Setting, ENVIRONMENT) {
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
          // deferred.resolve('xprv9s21ZrQH143K3ijyttwKLLMY5TXj9QxrGoEg8EbLpsSyNabQ4QrbMzFj5j5FPkc8m58AZrVo8TMH5XEYuL2bdWaD2yhgiF68f9vsMkSTkkS'); // nisman
          // NISMAN: addy:"DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo", pubkey:"DVS5YYZsZ7g1fSpPxmZcJifWJ2rmiXbUyJpEYSdNsVw738C88yvoy", 
          // deferred.resolve('xprv9s21ZrQH143K3PgEC8y59PEEkFN4mHz4tTo9uYCJQbAuLLfxLHLt9HegarddLEP9iGXKpcc2a6c9j8jPtHNZsKXKQpjdg1nuXqAsoQqv7E6');// matu
          
          //deferred.resolve('xprv9s21ZrQH143K28Eo8MEiEbchHxrSFDFMtb73UEh5htu9vzrqpReaeS5vmJHi7aipUb9ck3FTfoj3AQJhdWJ7HL6ywwsuYdMupmPv13osE5c'); // daniel-hadad
          
          deferred.resolve('xprv9s21ZrQH143K4TFHxN8wCgnPUTyaJb7QwVFtvXz8zeyaXZYtmLGamLekc9hQAKZCCh3MW5HrxsjN5rHuLcpqrohVS1YDz1ZZN1nocEm8383'); 
          // xprv9s21ZrQH143K4TFHxN8wCgnPUTyaJb7QwVFtvXz8zeyaXZYtmLGamLekc9hQAKZCCh3MW5HrxsjN5rHuLcpqrohVS1YDz1ZZN1nocEm8383 -> DVSM5HFFtCbhuv3xPfRPauAeQ5GgW7y4UueL
          
          // DVS3NGm7x7NNXLSTLpqGioTZx3e2gfjJG2Rq ??
          
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
    
    self.btcIsValidAddress = function(addy) {
      var deferred = $q.defer();

      deferred.resolve(true);
      // window.plugins.BitsharesPlugin.btcIsValidAddress(
      //   function(data){
      //     deferred.resolve(true);
      //   },
      //   function(error){
      //     deferred.reject(error);
      //   },
      //   addy
      // );

      return deferred.promise;
    };

    self.setTest = function(value) {
      
      if (typeof window.plugins.BitsharesPlugin.setTest === "function") { 
        window.plugins.BitsharesPlugin.setTest(value);
      }
      return;
    };

    self.apiCall = function(url, payload, post) {
      var deferred = $q.defer();
      console.log('Bitshares::apiCall ' + url);

      var req;
      
      if(payload !== undefined || post !==undefined && post==true )
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
    self.listExchangeTxs = function(token, last_updated_at) {
      if(last_updated_at!==undefined)
        return self.updateExchangeTxs(token, last_updated_at);
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/list');
      return self.apiCall(url);
    }
    
    self.updateExchangeTxs = function(token, last_updated_at) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/list/'+last_updated_at/1000);
      return self.apiCall(url);
    }
    
    self.getExchangeTx = function(token, txid) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid);
      return self.apiCall(url);
    }
    
    self.getSellQuote = function(asset, amount, xtx_id) {
      return self.getQuote('sell', asset, amount, xtx_id);
    }
    
    self.getBuyQuote = function(asset, amount, xtx_id) {
      return self.getQuote('buy', asset, amount, xtx_id);
    }
    
    // If xtx_id is defined, the rest of the parameters are useless.
    self.getQuote = function(buy_sell, asset, amount, xtx_id) {
      var assets    = asset.split('_');
      var my_xtx_id = (xtx_id===undefined?'':xtx_id) ;
      var url       = ENVIRONMENT.apiurl('/'+buy_sell+'/'+amount+'/'+assets[0]+'/'+assets[1]+'/'+my_xtx_id);
      return self.apiCall(url);
    }
    
    self.X_DEPOSIT    = 'deposit';
    self.X_WITHDRAW   = 'withdraw';
    self.X_BTC_PAY    = 'btc_pay';
    
    self.isDeposit      = function(ui_type){return ui_type==self.X_DEPOSIT;}
    self.isWithdraw     = function(ui_type){return ui_type==self.X_WITHDRAW;}
    self.isBtcPay       = function(ui_type){return ui_type==self.X_BTC_PAY;}
    self.isXtx          = function(tx){return [self.X_DEPOSIT, self.X_WITHDRAW, self.X_BTC_PAY].indexOf(tx.ui_type)>=0;}
    
    self.isXtxCompleted = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'OK';
    }
    
    self.hasXtxRateChanged = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'RC';
    }
    
    self.isXtxPartiallyOrFullyPaid = function(tx){
      // if(!self.isXtx(tx))
      //   return false;
      var valid_status = ['FP', 'WT', 'RC', 'WC', 'PC', 'TG', 'SC', 'OK']; //, 'XX', 'RR', 'RF'];
      return valid_status.indexOf(tx.status)>=0;
    }

    self.isWatingConfirmation = function(tx){
      // if(!self.isXtx(tx))
      //   return false;
      var valid_status = ['SC', 'OK', 'RR', 'RF'];
      return valid_status.indexOf(tx.status)>=0;
    }
    
    self.isXtxPending = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'WP';
    }
    
    self.acceptQuote = function(quote, signature, token, address, extra_data) {
      return self.acceptReQuote(quote, signature, token, address, extra_data, undefined)
    }
    self.acceptReQuote = function(quote, signature, token, address, extra_data, xtx_id) {
      var url = ENVIRONMENT.apiurl('/accept');

      var payload = {
        quote       : quote,
        signature   : signature, 
        destination : address,
        token       : token,
        extra_data  : extra_data,
        xtx_id      : (xtx_id === undefined ? '' : xtx_id)
      }

      console.log(JSON.stringify(payload));
      return self.apiCall(url, payload);
    }
    
    self.wakeupXTx = function(token, txid) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid+'/wakeup');
      return self.apiCall(url, undefined, true);
    }

    self.cancelXTx = function(token, txid) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid+'/cancel');
      return self.apiCall(url, undefined, true);
    }
    
    self.refundXTx = function(token, txid, refund_address) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid+'/refund');
      var payload = {
        refund_address       : refund_address
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
      var my_asset = asset;
      if (asset.indexOf('bit')!=0)
        my_asset = 'bit'+asset;
      var payload = {
        "asset" : my_asset, 
        "from"  : from,
        "to"    : [{
            "address" : to, 
            "amount"  : amount
        }]
      }

      console.log('VOY CON PREPARE ' + JSON.stringify(payload));

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
