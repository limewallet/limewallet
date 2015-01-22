bitwallet_services
.service('Wallet', function($translate, $rootScope, $q, ENVIRONMENT, BitShares, ReconnectingWebSocket, MasterKey, Address, Setting, AddressBook, Account) {
    var self = this;

    self.data = {
      assets        : {},
      asset         : {},
      address_book  : {},
      addresses     : {},
      transactions  : [],
      raw_txs       : {},
      account       : {},
    }

    self.timeout = {
      ping    : 0,
      refresh : 0
    };

    self.setRefreshing = function(param) {
      self.is_refreshing.val = param;
    }

    self.switchAsset = function(asset_id) {
      self.data.transactions = [],
      self.setDefaultAsset(asset_id);
      return self.refreshBalance(true);
    }

    self.setDefaultAsset = function(asset_id) {
      self.data.asset = self.data.assets[asset_id];
      Setting.set(Setting.DEFAULT_ASSET, asset_id);
    }

    self.ADDRESS_BOOK_CHANGE = 'w-address-book-changed';
    self.NEW_BALANCE         = 'w-new-balance';
    self.REFRESH_START       = 'w-refresh-start';
    self.REFRESH_DONE        = 'w-refresh-done';
    self.REFRESH_ERROR       = 'w-refresh-error';

    self.emit = function(event_id, event_data) {
      $rootScope.$emit(event_id, event_data);
    }

    self.getMainAddress = function() {
      var res;
      angular.forEach( Object.keys(self.data.addresses), function(addy) {
        if( self.data.addresses[addy].deriv == -1 ) {
          res = self.data.addresses[addy];
        }
      });
      return res;
    }
    
    self.loadAccountAddresses = function() {
      var deferred = $q.defer();
      Address.all().then(function(addys) {
        var new_balance_addys   = [];
        var balance_addys_keys  = Object.keys(self.data.addresses);
        
        angular.forEach(addys, function(addr) {
          addr.balances = {};
          if(balance_addys_keys.indexOf(addr.address)>-1)
            addr.balances = self.data.addresses[addr.address].balances;
          new_balance_addys[addr.address] = addr;  
        });
        self.data.addresses = new_balance_addys;
        deferred.resolve();
      }, function(err) {
        //DB Error (Address::all)
        deferred.reject(err);
      });
      return deferred.promise;
    };
    
    self.deriveNewAddress = function() {
      var deferred = $q.defer();
      
      MasterKey.get().then(function(master_key) {
        master_key.deriv = parseInt(master_key.deriv)+1;

        BitShares.derivePrivate(master_key.key, master_key.deriv)
        .then(
          function(extendedPrivateKey){
            BitShares.extractDataFromKey(extendedPrivateKey)
            .then(
              function(keyData){
                MasterKey.store(master_key.key, master_key.deriv).then(function() {
                  Address.create(master_key.deriv, 
                                keyData.address, 
                                keyData.pubkey, 
                                keyData.privkey, 
                                false, '').then(function(){
                    self.loadAccountAddresses().then(function(){
                        self.subscribeToNotifications();
                        deferred.resolve();
                    },
                    function(err){
                      deferred.reject(err);
                    })
                  });
                });
                
            },
            function(err){
              deferred.reject(err);
            })
        },
        function(err){
          deferred.reject(err);
        })
      });
     
      return deferred.promise;
    };
    
    self.onDerivedAddressChanged = function(){
      var deferred = $q.defer();
      // var addresses = [];
      // angular.copy(self.data.addresses, addresses);
      // Address.all().then(function(addys) {
        // angular.forEach(addys, function(addr) {
          // if(addresses[addr.address])
            // addresses[addr.address].label = addr.label;  
        // });
        // self.data.addresses = addresses;
        // deferred.resolve();
      // }, function(err) {
        // //DB Error (Address::all)
        // deferred.reject(err);
      // });
      self.loadAccountAddresses().then(function(){
        deferred.resolve();
      });
      return deferred.promise;
      
    }
    
    self.onAddressBookChanged = function() {
      var txs = [];
      angular.copy(self.data.transactions, txs);
      for(var i=0; i<txs.length; i++) {
         if(txs[i]['addr_name'] != 'Me')
         {
           if( txs[i]['address'] in self.data.address_book )
            txs[i]['addr_name'] = self.data.address_book[txs[i]['address']].name;
           else
            txs[i]['addr_name'] = txs[i]['address'];
         }
         //console.log('ADDRNAME => ' + txs[i]['addr_name']);
      }
      self.data.transactions = txs;
        
    }

    self.loadAddressBook = function() {
      var deferred = $q.defer();
      AddressBook.all()
      .then(function(addys) {
        
        addys.forEach(function(addr) {
          self.data.address_book[addr.address] = addr;
        });

        deferred.resolve();
      },
      function(err) {
        //DB Error (AddressBook::all)
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.disconnect_count = 0;
    self.connectToBackend = function(backend_url) {
      self.ws = new ReconnectingWebSocket(backend_url);
      self.ws.onopen       = self.onConnectedToBackend;
      self.ws.onmessage    = self.onNotification;
      self.ws.onconnecting = self.onReconnect;
    }

    self.onReconnect = function() {
      self.disconnect_count++;
    }

    self.onConnectedToBackend = function () {
      self.subscribeToNotifications();
      if( self.disconnect_count > 0 )
        self.refreshBalance();
    };

    self.onNotification = function (event) {
      clearTimeout(self.timeout.ping);
      self.timeout.ping = setTimeout( function() { self.ws.send('ping'); }, 10000);

      if(event.data.indexOf('nb') == 2) {
        //Refresh balance in 100ms, if we get two notifications (Withdraw from two addresses) just refresh once.
        clearTimeout(self.timeout.refresh);
        self.timeout.refresh = setTimeout( function() { self.refreshBalance(); }, 100);
      } 
    }

    self.subscribeToNotifications = function() {
      self.getMasterPubkey().then(function(res) {
        var sub = res.masterPubkey + ':' + res.deriv;
        self.ws.send('sub ' + sub);
      }, function(err) {
        console.log('Unable to subscribe to events:' + err);   
      });
    }

    self.init = function() {
      var deferred = $q.defer();

      self.connectToBackend(ENVIRONMENT.wsurl);

      //Load Assets
      angular.forEach( ENVIRONMENT.assets , function(asset) {
        asset.amount = 0;
        self.data.assets[asset.id] = asset;
      });

      //Create master key
      self.getMasterPrivKey()
      .then(function() {
        
        //Get default asset
        Setting.get(Setting.DEFAULT_ASSET, ENVIRONMENT.default_asset)
        .then(function(default_asset){
          console.log('Seting::DEFAULT_ASSET ' + JSON.stringify(default_asset));
          self.data.asset = self.data.assets[default_asset.value];

          //Load derived address from masterkey
          self.loadAccountAddresses()
          .then(function() {

            //Load addressbook
            self.loadAddressBook().then(function() {
              //deferred.resolve();
              
              // Load account data (bitshares accountname, photo)
              self.loadAccount().then(function(account) {
                deferred.resolve();
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

    self.getMasterPrivKey = function() {

      var deferred = $q.defer();

      MasterKey.get().then(function(masterPrivateKey) {

        if(masterPrivateKey !== undefined) {
          console.log('Wallet::createMasterKey master key present');
          deferred.resolve(masterPrivateKey);
          return;
        }

        BitShares.createMasterKey().then(function(masterPrivateKey){
          BitShares.extractDataFromKey(masterPrivateKey).then(function(keyData){
            MasterKey.store(masterPrivateKey, -1).then(function() {
              Address.create(
                -1, 
                keyData.address, 
                keyData.pubkey, 
                keyData.privkey, 
                true, 
                'main').then(function() {
                  $rootScope.master_key_new = true;
                  deferred.resolve({key:masterPrivateKey, deriv:-1});  
                },function(err) {
                  //DB Error (Address::create) 
                  deferred.reject(err);
                });
            },
            function(err){ 
              //DB Error (MasterKey::store)
              deferred.reject(err);
            });
          },
          function(err) {
            //Plugin error (BitShares.extractDataFromKey);
            deferred.reject(err); 
          });
        },
        function(err) {
          //Plugin error (BitShares.createMasterKey);
          deferred.reject(err); 
        });

      }, 
      function(err) {
        //DB Error (MasterKey::get)
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.getMasterPubkey = function() {

      var deferred = $q.defer();
      self.getMasterPrivKey().then(function(masterPrivateKey) {
        BitShares.extendedPublicFromPrivate(masterPrivateKey.key).then(function(extendedPublicKey){
          deferred.resolve({masterPubkey:extendedPublicKey, deriv:masterPrivateKey.deriv});
        }, function(err) {
          deferred.reject(err);  
        })
      }, function(err) {
        deferred.reject(err);    
      });

      return deferred.promise;
    } 
    
    self.refreshBalance = function() {
      var deferred = $q.defer();

      self.emit(self.REFRESH_START);

      self.getMasterPubkey().then(function(res) {
        BitShares.getBalanceForAsset(res.masterPubkey+':'+res.deriv, self.data.asset.id).then(function(res) {

          //Update assets balance
          res.balances.forEach(function(bal){
            self.data.assets[bal.asset_id].amount = bal.amount/self.data.assets[bal.asset_id].precision;
          });

          self.data.asset = self.data.assets[self.data.asset.id];

          //Update address balance
          angular.forEach(Object.keys(self.data.addresses), function(addy) {
            if (addy in res.address_balance) {
              self.data.addresses[addy].balances = res.address_balance[addy];
              angular.forEach( Object.keys(self.data.addresses[addy].balances), function(asset_id) {
                self.data.addresses[addy].balances[asset_id] /= self.data.assets[asset_id].precision;
              });
            }
          });

          //Generate tx list
          self.buildTxList(res, self.data.asset.id);

          deferred.resolve();
          self.emit(self.REFRESH_DONE);
        }, function(err) {
          deferred.reject(err);
          self.emit(self.REFRESH_ERROR);
        })
      }, function(err) {
        deferred.reject(err); 
        self.emit(self.REFRESH_ERROR);
      });

      return deferred.promise;
    };

    self.buildTxList = function(res, asset_id) {

       var tx  = {};
       var txs = [];

       var close_tx = function() {

        var precision = self.data.asset.precision;
        var assets = Object.keys(tx['assets']);
        for(var i=0; i<assets.length; i++) {
           p = {}; 
           p['fee']  = (tx['assets'][assets[i]]['w_amount'] - tx['assets'][assets[i]]['d_amount'])/precision;
           p['sign'] = 0;
           p['date'] = tx['assets'][assets[i]]['timestamp']*1000;
           if(tx['assets'][assets[i]]['i_w']) { 
             p['sign']--;
             p['address'] = tx['assets'][assets[i]]['to'][0];
             p['amount'] = tx['assets'][assets[i]]['my_w_amount']/precision - p['fee'];
           }
           if(tx['assets'][assets[i]]['i_d']) { 
             p['sign']++;
             p['address'] = tx['assets'][assets[i]]['from'][0];
             p['amount'] = tx['assets'][assets[i]]['my_d_amount']/precision;
           }
           if(p['sign'] == 0)
           {
             p['addr_name'] = 'Me';
           }

           if(p['addr_name'] != 'Me')
           {
             if( p['address'] in self.data.address_book )
              p['addr_name'] = self.data.address_book[p['address']].name;
             else
              p['addr_name'] = p['address'];
           }
           p['tx_id'] = tx['txid'];
           txs.push(p);
         }
         tx = {};
       }

       //console.log(JSON.stringify(res));

       res.operations.forEach(function(o){

         if(o.asset_id != asset_id)
         {
           //console.log('me voy xq ' + o.asset_id + '!=' + asset_id);
           return;
         }

         //Esto es para mostrar en el detalle de "renglon"
         //TODO: Pedir por API
         if(!(o.txid in self.data.raw_txs) )
           self.data.raw_txs[o.txid] = [];
         self.data.raw_txs[o.txid].push(o);

         
         if( tx['txid'] !== undefined && tx['txid'] != o.txid ) {
            //console.log('mando a cerrar');
            close_tx();
         }

         if( tx['txid'] === undefined || ( tx['assets'] !== undefined && !(o.asset_id in tx['assets']) )  ) {

            //console.log('abro');
            
            tx['txid']        = o.txid;
            tx['assets']      = {};
            tx['assets'][o.asset_id] = {
              'id'          : o.id,
              'from'        : [],
              'to'          : [],
              'w_amount'    : 0,
              'my_w_amount' : 0,
              'd_amount'    : 0,
              'my_d_amount' : 0,
              'timestamp'   : o.timestamp,
              'i_w'         : false,
              'i_d'         : false,
            }
         } 

         if(o.op_type == 'w') { 
            tx['assets'][o.asset_id]['w_amount'] += o.amount
            if(o.address in self.data.addresses) {
              tx['assets'][o.asset_id]['my_w_amount'] += o.amount;
              tx['assets'][o.asset_id]['i_w']          = true;
            } else {
              //TODO: lookup in the address book
              tx['assets'][o.asset_id]['from'].push(o.address);
            }
            
         } else {
            tx['assets'][o.asset_id]['d_amount'] += o.amount
            if(o.address in self.data.addresses) {
              tx['assets'][o.asset_id]['my_d_amount'] += o.amount
              tx['assets'][o.asset_id]['i_d']          = true;
            } else {
              //TODO: lookup in the address book
              tx['assets'][o.asset_id]['to'].push(o.address)
            }
         }
         
       });

       //console.log('salgo del loop con ' + tx['txid']);

       if( tx['txid'] !== undefined) {
         //console.log('mando a cerrar');
         close_tx();
       }

       self.data.transactions=txs;
    };

    self.loadAccount = function() {
      self.data.account = { name          : 'unregistered', 
                            gravatar_id   : undefined,
                            registered    : 0,
                            photo         :'img/user_empty.png'};
                            
      var deferred = $q.defer();
      Account.get().then(function(result){
        console.log('loadAccount::' + JSON.stringify(result));
        if(result!==undefined)
          self.data.account = { name          : result.name, 
                                gravatar_id   : result.gravatar_id,
                                registered    : result.registered,
                                photo         :(result.gravatar_id===undefined || result.gravatar_id===null || result.gravatar_id.length==0)
                                                ?'http://robohash.org/'+result.name+'?size=56x56'
                                                :'http://www.gravatar.com/avatar/'+result.gravatar_id+'?s=150'};
        deferred.resolve(self.data.account);
      });
      return deferred.promise;
    };
    
    return self;
});

