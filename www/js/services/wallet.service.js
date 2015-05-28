bitwallet_services
.service('Wallet', function($translate, $rootScope, $q, ENVIRONMENT, BitShares, ReconnectingWebSocket, DB, Memo, Setting, Account, Operation, ExchangeTransaction, Balance, Contact) {
    var self = this;

    self.data = {
      password_required : undefined,
      locked            : undefined,
      mpk               : undefined,
      seed              : undefined,
      assets            : {},
      asset             : {},
      transactions      : [1],
      ord_transactions  : {},
      account           : {},
      accounts          : [],
      ui                : { balance:  { hidden:false, allow_hide:false  } },
      initialized       : false
    }

    self.timeout = {
      ping    : 0,
      refresh : 0,
      load    : 0
    };

    self.switchAsset = function(asset_id) {
      self.data.transactions = [],
      self.setDefaultAsset(asset_id);
      return self.refreshBalance();
    }

    self.setDefaultAsset = function(asset_id) {
      self.data.asset = self.data.assets[asset_id];
      Setting.set(Setting.DEFAULT_ASSET, asset_id);
    }

    self.setHideBalance = function(hide_balance) {
      self.data.ui.balance.hidden = hide_balance;
      Setting.set(Setting.UI_, allow_hide);
    }
    
    self.setAllowHideBalance = function(allow_hide) {
      self.data.ui.balance.allow_hide = allow_hide;
      Setting.set(Setting.UI_ALLOW_HIDE_BALANCE, allow_hide);
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

    self.canSend = function (amount) {
      console.log('CANSEND: ' + self.data.asset.int_amount + ' - ' + amount );
      return self.data.asset.int_amount - amount;
    }

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

    self.getAccountAccessKeys = function() {
      var keys = undefined;
      
      if (self.data.account.access_key !== undefined) {
        keys = {
          'akey' : self.data.account.access_key,
          'skey' : self.data.account.secret_key
        };
      }

      return keys;    
    }
    
    self.subscribeToNotifications = function() {

      // var keys = undefined;
      
      // if (self.data.account.access_key !== undefined) {
      //   keys = {
      //     'akey' : self.data.account.access_key,
      //     'skey' : self.data.account.secret_key
      //   };
      // }

      var keys = self.self.getAccountAccessKeys();

      var cmd = {
        cmd     : 'sub',
        address : self.data.account.address
      }

      if( keys === undefined ) {
        self.ws.send(JSON.stringify(cmd));
      }

      var to_sign = '/sub/' + self.data.account.address;
      BitShares.requestSignature(keys, to_sign).then(function(headers) {
        cmd.headers = headers;
        self.ws.send(JSON.stringify(cmd));
      }, function(err) {
        console.log(err);
      });
    }

    self.lock = function(){

      if(!(self.data.password_required==1 && self.data.locked==0))
      {
        return;
      }

      for(var i=0; i<self.data.accounts.length;i++){
        self.data.accounts[i].plain_memo_mpk  = undefined; 
        self.data.accounts[i].account_mpk     = undefined;  
        self.data.accounts[i].plain_privkey   = undefined;
        self.data.accounts[i].encrypted       = 1;
      }
      self.data.seed.plain_value  = undefined;
      self.data.mpk.plain_value   = undefined;
      self.data.locked = 1;

      return;
    }

    self.unlock = function(password) {
      var deferred = $q.defer();
      
      if(!(self.data.password_required==1 && self.data.locked==1))
      {
        deferred.resolve();
        return deferred.promise;
      }

      // chequeamos que el hash del password es la misma mierda que tenemos guardada, sino error.
      var proms = {
        'pbkdf2'          : BitShares.pbkdf2(password),
        'hashed_password' : Setting.get(Setting.PASSWORD_HASH),
        'mpk'             : Setting.get(Setting.MPK)
      }

      $q.all(proms).then(function(res) {

        if(res.pbkdf2.key_hash != res.hashed_password.value)
        {
          deferred.reject(T.i('err.invalid_password'));
          return;
        }
        
        proms = [];
        proms.push(BitShares.decryptString(self.data.seed.value, res.pbkdf2.key));
        proms.push(BitShares.decryptString(self.data.mpk.value, res.pbkdf2.key));

        // si es valido, penetramos al primer mundo  
        self.data.accounts.forEach(function(account) {
          proms.push(BitShares.decryptString(account.memo_mpk, res.pbkdf2.key));
          proms.push(BitShares.decryptString(account.account_mpk, res.pbkdf2.key));
          proms.push(BitShares.decryptString(account.privkey, res.pbkdf2.key));
        });

        $q.all(proms).then(function(res){
          self.data.seed.plain_value  = res[0];
          self.data.mpk.plain_value   = res[1];
          for(var i=0; i<self.data.accounts.length;i++){
            self.data.accounts[i].plain_memo_mpk  = res[2+i*3+0]; 
            self.data.accounts[i].account_mpk     = res[2+i*3+1];  
            self.data.accounts[i].plain_privkey   = res[2+i*3+2];
            self.data.accounts[i].encrypted       = 0;
          }
          self.data.locked = 0;
          deferred.resolve();
        }, function(err){
          deferred.reject(err);
        })

      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    }

    // self.signup = function(){
    //   // signup
    //   if(self.data.locked==0 && !self.getAccountAccessKeys())
    //     BitShares.signup(self.data.account);

    // }

    self.init = function() {

      var deferred = $q.defer();

      //Load Assets
      angular.forEach( ENVIRONMENT.assets , function(asset) {
        asset.amount = 0;
        self.data.assets[asset.id]  = asset;
      });

      var keys = {}; 
      keys[Setting.DEFAULT_ASSET]         = ENVIRONMENT.default_asset;
      keys[Setting.UI_HIDE_BALANCE]       = false;
      keys[Setting.UI_ALLOW_HIDE_BALANCE] = false;
      keys[Setting.SEED]                  = '';
      keys[Setting.MPK]                   = '';

      var proms = {
        'setting'   : Setting.getMany(keys),
        'accounts'  : Account.all()
      }

      $q.all(proms).then(function(res) {

        res.accounts.forEach(function(account) {
          account.plain_privkey  = undefined;
          account.plain_memo_mpk = undefined; 
          account.account_mpk    = undefined;

          if(account.encrypted==0){
            account.plain_privkey     = account.privkey;
            account.plain_memo_mpk    = account.memo_mpk; 
            account.plain_account_mpk = account.account_mpk; 
          }

          if(account.active==1){
            self.data.account = account;
          }
          
          self.data.accounts.push(account);
        });

        //self.signup();
        
        console.log('DUMP DEFAULT ACCOUNT');
        console.log(JSON.stringify(res.account));

        self.data.asset                 = self.data.assets[res.setting.default_asset];
        self.data.ui.balance.allow_hide = res.setting.allow_hide_balance;
        self.data.ui.balance.hidden     = res.setting.hide_balance;
        
        self.data.seed                  = JSON.parse(res.setting.seed); 
        self.data.seed.plain_value      = undefined;
        if( self.data.seed.encrypted==0)
          self.data.seed.plain_value    = self.data.seed.value;
        
        self.data.mpk                   = JSON.parse(res.setting.mpk); 
        self.data.mpk.plain_value       = undefined;
        if( self.data.mpk.encrypted==0)
          self.data.mpk.plain_value     = self.data.mpk.value;
        
        self.data.password_required     = self.data.mpk.encrypted;
        self.data.locked                = self.data.password_required; // Si no tiene passwrd estamos desbloqueados!

        self.data.initialized           = true;

        // estoy singupeado?
        //  NO -> tengo passworD?
        //    SI -> pido passworD?

        self.connectToBackend(ENVIRONMENT.wsurl);

        deferred.resolve();

      }, function(err) {
        //TODO:
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
        //TUNNING:
        tx.amount = tx.amount/self.data.asset.precision;
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

    self.lookupContacts = function(ops) {

      var deferred = $q.defer();

      var proms = {};
      ops.forEach(function(o) {
        if(o.pubkey != null && o.name == null) {
          proms[o.pubkey] = BitShares.getAccount(o.pubkey);
        }  
      });

      if( Object.keys(proms).length == 0 ) {
        deferred.resolve();
        return deferred.promise;
      }

      var sql_cmd    = [];
      var sql_params = [];

      $q.all(proms).then(function(res) {

        proms = [];
        Object.keys(res).forEach(function(pubkey) {
          if( res[pubkey].error !== undefined ) return;
          var p = BitShares.btsPubToAddress(pubkey).then(function(addy) {
            var tmp = Contact._add(pubkey, res[pubkey].name, addy, JSON.stringify(res[pubkey].public_data), 'transfer');
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          }, function(err) {
            console.log( 'lookupContacts errX:' + JSON.stringify(err) );
          });

          proms.push(p);
        });

        $q.all(proms).then(function() {
          DB.queryMany(sql_cmd, sql_params).then(function() {
            deferred.resolve();
          }, function(err) {
            console.log( 'lookupContacts err1:' + JSON.stringify(err) );
            deferred.reject(err);
          });
        }, function(err) {
          console.log( 'lookupContacts err10:' + JSON.stringify(err) );
          deferred.reject(err);
        });

      }, function(err) {
        console.log( 'lookupContacts err2:' + JSON.stringify(err) );
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.loadBalance = function() {
      var deferred = $q.defer();

      //HACK:
      self.data.account.encrypted = 0;

      var proms = {
        'balance' : Balance.forAsset(self.data.asset.id),
        'memo'    : self.data.account.encrypted ? [] : Memo.to_decrypt(self.data.account.id)
      }

      $q.all(proms).then(function(res) {

        self.data.asset.int_amount = res.balance.amount;
        self.data.asset.amount     = res.balance.amount/self.data.asset.precision;
        
        proms = {};
        res.memo.forEach(function(m) {
          proms[m.id] = BitShares.decryptMemo(m.one_time_key, m.memo, self.data.account.privkey);
        });
 
        $q.all(proms).then(function(res) {

          var sql_cmd    = [];
          var sql_params = [];
          Object.keys(proms).forEach(function(mid) {
            if(!res[mid].error) {
              var tmp = Memo._decrypt(mid, res[mid].message, res[mid].from);
              sql_cmd.push(tmp.sql);
              sql_params.push(tmp.params);
            } else {
              console.log('Error decrypting memo ...');
            }
          });            

          //Insert decrypted memos 
          DB.queryMany(sql_cmd, sql_params).then(function() {

          Operation.all().then(function(ops) {

            self.data.ord_transactions = self.orderTransactions(ops);
            self.lookupContacts(ops);

          }, function(err) {
            console.log( 'loadBalance err0:' + JSON.stringify(err) );
            deferred.reject(err);
          });

          }, function(err) {
            console.log( 'loadBalance err1:' + JSON.stringify(err) );
            deferred.reject(err);
          });

        }, function(err) {
          console.log( 'loadBalance err2:' + JSON.stringify(err) );
          deferred.reject(err);
        });

      }, function(err) {
        console.log( 'loadBalance err3:' + JSON.stringify(err) );
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.refreshBalance = function(from_start) {

      if (from_start === undefined)
        from_start = true;

      self.emit(self.REFRESH_START);
      var deferred = $q.defer();

      var proms = {
        'block_id' : from_start ? undefined : Operation.lastUpdate(),
        'last_xtx' : from_start ? undefined : ExchangeTransaction.lastUpdate()
      };

      var sql_cmd    = [];
      var sql_params = [];

      $q.all(proms).then(function(res) { 

        console.log('refreshBalance: PARAMS: from_start: ' + from_start + ' - block_id: ' + res.block_id + ' - last_xtx: ' + res.last_xtx);

        var keys = {
          'akey' : self.data.account.access_key,
          'skey' : self.data.account.secret_key
        }

        proms = { 
          'ops'  : BitShares.getBalance(self.data.account.address, res.block_id, self.data.asset.id),
          'xtxs' : BitShares.listExchangeTxs(keys, res.last_xtx, self.data.asset.id)
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

          var memos = {};
          res.ops.operations.forEach(function(op){
            var tmp = Operation._add(op);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);

            if( op.memo_hash ) {
              memos[op.memo_hash] = {
                id           : op.memo_hash,
                account      : self.data.account.id,
                memo         : op.memo,
                one_time_key : op.one_time_key
              }
            }
          });
          
          res.xtxs.txs.forEach(function(xtx){
            var tmp = ExchangeTransaction._add(xtx);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          });

          //console.log('VAMOS POR ACA');

          Memo.in( Object.keys(memos) ).then(function(memos_in) {

            //memos_in.forEach(function(m) {
              //delete memos[m.id];
            //});

            Object.keys(memos).forEach(function(mid){
              //console.log('VAMOS POR ACA 3 ' + JSON.stringify(mid));

              var tmp = Memo._add(memos[mid]);
              //console.log('VAMOS POR ACA 4 ' + tmp.sql);
              sql_cmd.push(tmp.sql);
              sql_params.push(tmp.params);
            });

            DB.queryMany(sql_cmd, sql_params).then(function(res) {
              
              console.log('Todo metido en la DB!!!');
              //Data is on the DB 
              self.loadBalance().then(function() {
                deferred.resolve();
              }, function(err) {
                deferred.reject(err); 
              });

            }, function(err) {
              deferred.reject(err);
            });


          }, function(err) {
            console.log(JSON.stringify(err));
            deferred.reject(err);
          });


        }, function(err){
          deferred.reject(err);
        });

      }, function(err){
        deferred.reject(err);
      });

      return deferred.promise;

    }

    return self;
});

