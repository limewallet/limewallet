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
      account           : {},
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

      var proms = {
        'default_asset' : Setting.get(Setting.DEFAULT_ASSET, ENVIRONMENT.default_asset),
        'hide_balance'  : Setting.get(Setting.UI_HIDE_BALANCE, false),
        'allow_hide'    : Setting.get(Setting.UI_ALLOW_HIDE_BALANCE, false),
        'account'       : Account.active()
      }

      $q.all(proms).then(function(res) {
        self.data.asset                 = self.data.assets[res.default_asset.value];
        self.data.ui.balance.allow_hide = res.allow_hide.value;
        self.data.ui.balance.hidden     = res.hide_balance.value;
        self.data.account               = res.account;
        self.data.initialized           = true;
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

    self.loadBalance = function() {
      var deferred = $q.defer();
      
      Operation.all().then(function(ops) {
        self.data.ord_transactions = self.orderTransactions(ops)
        console.log( JSON.stringify(self.data.ord_transactions) );
      }, function(err) {
        console.log( JSON.stringify(err) );
      });

      return deferred.promise;
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
            
            //Data is on the DB 
            self.loadBalance().then(function() {
              deferred.resolve();
            }, function(err) {
              deferred.reject(err); 
            });

          }, function(err) {
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

