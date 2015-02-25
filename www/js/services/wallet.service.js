bitwallet_services
.service('Wallet', function($translate, $rootScope, $q, ENVIRONMENT, BitShares, ReconnectingWebSocket, MasterKey, Address, Setting, AddressBook, Account, Operation, ExchangeTransaction, Balance, RawOperation) {
    var self = this;

    self.data = {
      assets            : {},
      assets_symbol     : {},
      asset             : {},
      address_book      : {},
      addresses         : {},
      transactions      : [],
      ord_transactions  : {},
      raw_txs           : {},
      account           : {},
      ui                : { balance:  { hidden:false, allow_hide:false  } },
      initialized  : false
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
      return self.loadBalance();
      //return self.refreshBalance();
    }

    self.setDefaultAsset = function(asset_id) {
      self.data.asset = self.data.assets[asset_id];
      Setting.set(Setting.DEFAULT_ASSET, asset_id);
    }
    
    self.setUIHideBalance = function(hide_balance) {
      self.data.ui.balance.allow_hide = hide_balance;
      Setting.set(Setting.UI_ALLOW_HIDE_BALANCE, hide_balance);
    }
    
    self.loadUIConfig = function(){
      var deferred = $q.defer();
      Setting.get(Setting.UI_ALLOW_HIDE_BALANCE, false).then(function(hide_balance){
        self.data.ui.balance.allow_hide = hide_balance.value;
        self.data.ui.balance.hidden     = hide_balance.value;
        //console.log('load UI_ALLOW_HIDE_BALANCE:' + hide_balance.value);  
        deferred.resolve();
      }, function(error){
        deferred.resolve();
      });
      
      return deferred.promise;
    }
    self.ADDRESS_BOOK_CHANGE = 'w-address-book-changed';
    self.NEW_BALANCE         = 'w-new-balance';
    self.REFRESH_START       = 'w-refresh-start';
    self.REFRESH_DONE        = 'w-refresh-done';
    self.REFRESH_ERROR       = 'w-refresh-error';
    self.DATA_INITIALIZED    = 'w-data-initialized';
    
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
        var addys_book = [];
        addys.forEach(function(addr) {
          addys_book[addr.address] = addr;
        });
        self.data.address_book = addys_book;

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
      //console.log(JSON.stringify(event.data));
      if(event.data.indexOf('bc') == 0 || event.data.indexOf('xu') == 0) {
        //Refresh balance in 100ms, if we get two notifications (Withdraw from two addresses) just refresh once.
        clearTimeout(self.timeout.refresh);
        self.timeout.refresh = setTimeout( function() { self.refreshBalance(); }, 100);
      } 
    }

    self.subscribeToNotifications = function() {
      self.getMasterPubkey().then(function(res) {
        Setting.get(Setting.BSW_TOKEN, false).then(function(bsw_token){
          var sub = res.masterPubkey + ':' + res.deriv;
          if( bsw_token === false )
            self.ws.send('sub ' + sub);
          else
          {
            console.log('mando : ' + bsw_token.value + ' ' + sub);
            self.ws.send('sub2 ' + bsw_token.value + ' ' + sub);
          }
        }, function(error){
          console.log('Unable to subscribe to events 2:' + err);   
        });
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
        self.data.assets[asset.id]            = asset;
        self.data.assets_symbol[asset.symbol] = asset;
      });

      //Create master key
      self.getMasterPrivKey()
      .then(function() {
        
        //Get default asset
        Setting.get(Setting.DEFAULT_ASSET, ENVIRONMENT.default_asset)
        .then(function(default_asset){
          //console.log('Seting::DEFAULT_ASSET ' + JSON.stringify(default_asset));
          self.data.asset = self.data.assets[default_asset.value];
          
          // Load ui config
          self.loadUIConfig().then(function(account) {
                
            //Load derived address from masterkey
            self.loadAccountAddresses()
            .then(function() {

              //Load addressbook
              self.loadAddressBook().then(function() {
                //deferred.resolve();
                
                // Load account data (bitshares accountname, photo)
                self.loadAccount().then(function(account) {
                
                  //Remove last WS TOKEN
                  //Setting.remove(Setting.BSW_TOKEN).then(function(){
                    
                    self.loadBalance().then(function(){
                      deferred.resolve();
                      self.data.initialized = true;
                      self.emit(self.DATA_INITIALIZED);
                    }, function(error){
                      deferred.resolve();
                      self.data.initialized = true;
                      self.emit(self.DATA_INITIALIZED);
                    })
                    
                  //}, function(){
                    //deferred.resolve();
                    //self.data.initialized = true;
                    //self.emit(self.DATA_INITIALIZED);
                  //});
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

    self.getMasterPrivKey = function() {

      var deferred = $q.defer();

      MasterKey.get().then(function(masterPrivateKey) {

        if(masterPrivateKey !== undefined) {
          //console.log('Wallet::createMasterKey master key present');
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
    
    self.configMoment = function(){
      moment.locale('en', {
      calendar : {
          sameDay : '[Today]',
          lastDay : '[Yesterday]',
          lastWeek : '[last week]',
          nextWeek : 'dddd [at] LT',
          sameElse : 'L'
          }
      });
      var moment = require('moment');
      moment.locale('en', {
        relativeTime : {
            future: "in %s",
            past:   "%s",
            s:  "seconds",
            m:  "a minute",
            mm: "%d minutes",
            h:  "an hour",
            hh: "%d hours",
            d:  "a day",
            dd: "%d days",
            M:  "a month",
            MM: "%d months",
            y:  "a year",
            yy: "%d years"
        }
      });
    }
    self.truncateDate = function(timestamp, now, now_m_y, now_week, now_year){
      var my_moment = moment(timestamp);
      if(my_moment.fromNow()=='today')
        return '0_today';
      if(my_moment.week()==now_week && my_moment.year()==now_year)
        return '1_this_week';
      if(my_moment.format('YYYY-MM')==now_m_y)
        return '2_this_month';
      return my_moment.year()==now_year ? my_moment.format('MMMM') : my_moment.format('MMMM YYYY');
    }
    self.orderTransactions = function(data){
      //self.configMoment();
      // Boxes: TODAY, (yesterday?), THIS WEEK, LAST WEEK, THIS MONTH, LAST MONTH, MONTH
      var now       = moment();
      var now_m_y   = now.format('YYYY-MM');
      var now_week  = now.week();
      var now_year  = now.year();
      var orderedTxs = {};
      angular.forEach(data, function(tx) {
        var box = self.truncateDate(tx.TS, now, now_m_y, now_week, now_year);
        if(!orderedTxs[box]) 
        {
          orderedTxs[box] = [];
        }
        orderedTxs[box].push(tx);
      });
      return orderedTxs;
    }
    
    self.loadBalance = function(){
      var deferred = $q.defer();
      Balance.all().then(function(balances){
        angular.forEach(balances, function(balance) {
          self.data.assets[balance.asset_id].amount = balance.amount;
        });
      },
      function(error){
        console.log(' -- Erro Wallet loadBalance 1'); console.log(error);
      })
      Operation.allWithXTxForAsset(self.data.asset.id).then(function(res){
        self.data.ord_transactions  = self.orderTransactions(res);
        self.data.transactions      = res; 
        deferred.resolve();
        self.emit(self.REFRESH_DONE);
      },
      function(error){
        console.log(' -- Erro Wallet loadBalance 2'); console.log(error);
        deferred.reject(error);
        self.emit(self.REFRESH_ERROR);
      });
      return deferred.promise;
    }
    
    self.refreshBalance = function() {
      var deferred = $q.defer();
      console.log('Wallet : self.refreshBalance IN');
      self.emit(self.REFRESH_START);
      self.getMasterPubkey().then(function(res) {
        console.log('Wallet : self.refreshBalance 1');
        // Load last BTS Transaction BlockHash, and last Exchamge Operation updated_at;
        var last_block_id = undefined;
        var last_updated_at = undefined;
        var prom1 = Operation.lastUpdate().then(function(res){
          console.log('Wallet : self.refreshBalance 2');
          if(res!==undefined)
            last_block_id = res.block_id;
        }, function(error){
          console.log('Wallet : Error Operation.lastUpdate()');
        });
        var prom2 = ExchangeTransaction.lastUpdate().then(function(res){
          console.log('Wallet : self.refreshBalance 3');
          if(res!==undefined) 
            last_updated_at = res.updated_at;
        }, function(error){
          console.log('Wallet : Error ExchangeTransaction.lastUpdate()');
        });
        $q.all([prom1, prom2]).then(function(){
          console.log('Wallet : self.refreshBalance 4');
          console.log('Wallet : calling BitShares.getBalance last_block_id:['+last_block_id+']');
          BitShares.getBalance(res.masterPubkey+':'+res.deriv, last_block_id).then(function(res) {
            
            var proms = [];
            if(res.resync !== undefined && res.resync == true)
            {  
              var p = Operation.clear();
              proms.push(p);
              var pr = RawOperation.clear();
              proms.push(pr);
            }
            
            $q.all(proms).then(function(){
              console.log('Wallet : self.refreshBalance 5');
              var date = new Date();
              //Update assets balance
              res.balances.forEach(function(bal){
                Balance.addObj({asset_id:bal.asset_id, amount:bal.amount/self.data.assets[bal.asset_id].precision, raw_amount:bal.amount, updated_at:date.getTime()});
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
              console.log('Wallet : self.refreshBalance 6');
              //Generate tx list
              var prom = self.buildTxList(res, self.data.asset.id);
              
              console.log('Wallet : self.refreshBalance 7');
              console.log('Wallet : calling BitShares.listExchangeTxs last_updated_at:['+last_updated_at+']');
              //Get Exchange Transactions
              var prom2 = self.getExchangeTransactions(last_updated_at);
              
              return $q.all([prom, prom2]).then(function(){
                console.log('Wallet : self.refreshBalance 8');
                self.loadBalance().then(function(){
                  deferred.resolve();
                }, function(error){
                  console.log(' -- Erro Wallet 66'); console.log(error);
                  deferred.reject(error);
                  self.emit(self.REFRESH_ERROR);
                });
              }, function(error){
                console.log(' -- Erro Wallet 2'); console.log(error);
                deferred.reject(error);
                self.emit(self.REFRESH_ERROR);
              })
            
            })
            
          }, function(err) {
            console.log(' -- Erro Wallet 3'); console.log(err);
            deferred.reject(err);
            self.emit(self.REFRESH_ERROR);
          })
       }, function(error){
          console.log(' -- Erro Wallet 4');  console.log(error);
          deferred.reject(error); 
          self.emit(self.REFRESH_ERROR);
       })
      }, function(err) {
        console.log(' -- Erro Wallet 5');  console.log(err);
        deferred.reject(err); 
        self.emit(self.REFRESH_ERROR);
      });
      return deferred.promise;
    };
    
    self.getExchangeTransactions = function(last_updated_at){
      var deferred = $q.defer();
      var address = self.getMainAddress();
      BitShares.getBackendToken(address).then(function(token){
        BitShares.listExchangeTxs(token, last_updated_at).then(function(res){
          var proms = [];
          res.txs.forEach(function(o){
            o['tx_type']      = o.extra_data=='marty'?'deposit':o.extra_data;
            o['x_id']         = o.id;
            o.quoted_at       = o.quoted_at*1000;
            o.updated_at      = o.updated_at*1000;
            if(o.tx_type==BitShares.X_DEPOSIT)
            {
              // cl_pay_tx  -> bitcoin
              // cl_recv_tx -> bitshares
              o['x_asset_id']   = parseInt(self.data.assets_symbol[o.cl_recv_curr].id);
              // My symbol es cl_recv_curr
            }
            else{
              // My symbol es cl_pay_curr
              o['x_asset_id']   = parseInt(self.data.assets_symbol[o.cl_pay_curr].id);
            }
            var p = ExchangeTransaction.addObj(o);
            proms.push(p);
          });
          $q.all(proms).then(function(){
            deferred.resolve();
          },function(error){
            console.log(' -- Error Wallet getXTx 1'); console.log(error);
            deferred.reject(error); 
          })
        }, function(error){
          if(error=='auth_failed')
            Setting.remove(Setting.BSW_TOKEN);
          console.log(' -- Error Wallet getXTx 2'); console.log(error);
          deferred.reject(error); 
        })
      }, function(error){
        console.log(' -- Error Wallet getXTx 3'); console.log(error);
        deferred.reject(error); 
      })
      
      return deferred.promise;
    }
    self.buildTxList = function(res, asset_id) {
       self.data.raw_txs = [];
       var tx  = {};
       var txs = [];

       var db_proms = [];
       
       var close_tx = function() {

        var assets = Object.keys(tx['assets']);
        for(var i=0; i<assets.length; i++) {
           var precision = self.data.assets[assets[i]].precision;
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
           p['tx_id']     = tx['txid'];
           p['asset_id']  = assets[i];
           p['block']     = tx['block'];    //tx['assets'][assets[i]]['block'];
           p['block_id']  = tx['block_id']; //tx['assets'][assets[i]]['block_id'];
           p['other']     = tx['other'];    //tx['assets'][assets[i]]['other'];
           p['id']        = tx['assets'][assets[i]]['id'];
           txs.push(p);
           var db_prom = Operation.addObj(p);
           db_proms.push(db_prom);
           var r_proms = RawOperation.addTXs(self.data.raw_txs[tx['txid']]);
           db_proms.push(r_proms);
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
            tx['other']       = o.other,
            tx['block']       = o.block,
            tx['block_id']    = o.block_id
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
              'i_d'         : false
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

       //self.data.transactions=txs; 
       return $q.all(db_proms);
    };

    self.loadAccount = function() {
      self.data.account = { name          : 'unregistered', 
                            gravatar_id   : undefined,
                            registered    : 0,
                            photo         :'img/user_empty.png'};
                            
      var deferred = $q.defer();
      Account.get().then(function(result){
        //console.log('loadAccount::' + JSON.stringify(result));
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
    
    self.updateAccountFromNetwork = function(addy){
      BitShares.getAccount(addy.pubkey).then(
        function(data){
          var gravatar_id = undefined;
          if(data.public_data && data.public_data.gravatarId)
            gravatar_id=data.public_data.gravatarId;
          Account.store(data.name, gravatar_id).then(function(){
            Account.registeredOk().then(function(){
              self.loadAccount();
            });
          });
        },
        function(error){
        }
      )
    };
    return self;
});

