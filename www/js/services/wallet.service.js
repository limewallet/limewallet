bitwallet_services
.service('Wallet', function($translate, T, $rootScope, $q, ENVIRONMENT, BitShares, ReconnectingWebSocket, DB, Memo, Setting, Account, Operation, ExchangeTransaction, Balance, Contact) {
    var self = this;

    self.data = {
      password_required : undefined,
      locked            : undefined,
      mpk               : undefined,
      seed              : undefined,
      salt              : undefined,
      assets            : {},
      asset             : {},
      account           : {},
      accounts          : [],
      ui                : { balance:  { hidden:false, allow_hide:false  } },
      initialized       : false
    }

    self.txs = {
      transactions  : {},
    }

    self.timeout = {
      ping    : 0,
      refresh : 0,
      load    : 0
    };

    self.switchAsset = function(asset_id) {
      self.txs.transactions = [],
      self.setDefaultAsset(asset_id);
      return self.refreshBalance();
    }

    self.setDefaultAsset = function(asset_id) {
      self.data.asset = self.data.assets[asset_id];
    }

    self.setHideBalance = function(hide_balance) {
      self.data.ui.balance.hidden = hide_balance;
    }
    
    self.setAllowHideBalance = function(allow_hide) {
      self.data.ui.balance.allow_hide = allow_hide;
      self.setHideBalance(allow_hide);
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
      var _backend_url = backend_url || ENVIRONMENT.wsurl;
      self.ws = new ReconnectingWebSocket(_backend_url);
      self.ws.onopen       = self.onConnectedToBackend;
      self.ws.onmessage    = self.onNotification;
      self.ws.onconnecting = self.onReconnect;
      self.ws.onerror      = self.onError;
    }

    self.onError = function(err) {
      console.log("WS ERR:" + JSON.stringify(err));
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
      console.log(' ----------- onNotification Vino Evento ------ ')
      console.log(' -- Event: '+event.data);

      ev = JSON.parse(event.data);

      if( ev.name=='bc') {
        //Refresh balance in 100ms, if we get two notifications (Withdraw from two addresses) just refresh once.
        clearTimeout(self.timeout.refresh);
        self.timeout.refresh = setTimeout( function() { 
          console.log(' bc: wallet changed -> loadBalance()');
          self.refreshBalance(); 
        }, 1000);
      }
      else if( ev.name=='xu') {
        ExchangeTransaction.add(ev.data).finally(function() {
          self.loadBalance(); 
        });
      }
    }

    self.getAccountAccessKeys = function() {
      return {
        'akey' : self.data.account.access_key,
        'skey' : self.data.account.secret_key
      }
    }
    
    self.subscribeToNotifications = function() {

      var keys = self.getAccountAccessKeys();

      var cmd = {
        cmd     : 'sub',
        address : self.data.account.address
      }

      var to_sign = '/sub/' + self.data.account.address;
      BitShares.requestSignature(keys, to_sign).then(function(headers) {
        cmd.headers = headers;
        self.ws.send(JSON.stringify(cmd));
      }, function(err) {
        console.log(err);
      });
    }
    
    self.lockData = function(data, password) {

      var deferred = $q.defer();

      proms = [];
      proms.push(BitShares.encryptString(data.seed.value, password));
      proms.push(BitShares.encryptString(data.mpk.value, password));

      // si es valido, penetramos al primer mundo  
      data.accounts.forEach(function(account) {
        proms.push(BitShares.encryptString(account.memo_mpk, password));
        proms.push(BitShares.encryptString(account.account_mpk, password));
        proms.push(BitShares.encryptString(account.privkey, password));
        proms.push(BitShares.encryptString(account.skip32_key, password));
      });

      $q.all(proms).then(function(res){
        data.seed.value  = res[0];
        data.mpk.value   = res[1];
        for(var i=0; i<data.accounts.length;i++){
          data.accounts[i].memo_mpk    = res[2+i*4+0]; 
          data.accounts[i].account_mpk = res[2+i*4+1];  
          data.accounts[i].privkey     = res[2+i*4+2];
          data.accounts[i].skip32_key  = res[2+i*4+3];
          data.accounts[i].encrypted   = 1;
        }
        data.locked = 1;
        deferred.resolve(data);
      }, function(err){
        console.log('Wallet.lockData error#1 '+JSON.stringify(err));
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.lock = function(){

      if(!(self.data.password_required==1 && self.data.locked==0))
      {
        return false;
      }

      for(var i=0; i<self.data.accounts.length;i++){
        self.data.accounts[i].plain_memo_mpk    = undefined; 
        self.data.accounts[i].plain_account_mpk = undefined;  
        self.data.accounts[i].plain_privkey     = undefined;
        self.data.accounts[i].plain_skip32_key  = undefined;
        self.data.accounts[i].encrypted         = 1;
      }
      self.data.seed.plain_value  = undefined;
      self.data.mpk.plain_value   = undefined;
      self.data.locked = 1;

      return true;
    }

    self.unlockData = function(data, password) {

      var deferred = $q.defer();

      proms = [];
      proms.push(BitShares.decryptString(data.seed.value, password));
      proms.push(BitShares.decryptString(data.mpk.value, password));

      // si es valido, penetramos al primer mundo  
      data.accounts.forEach(function(account) {
        proms.push(BitShares.decryptString(account.memo_mpk, password));
        proms.push(BitShares.decryptString(account.account_mpk, password));
        proms.push(BitShares.decryptString(account.privkey, password));
        proms.push(BitShares.decryptString(account.skip32_key, password));
      });

      $q.all(proms).then(function(res){
        data.seed.plain_value  = res[0];
        data.mpk.plain_value   = res[1];
        for(var i=0; i<data.accounts.length;i++){
          data.accounts[i].plain_memo_mpk    = res[2+i*4+0]; 
          data.accounts[i].plain_account_mpk = res[2+i*4+1];  
          data.accounts[i].plain_privkey     = res[2+i*4+2];
          data.accounts[i].plain_skip32_key  = res[2+i*4+3];
          data.accounts[i].encrypted         = 0;
        }
        data.locked = 0;
        deferred.resolve();
      }, function(err){
        console.log('Wallet.unlock error#1 '+JSON.stringify(err));
        deferred.reject(T.i('err.invalid_password'));
      });

      return deferred.promise;
    }

    self.unlock = function(password) {
      var deferred = $q.defer();
      
      if(!(self.data.password_required==1 && self.data.locked==1))
      {
        deferred.resolve();
        return deferred.promise;
      }
      console.log('Wallet.unlock: ['+password+']');
      // chequeamos que podas decrypt la primer merda
      var proms = {
        'pbkdf2'          : BitShares.derivePassword(password, self.data.salt),
        'mpk'             : Setting.get(Setting.MPK)
      }

      $q.all(proms).then(function(res) {

        self.unlockData(self.data, res.pbkdf2.key).then(function() {
          deferred.resolve();
        }, function(err) {
          deferred.reject(err);
        });


      }, function(err) {
        console.log('Wallet.unlock error#2 '+JSON.stringify(err));
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.isLocked = function(){
      if(!(self.data.password_required==1 && self.data.locked==1)) 
        return false;
      return true;
    }    

    // HACKO!
    self.updateActiveAccount = function(name, registered, avatar_hash){
      if(!self.data.account)
      {
        console.log(' -- Wallet.updateActiveAccount cannot update active account!')
        return;
      }
      self.data.account.name = name;
      self.data.account.registered = registered;
      self.data.account.avatar_hash = avatar_hash;
      console.log(' ++ Wallet.updateActiveAccount active account updated !')
    }
    
    self.assetByName = function(name){
      if(!name || !self.data.assets)
        return undefined;
      var keys = Object.keys(self.data.assets);
      for(var i=0; i<keys.length; i++){
       if(self.data.assets[keys[i]].name == name)
        {
          console.log('')
          return self.data.assets[keys[i]];
        }
      }
      return undefined;
    }

    self.load = function() {
      
      var deferred = $q.defer();

      self.loadDB().then(function(data) {
        self.data = data;
        deferred.resolve();
      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    }


    self.loadDB = function() {
      var ptr_data = {
        password_required : undefined,
        locked            : undefined,
        mpk               : undefined,
        seed              : undefined,
        salt              : undefined,
        assets            : {},
        asset             : {},
        account           : {},
        accounts          : [],
        ui                : { balance:  { hidden:false, allow_hide:false  } },
        initialized       : false
      }

      var deferred = $q.defer();

      //Load Assets
      angular.forEach( ENVIRONMENT.assets , function(asset) {
        asset.amount = 0;
        ptr_data.assets[asset.id]  = asset;
      });

      //Load Settings & Accounts
      var keys = {}; 
      keys[Setting.DEFAULT_ASSET]         = ENVIRONMENT.default_asset;
      keys[Setting.UI_HIDE_BALANCE]       = 'false';
      keys[Setting.SEED]                  = '';
      keys[Setting.MPK]                   = '';
      keys[Setting.SALT]                  = '';

      var proms = {
        'setting'   : Setting.getMany(keys),
        'accounts'  : Account.all()
      }

      $q.all(proms).then(function(res) {

        res.accounts.forEach(function(account) {
          
          account.plain_privkey     = undefined;
          account.plain_memo_mpk    = undefined;
          account.plain_account_mpk = undefined;
          account.plain_skip32_key  = undefined;

          //HACK:
          //if(account.active==1) {
            //account.pubkey       = 'DVS6G3wqTYYt8Hpz9pFQiJYpxvUja8cEMNwWuP5wNoxr9NqhF8CLS';
            //account.address      = 'DVSM5HFFtCbhuv3xPfRPauAeQ5GgW7y4UueL';
            //account.privkey      = '5HymcH7QHpzCZNZcKSbstrQc1Q5vcNjCLj9wBk5aqYZcHCR6SzN';
            //account.skip32_priv  = '0102030405060708090A';
            //account.access_key   = '7cMHdvnvhv8Q36c4Xf8HJQaibTi4kpANNaBQYhtzQ2M6';
            //account.secret_key   = '7teitGUUbtaRJY6mnv3mB9d1VB3UggiBQf4kyiL2PaKB';
          //}

          if(account.encrypted==0){
            account.plain_privkey     = account.privkey;
            account.plain_memo_mpk    = account.memo_mpk; 
            account.plain_account_mpk = account.account_mpk; 
            account.plain_skip32_key  = account.skip32_key; 
          }
          
          if(account.active==1){
            ptr_data.account = account;
          }
          ptr_data.accounts.push(account);
        });

        //HACK:
        // ptr_data.account.pubkey       = 'DVS6G3wqTYYt8Hpz9pFQiJYpxvUja8cEMNwWuP5wNoxr9NqhF8CLS';
        // ptr_data.account.address      = 'DVSM5HFFtCbhuv3xPfRPauAeQ5GgW7y4UueL';
        // ptr_data.account.privkey      = '5HymcH7QHpzCZNZcKSbstrQc1Q5vcNjCLj9wBk5aqYZcHCR6SzN';
        // ptr_data.account.skip32_priv  = '0102030405060708090A';
        // ptr_data.account.access_key   = '7cMHdvnvhv8Q36c4Xf8HJQaibTi4kpANNaBQYhtzQ2M6';
        // ptr_data.account.secret_key   = '7teitGUUbtaRJY6mnv3mB9d1VB3UggiBQf4kyiL2PaKB';

        console.log('DUMP DEFAULT ACCOUNT');
        console.log(JSON.stringify(ptr_data.account));

        ptr_data.asset                 = ptr_data.assets[res.setting.default_asset];
        ptr_data.ui.balance.allow_hide = (res.setting.hide_balance == 'true');
        ptr_data.ui.balance.hidden     = (res.setting.hide_balance == 'true');
        ptr_data.salt                  = res.setting.salt;

        ptr_data.seed                  = JSON.parse(res.setting.seed); 
        ptr_data.seed.plain_value      = undefined;
        if( ptr_data.seed.encrypted==0)
          ptr_data.seed.plain_value    = ptr_data.seed.value;
        
        ptr_data.mpk                   = JSON.parse(res.setting.mpk); 
        ptr_data.mpk.plain_value       = undefined;
        if( ptr_data.mpk.encrypted==0)
          ptr_data.mpk.plain_value     = ptr_data.mpk.value;
        
        ptr_data.password_required     = ptr_data.mpk.encrypted;
        ptr_data.locked                = ptr_data.password_required; // Si no tiene passwrd estamos desbloqueados!

        ptr_data.initialized           = true;

        // estoy singupeado?
        //  NO -> tengo passworD?
        //    SI -> pido passworD?
        deferred.resolve(ptr_data);

      }, function(err) {
        //TODO:
        deferred.reject(err);
      });

      return deferred.promise;
    }


    self.init = function() { 
    
      var deferred = $q.defer();
      
      self.load().then(function(){
      
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

    self.lookupContacts = function(ops, to_search) {

      var deferred = $q.defer();
      to_search = to_search || [];

      ops.forEach(function(o) {
        if(o.pubkey != null && o.name == null && to_search.indexOf(o.pubkey) == -1) {
          to_search.push(o.pubkey);
        }  
      });

      console.log('CTOSEARCH ' + JSON.stringify(to_search));

      if( to_search.length == 0 ) {
        deferred.resolve(0);
        return deferred.promise;
      }

      var sql_cmd    = [];
      var sql_params = [];

      BitShares.getAccount(to_search.join(',')).then(function(res) {
        proms = [];
        Object.keys(res).forEach(function(k) {
          if( res[k].error !== undefined ) return;
          var p = BitShares.btsPubToAddress(res[k].owner_key).then(function(addy) {
            var tmp = Contact._add(res[k].name, addy, res[k].owner_key, JSON.stringify(res[k].public_data), 'transfer');
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          }, function(err) {
            console.log( 'lookupContacts errX:' + JSON.stringify(err) );
          });

          proms.push(p);
        });

        $q.all(proms).then(function() {
          console.log('VOY A METER ' + JSON.stringify(sql_cmd) + '-' + JSON.stringify(sql_params));
          DB.queryMany(sql_cmd, sql_params).then(function() {
            deferred.resolve(sql_cmd.length);
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

    self.getPrivateKeyForMemo = function(memo) {
      var deferred = $q.defer();

      //console.log('MEMO INOUT ' + JSON.stringify(memo));
      if( memo.in_out == 0 ) {
        //console.log('RESUELVO CON LA ACCUONT PRIV');
        deferred.resolve(self.data.account.plain_privkey);
        return deferred.promise;
      }

      //null, undefined or 0
      if(!memo.slate || memo.slate==821) {
        //console.log('NULL UNDEFINED OR ZERO');
        deferred.resolve();
        return deferred.promise;
      }

      BitShares.skip32(memo.slate, self.data.account.plain_skip32_key, false).then(function(slate) {

        //console.log('DERIVO PRIVADA INDICE '+ memo.slate + '=>' + slate);

        BitShares.derivePrivate(
          self.data.mpk.plain_value, 
          self.data.account.plain_account_mpk, 
          self.data.account.plain_memo_mpk,
          slate
        ).then(function(res) {
          deferred.resolve(res.privkey);
        }, function(err) {
          console.log('ERRGPK1 ' + JSON.stringify(err));
          deferred.resolve();
        });

      }, function(err) {
        console.log('ERRGPK2 ' + JSON.stringify(err));
        deferred.resolve();
      });

      return deferred.promise;
    }

    self.loadBalance = function(auto_call) {
      var deferred = $q.defer();

      //HACK:
      //self.data.account.encrypted = 0;

      var to_search = [];

      var proms = {
        'balance' : Balance.forAsset(self.data.asset.id),
        'memo'    : self.data.account.encrypted ? [] : Memo.to_decrypt(self.data.account.id)
      }

      $q.all(proms).then(function(res) {

        self.data.asset.int_amount = res.balance.amount;
        self.data.asset.amount     = res.balance.amount/self.data.asset.precision;
        
        proms = {};

        res.memo.forEach(function(m) {
          //if(m.id != 'dce718a423ee9898526b416215b108633b067ed111de6e58279138fb81fb26bb') return;

          proms[m.id] = self.getPrivateKeyForMemo(m).then(function(pk) {
            //console.log('KEY FOR MEMO ' + m.id + ' => ' + pk);
            if(!pk) return; 

            //Entrada: uso mi PK y la otk
            if( m.in_out == 0 )
              return BitShares.decryptMemo(m.one_time_key, m.memo, pk);
          
            //Salida: uso la PK derivada y la publica del destino
            if( m.to_pubkey )
              return BitShares.decryptMemo(m.to_pubkey, m.memo, pk);

            //TODO: send to address, guardo mi memo
            //Si llego aca, es de salida, pero no tengo la pubkey destino .. 
            //tengo que ir a buscar este contacto

            //HACK: pensar bien...
            return BitShares.decryptMemo(m.one_time_key, m.memo, pk);

            //console.log('ESTOY EN LA TWILAAA ZONE ' + m.address);
            //to_search.push(m.address);

          }, function(err) {
            deferred.reject();
          });
        });
 
        $q.all(proms).then(function(res) {

          var sql_cmd    = [];
          var sql_params = [];

          Object.keys(proms).forEach(function(mid) {

            if(!res[mid]) {
              //console.log('Not trying to decrypt memo ...');
              return;
            } 

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

            self.txs.transactions = self.orderTransactions(ops);
            self.lookupContacts(ops, to_search).then(function(n) {
              if( n > 0 && !auto_call) {
                self.loadBalance(true);
              }  
            }, function(err) {
              
            });

            deferred.resolve();

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

        console.log('KEYS a USAR ' + JSON.stringify(keys));

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
                one_time_key : op.one_time_key,
                in_out       : op.type == 'received' || op.type == 'deposit' ? 0 : 1,
                slate        : op.slate,
                address      : op.address      
              }
            }
          });
          

          console.log('MIRA LAS XTXS ' + JSON.stringify(res.xtxs.txs));
          res.xtxs.txs.forEach(function(xtx){
            var tmp = ExchangeTransaction._add(xtx);
            sql_cmd.push(tmp.sql);
            sql_params.push(tmp.params);
          });

          Memo.in( Object.keys(memos) ).then(function(memos_in) {

            //console.log('XXXX => ' + JSON.stringify(memos_in));

            Object.keys(memos).forEach(function(mid){
              if ( memos_in.indexOf(mid) != -1 ) return;

              var tmp = Memo._add(memos[mid]);
              sql_cmd.push(tmp.sql);
              sql_params.push(tmp.params);
              console.log('Voy a meter memo ID ' + mid);
            });

            DB.queryMany(sql_cmd, sql_params).then(function(res) {
              
              console.log('Todo metido en la DB!!!');
              //Data is on the DB 
              self.loadBalance().then(function() {
                deferred.resolve();
                console.log('Luego del load balanccciio!!!');
                self.emit(self.REFRESH_DONE);
              }, function(err) {
                self.refreshError(deferred, 'refreshError #0', err);
              });

            }, function(err) {
              self.refreshError(deferred, 'refreshError #1', err);
            });

          }, function(err) {
            self.refreshError(deferred, 'refreshError #2', err);
          });

        }, function(err){
          self.refreshError(deferred, 'refreshError #3', err);
        });

      }, function(err){
        self.refreshError(deferred, 'refreshError #4', err);
      });

      return deferred.promise;
    }

    return self;
});

