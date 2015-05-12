bitwallet_services
.service('Wallet', function($translate, $rootScope, $q, ENVIRONMENT, BitShares, ReconnectingWebSocket, DB, Setting, Account, Operation, ExchangeTransaction, Balance) {
    var self = this;

    self.data = {
      assets            : {},
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
      refresh : 0,
      load    : 0
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
      deferred.reject('Sorry! Derive address is not available.');
      return;
      Account.get().then(function(master_key) {
        master_key.deriv = parseInt(master_key.deriv)+1;

        BitShares.derivePrivate(master_key.key, master_key.deriv)
        .then(
          function(extendedPrivateKey){
            BitShares.extractDataFromKey(extendedPrivateKey)
            .then(
              function(keyData){
                Account.storeKey(master_key.key, master_key.deriv).then(function() {
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
      //clearTimeout(self.timeout.ping);
      //self.timeout.ping = setTimeout( function() { self.ws.send('ping'); }, 10000);
      console.log(' ----------- onNotification Vino Evento ------ ')
      console.log(' -- Event: '+JSON.stringify(event.data));
      var json_event = undefined;
      try {
        json_event = JSON.parse(event.data);
      }
      catch(err) {
        console.log('Error parsing json event :(');
        return;
      }
      if(json_event === undefined)
        return;
      if(json_event.event=='bc'){
        //Refresh balance in 100ms, if we get two notifications (Withdraw from two addresses) just refresh once.
        clearTimeout(self.timeout.refresh);
        self.timeout.refresh = setTimeout( function() { self.refreshBalance(); }, 1000);
        // self.buildTxList = function(event.data, self.data.asset.id) {
      }
      else if( json_event.event=='xu')
      {
        //  agarro la xtx y update or insert, luego llamo a loadBalance
        if(json_event.data.id===undefined || !json_event.data.extra_data || json_event.data.extra_data.length<=0)
        {
          console.log(' evento de mierda!!!!!!!!!!!!');
          return;
        }
        self.onNewXTx(json_event.data);
        //self.loadBalance();
        clearTimeout(self.timeout.load);
        self.timeout.load = setTimeout( function() { 
            console.log(' wallet changed -> loadBalance()');
            self.loadBalance(); 
          }, 1000);
        //self.loadBalance();
      }
    }

    self.subscribeToNotifications = function() {
      // HACKO
      return undefined;
      
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
        self.data.assets[asset.id]  = asset;
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

      return deferred.promise;
    }
    
    self.truncateDate = function(timestamp, now, now_y_m_d, now_y_m, now_week, now_year){
      var my_moment = moment(timestamp);
      if(my_moment.format('YYYY-MM-DD')==now_y_m_d)
        return '0_today';
      if(my_moment.week()==now_week && my_moment.year()==now_year)
      { 
        return '1_this_week';
      }
      if(my_moment.format('YYYY-MM')==now_y_m)
        return '2_this_month';
      return my_moment.format('YYYY-MM');
      //return my_moment.year()==now_year ? my_moment.format('MMMM') : my_moment.format('MMMM YYYY');
    }

    self.orderTransactions = function(data){
      var now             = moment();
      var now_y_m_d       = now.format('YYYY-MM-DD');
      var now_y_m         = now.format('YYYY-MM');
      var now_week        = now.week();
      var now_year        = now.year();
      var orderedTxs      = {};
      var orderedKeys     = [];

      angular.forEach(data, function(tx) {
        var box = self.truncateDate(tx.TS, now, now_y_m_d, now_y_m, now_week, now_year);
        if(!orderedTxs[box]) {
          orderedTxs[box] = [];
          orderedKeys.push(box);
        }
        orderedTxs[box].push(tx);
      });
      orderedTxs['orderedKeys'] = orderedKeys;
      return orderedTxs;
    }
    
    self.refreshError = function(d, err, log_msg) {
      console.log('refreshError: ' + log_msg + '->' + JSON.stringify(err));
      self.emit(self.REFRESH_ERROR);
      d.reject(err); 
    }
  
    self.refreshBalance = function(from_start) {

      if (from_start === undefined)
        from_start = true;

      self.emit(self.REFRESH_START);
      var deferred = $q.defer();

      var proms = {
        'account'  : Account.active(),
        'block_id' : from_start ? undefined : Operation.lastUpdate(),
        'last_xtx' : from_start ? undefined : ExchangeTransaction.lastUpdate()
      };

      var sql_cmd    = [];
      var sql_params = [];

      $q.all(proms).then(function(res) { 

        console.log('refreshBalance: PARAMS: from_start: ' + from_start + ' - block_id: ' + res.block_id + ' - last_xtx: ' + res.last_xtx);

        var keys = {
          'akey' : res.account.access_key,
          'skey' : res.account.secret_key
        }

        proms = { 
          'ops'  : BitShares.getBalance(res.account.address, res.block_id),
          'xtxs' : BitShares.listExchangeTxs(keys, res.last_xtx)
        }

        $q.all(proms).then(function(res) {

          if (from_start) {
            sql_cmd.push('DELETE FROM OPERATION'); sql_params.push([]);
            sql_cmd.push('DELETE FROM EXCHANGE_TRANSACTION'); sql_params.push([]);
            sql_cmd.push('DELETE FROM BALANCE'); sql_params.push([]);
          }
            
          res.ops.balances.forEach(function(bal){
            var tmp = Balance._add(bal);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          });

          res.ops.operations.forEach(function(op){
            var tmp = Operation._add(op);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          });
          
          res.xtxs.txs.forEach(function(xtx){
            var tmp = ExchangeTransaction._add(xtx);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          });

          DB.queryMany(sql_cmd, sql_params).then(function(res) {
            console.log('refreshBalance: PARECE QUE METI TODO!!!');
          }, function(err) {
            console.log('refreshBalance: Err 1 :' + err);
          });


        }, function(err){
          console.log('refreshBalance: Err 2');
        });

      }, function(err){
        console.log('refreshBalance: Err 3');
      });

    }

    return self;
});

