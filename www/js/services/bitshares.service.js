bitwallet_services
.service('BitShares', function($translate, $q, $http, $rootScope, Setting, ENVIRONMENT) {
    var self = this;

    self.requestSignature = function(keys, url, _body) {
      var deferred = $q.defer();

      var body  = _body || '';
      var path  = self.urlPath(url);
      var nonce = Math.floor(Date.now()/1000);

      window.plugins.BitsharesPlugin.requestSignature(
        function(data){
          var headers = {
            'ACCESS-KEY'       : keys.akey,
            'ACCESS-NONCE'     : nonce,
            'ACCESS-SIGNATURE' : data.signature,
          };
          deferred.resolve(headers);
        },
        function(error){
          deferred.reject(error);
        },
        keys.skey, 
        nonce,
        path,
        body
      );
    
      return deferred.promise;
    };

    self.mnemonicToMasterKey = function(words) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.mnemonicToMasterKey(
        function(data){
          deferred.resolve(data.masterPrivateKey);
        },
        function(error){
          deferred.reject(error);
        },
        words
      );
    
      return deferred.promise;
    };

    self.createMnemonic = function(entropy) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMnemonic(
        function(data){
          deferred.resolve(data.words);
        },
        function(error){
          deferred.reject(error);
        },
        entropy
      );
    
      return deferred.promise;
    };

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
          // btc Bso7DduduMapkTDW7HNWXf5dMCcYcNdpXi
          
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

    self.extractDataFromKey = function(parent, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extractDataFromKey(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        },
        parent,
        key
      );

      return deferred.promise;
    };

    self.extendedPublicFromPrivate = function(parent, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extendedPublicFromPrivate(
        function(data){
          deferred.resolve(data.extendedPublicKey);
        },
        function(error){
          deferred.reject(error);
        },
        parent,
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

    self.isValidKey = function(parent, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidKey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        parent,
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

    self.derivePrivate = function(parent, key, deriv) {
      var deferred = $q.defer();
      
      window.plugins.BitsharesPlugin.derivePrivate(
        function(data){
          deferred.resolve(data.extendedPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
        , parent
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

    self.urlPath = function(url) {
      //console.log('URLPATH: ' + url);
      return url.substr(url.indexOf('/', url.indexOf('://')+3));
    }

    self.apiCall = function(keys, url, payload) {

      if (keys === undefined) {
        return self.apiCallStub(url, payload);
      }

      var deferred = $q.defer();

      self.requestSignature(keys, url, payload).then(function(headers) {
        self.apiCallStub(url, payload, headers).then(function(res){
          deferred.resolve(res);
        }, function(err){
          deferred.reject(err);
        });
      }, function(err) {
        deferred.reject('Unable to sign request:' + JSON.stringify(err));
      });

      return deferred.promise;
    }

    self.apiCallStub = function(url, payload, _headers) {

      var deferred = $q.defer();
      console.log('Bitshares::apiCallStub ' + url);

      var req;

      var headers = _headers || {};

      console.log('HEADERS: ' + JSON.stringify(headers));
      
      if(payload !== undefined){
        req = $http.post(url, payload ,{timeout:ENVIRONMENT.timeout, headers:headers});
      }
      else{
        req = $http.get(url, {timeout:ENVIRONMENT.timeout, headers:headers});
      }

      req.success(function(res) {
        console.log('vuelve APICALL ' + JSON.stringify(res));
        if(!angular.isUndefined(res.error))
        {
          console.log('APICALLSTUB: RESUELVO CON ERROR');
          deferred.reject(res.error);
        }
        else
        {
          console.log('APICALLSTUB: RESUELVO OK');
          deferred.resolve(res);
        }
      })
      .error(function(data, status, headers, config) {
        deferred.reject();
      });

      return deferred.promise;
    }

    self.searchAccount = function(query) {
      return self.apiCall(undefined, ENVIRONMENT.apiurl('/account/'+query+'?find=true') );
    }

    // *************************************************** //
    // Exchange Service Api Calls ************************ //
    // *************************************************** //
    self.listExchangeTxs = function(keys, before) {
      var filter = '';
      if( before !== undefined)
        filter = '?before='+before;

      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs'+filter) );
    }
    
    self.getExchangeTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+txid));
    }
    
    self.getSellQuote = function(asset, amount) {
      return self.getQuote('sell', asset, amount);
    }
    
    self.getBuyQuote = function(asset, amount) {
      return self.getQuote('buy', asset, amount);
    }
    
    // If xtx_id is defined, the rest of the parameters are useless.
    self.getQuote = function(buy_sell, asset, amount) {
      var assets    = asset.split('_');
      var url       = ENVIRONMENT.apiurl('/'+buy_sell+'/'+amount+'/'+assets[0]+'/'+assets[1]);
      return self.apiCall(undefined, url);
    }

    self.getReQuote = function(keys, xtx_id) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/' + xtx_id + '/requote'));
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
    
    self.canCancelXTx = function(tx){
      if(!self.isXtx(tx))
        return false;
      return tx.status == 'WP';
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

    self.notRateChanged = function(tx){
      // if(!self.isXtx(tx))
      //   return false;
      var valid_status = ['FP', 'WT', 'WC', 'PC', 'TG', 'SC', 'OK']; //, 'XX', 'RR', 'RF'];
      return valid_status.indexOf(tx.status)>=0;
    }
    
    // self.isXtxPending = function(tx){
    //   if(!self.isXtx(tx))
    //     return false;
    //   return tx.status == 'WP';
    // }
    
    self.acceptQuote = function(quote, signature, keys, address, extra_data) {
      return self.acceptReQuote(quote, signature, keys, address, extra_data, undefined)
    }

    self.acceptReQuote = function(quote, signature, keys, address, extra_data, xtx_id) {

      var payload = JSON.stringify({
        quote       : quote,
        signature   : signature, 
        destination : address,
        extra_data  : extra_data,
        xtx_id      : (xtx_id === undefined ? '' : xtx_id)
      });

      return self.apiCall(keys, ENVIRONMENT.apiurl('/accept'), payload);
    }
    
    self.wakeupXTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+txid+'/wakeup'));
    }

    self.cancelXTx = function(keys, txid) {
      return self.apiCall(keys, ENVIRONMENT.apiurl('/xtxs/'+token+'/'+txid+'/cancel'));
    }
    
    self.refundXTx = function(keys, txid, refund_address) {
      var url = ENVIRONMENT.apiurl('/xtxs/'+txid+'/refund');
      var payload = JSON.stringify({
        refund_address : refund_address
      });
      return self.apiCall(keys, url, payload);
    }
    
    // *************************************************** //
    // Assets Operations Api Calls *********************** //
    
    self.getBalance = function(address, before) {

      var filter = '';
      if( before !== undefined)
        filter = '?before='+before;

      return self.apiCall(undefined, ENVIRONMENT.apiurl('/addrs/'+address+filter));
    }
    
    self.prepareSendAsset = function(asset, from, to, amount) {
      var url = ENVIRONMENT.apiurl('/txs/new');
      var my_asset = asset;

      if (asset.indexOf('bit')!=0)
        my_asset = 'bit'+asset;

      var payload = JSON.stringify({
        "asset" : my_asset, 
        "from"  : from,
        "to"    : [{
            "address" : to, 
            "amount"  : amount
        }]
      });

      return self.apiCall(undefined, url, payload);
    }
    
    self.sendAsset = function(tx, secret) {
      var url = ENVIRONMENT.apiurl('/txs/send');

      var payload = JSON.stringify({
        'tx'      : tx, 
        'secret'  : secret
      });
      
      return self.apiCall(undefined, url, payload);
    }
    
    // *************************************************** //
    // Account Api Calls ********************************* //
    
    self.getSignupInfo = function() {
      var url = ENVIRONMENT.apiurl('/signup');
      return self.apiCall(undefined, url);
    }
    
    self.getAccount = function(name) {
      var url = ENVIRONMENT.apiurl('/account/'+name);
      return self.apiCall(undefined, url);
    }
              
    self.pushSignupInfo = function(message, signature, pubkey) {

      var url = ENVIRONMENT.apiurl('/signup');

      var payload = JSON.stringify({
        message   : message,
        signature : signature,
        pubkey    : pubkey
      });

      return self.apiCall(undefined, url, payload)
    }

    self.registerAccount = function(keys, address, account) {
      var url = ENVIRONMENT.apiurl('/account');

      var payload = JSON.stringify({
        name       : account.name,
        pubkey     : address.pubkey, 
        gravatarId : account.gravatar_id,
        token      : token
      });

      return self.apiCall(keys, url, payload);
    }
    
    self.updateAccount = function(keys, addys, assets, account) {
      var url = ENVIRONMENT.apiurl('/txs/update_account');

      var payload = JSON.stringify({
        pay_from      : addys,
        pay_in        : assets, 
        name          : account.name,
        public_data   : {gravatarId:account.gravatar_id},
        token         : token
      });

      return self.apiCall(keys, url, payload);
    }
    
    self.sendTx = function(secret, tx) {
      var url = ENVIRONMENT.apiurl('/txs/send');
      var payload = JSON.stringify({
        secret      : secret,
        tx          : tx,
      });

      return self.apiCall(url, payload);
    }

    self.getBackendToken = function(address) {

      var deferred = $q.defer();

      Setting.get(Setting.BSW_TOKEN).then(function(res) {

        if(res !== undefined) {
          console.log('BitShares.getBackendToken:'+res.value);
          var tmp = res.value.split(';');
          deferred.resolve({akey:tmp[0],skey:tmp[1]});
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

              self.pushSignupInfo(res.msg, signature, address.pubkey).then(function(res) {

                if( angular.isUndefined(res.access_key) || angular.isUndefined(res.secret_key) ) {
                  deferred.reject('invalid keys');
                  return;
                }

                Setting.set(Setting.BSW_TOKEN, [res.access_key, res.secret_key].join(';')).then(function() {
                  console.log('BitShares.getBackendToken:'+res.access_key);
                  deferred.resolve({akey:res.access_key,skey:res.secret_key});
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
