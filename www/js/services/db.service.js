bitwallet_services
.service('DB', function($q, DB_CONFIG) {
    var self = this;
    self.db = null;
 
    self.init = function(remove, check_tables) {
        if(remove) {
          window.sqlitePlugin.deleteDatabase(DB_CONFIG.name, function() {
            console.log('Database deleted');
          }, function(e) {
            console.log('Error removing database ' + e.message);
          });
        }
        self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name});
        //self.db = window.sqlitePlugin.openDatabase({name: 'lime.db'});
        console.log('Creating lime.db!!!!!');
        if( !check_tables )
          return;

        proms = []
        //console.log('voy a entrar al forEach');
        // self.query('DROP TABLE IF EXISTS operation').then(function(){
          // self.query('DROP TABLE IF EXISTS exchange_transaction').then(function(){
          
            angular.forEach(DB_CONFIG.tables, function(table) {
                var columns = [];

                //console.log('SOY EL FOREACH');
     
                angular.forEach(table.columns, function(column) {
                    columns.push(column.name + ' ' + column.type);
                });
     
                var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';

                var p = self.query(query)
                .then(function() {
                  console.log('Table ' + table.name + ' initialized');
                  if(table.rows !== undefined && table.rows.length > 0 ) {

                    var mproms = [];

                    angular.forEach(table.rows, function(row) {

                        var col_names = Object.keys(row);
                        var emarks    = [];
                        var bindings  = [];

                        for(var i=0; i<col_names.length; i++) {
                          emarks.push('?');
                          bindings.push( row[col_names[i]] );
                        }

                        bindings.push(row['id']);

                        var query = '';
                        query = query + 'INSERT INTO ' + table.name + '\n';
                        query = query + ' (' + col_names.join(',') + ')\n';
                        query = query + 'SELECT ' + emarks.join(',') + '\n';
                        query = query + 'WHERE NOT EXISTS ( SELECT 1 FROM ' + table.name + '\n';
                        query = query + 'WHERE id = ?)';

                        //console.log(query);
                        var mp = self.query(query, bindings);
                        mproms.push(mp);
                    });

                    return $q.all(mproms);
                  }
                }, function(err) {
                  console.log('ERROR forEach ' + err);
                });

                proms.push(p);
            });
          
          // })
        // })

        return $q.all(proms);
    };
 
    self.query = function(query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
 
        self.db.transaction(function(transaction) {
            //console.log('voy con query ' + query);
            transaction.executeSql(query, bindings, function(transaction, result) {
                //console.log('todo OK query ' + query + '=>' + bindings);
                deferred.resolve(result);
            }, function(transaction, error) {
                //console.log('ERROR EN query ' + query + '=>' + bindings);
                deferred.reject(error);
            });
        });
 
        return deferred.promise;
    };
 
    self.queryMany = function(query, bindings) {
                
        var deferred = $q.defer();
        if ( query.length == 0 )
        {
          deferred.resolve();
          return deferred.promise;
        }

        self.db.transaction(function(transaction) {
          
          var proms = [];
          for(var i=0; i<query.length; i++) {
            
            var df = $q.defer();  
            
            transaction.executeSql(query[i], bindings[i], function(tx, res) {
              df.resolve(res);
            }, function(tx, err) {
              console.log(' ---- Query Many ERROR inside tx: ' + JSON.stringify(tx) + ' err:' + JSON.stringify(err));
              df.reject(err);
            });

            proms.push(df);
          }

          $q.all(proms).then(function(res) {
            console.log(' ---- Query Many RESOLVED!!');
            deferred.resolve(res);
          }, function(err) {
            console.log(' ---- Query Many ERROR: '+JSON.stringify(err));
            deferred.reject(err);
          })
          

        }, function(err) {
          deferred.reject(err);
        });
 
        return deferred.promise;
    };

    self.fetchAll = function(result) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }

        return output;
    };

    self.fetchOneColumn = function(result, col) {
        var output = [];

        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i)[col]);
        }

        return output;
    };
 
    self.fetch = function(result) {
        return result.rows.item(0);
    };
 
    return self;
})

//Memo service
.service('Memo', function(DB) {
    var self = this;

    self.in = function(ids) {
      var pp = [];
      for(var i=0;i<ids.length; i++) pp.push('?');
      return DB.query('SELECT id FROM memo where id in ('+pp.join(',')+')' , ids)
      .then(function(result){
          //console.log('MEMOINNNNN SQL ' + JSON.stringify(result) + ' ' + JSON.stringify(ids));
          return DB.fetchOneColumn(result, 'id');
      });
    } 

    self._add = function(obj) {
      var sql    = 'INSERT or REPLACE INTO memo (id, account, memo, one_time_key, in_out, slate, address) VALUES (?,?,?,?,?,?,?)';
      var params = [obj.id, obj.account, obj.memo, obj.one_time_key, obj.in_out, obj.slate, obj.address];
      return {'sql':sql, 'params':params};
    } 

    self._decrypt = function(id, message, pubkey) {
      var sql    = 'UPDATE memo SET message=?, pubkey=?, encrypted=0 WHERE id=?';
      var params = [message, pubkey, id];
      return {'sql':sql, 'params':params};
    } 

    self.to_decrypt = function(account) {
      return DB.query('SELECT m.id, memo, one_time_key, slate, in_out, c.pubkey to_pubkey, m.address FROM memo m LEFT JOIN contact c on m.address=c.address WHERE account=? and encrypted != 0', [account])
      .then(function(result){
          return DB.fetchAll(result);
      });
    } 

    return self;
})

//Contact service
.service('Contact', function(DB) {
    var self = this;
    
    self.LOCAL  = 'local';
    self.GLOBAL = 'transfer';

    self.all = function() {
        return DB.query('SELECT * FROM contact order by name')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.locals = function() {
        return DB.query('SELECT c.*, IFNULL(c.pubkey, c.address) pubkey_or_address FROM contact c where c.source=? order by c.name', [self.LOCAL])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self._add = function(name, address, pubkey, avatar_hash, source) {
      address = address || null;
      pubkey  = pubkey  || null;
      var sql    = 'INSERT or REPLACE into contact (name, address, pubkey, avatar_hash, source) values (?,?,?,?,?)';
      var params = [name, address, pubkey, avatar_hash, source];
      return {sql:sql, params:params};
    }

    self.add = function(name, address, pubkey, avatar_hash, source) {
      var sql = self._add(name, address, pubkey, avatar_hash, source);
      return DB.query(sql.sql, sql.params);
    }

    self._update = function(id, name, address, pubkey, avatar_hash, source) {
      address = address || null;
      pubkey  = pubkey  || null;
      var sql    = 'UPDATE OR REPLACE contact set name=?, address=?, pubkey=?, avatar_hash=?, source=? WHERE id=?';
      var params = [name, address, pubkey, avatar_hash, source, id];
      return {sql:sql, params:params};
    }

    self.update = function(id, name, address, pubkey, avatar_hash, source) {
      var sql = self._update(id, name, address, pubkey, avatar_hash, source);
      return DB.query(sql.sql, sql.params);
    }

    self.startsWith = function(prefix) {
        return DB.query('SELECT * FROM contact where lower(name) like lower(?) and source != \'transfer\' order by name limit 5', [prefix+'%'])
        .then(function(result){
            return DB.fetchAll(result);
        });
    }

    self.remove = function(id) {
        return DB.query('DELETE from contact where id=?',[id]);
    };

    self.deleteAll = function() {
        return DB.query('DELETE from contact');
    };

    return self;
})

//Settings service 
.service('Setting', function(DB, DB_CONFIG, $q) {
    var self = this;

    self.DEFAULT_ASSET          = 'default_asset';
    self.UI_HIDE_BALANCE        = 'hide_balance';
    self.SEED                   = 'seed'; // json 
    self.MPK                    = 'mpk'; // json 
    self.SALT                   = 'salt';

    self.getMany = function(keys) {

      var ppp = Object.keys(keys);
      console.log('PEZZZ     RESRESRESRES> ' + JSON.stringify(ppp));

      var deferred = $q.defer();
      //DB.query('SELECT name, value FROM setting where name in (?)', [ppp])
      DB.query('SELECT name, value FROM setting', [])
      .then(function(result) {
        console.log('RESRESRESRES> ' + JSON.stringify(result));
        var data = DB.fetchAll(result);

        var values = {};
        data.forEach(function(d) {
          console.log('=====> ' + d.name + ':' + d.value);
          values[d.name] = d.value;
        });

        console.log('XXXXXXXXXXXXXXXX ');
        console.log(JSON.stringify(values));
        console.log('XXXXXXXXXXXXXXXX ');

        Object.keys(keys).forEach(function(k) {
          if( k in values ) return;
          values[k] = keys[k];
        });
        
        console.log('XXXXXXXXXXXXXXXX ');
        console.log(JSON.stringify(values));
        console.log('XXXXXXXXXXXXXXXX ');
        deferred.resolve(values);

      }, function(err) {
        deferred.reject(err);  
      });

      return deferred.promise;
    }
    
    self.get = function(name, _default) {
        var deferred = $q.defer();
        DB.query('SELECT name, value FROM setting where name=?', [name])
        .then(function(result){
          console.log( 'GET ' + JSON.stringify(result) );

          if( result.rows.length == 0 ) {
            if( _default !== undefined )
            {
              //console.log('ROW 0 RESOLVE');
              deferred.resolve({name:name, value:_default});
            }
            else
            {
              //console.log('ROW 0 REJECT');
              deferred.resolve();
            }
            return;
          }

          //console.log('ROW !=0 RESOLVE');
          deferred.resolve(DB.fetch(result));
        }, function(err) {
          console.log('rompo ' + err);
          deferred.reject(err);  
        });

        return deferred.promise;
    };

    self.set = function(name, value) {
        var cmd = self._set(name, value);
        return DB.query(cmd.sql, cmd.params);
    };

    self._set = function(name, value) {
        return {sql:'INSERT or REPLACE into setting (name, value) values (?,?)', params:[name, value.toString()] };
    };
    
    self.remove = function(name) {
        return DB.query('DELETE from setting where name=?', [name]);
    };

    return self;
})

//Account service 
.service('Account', function(DB, BitShares, $q, $timeout) {
    var self = this;

    self.active = function() {
      var deferred = $q.defer();
      DB.query('SELECT * FROM account where active != 0 limit 1', [])
      .then(function(result){

          if( result.rows.length == 0 ) {
            deferred.resolve(undefined);
            return;           
          }

          var account = DB.fetch(result);
          deferred.resolve(account);

      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }

    self.all = function() {
      var query = 'SELECT * FROM account';
      return DB.query(query).then(function(result){
        return DB.fetchAll(result);
      });
    }
    
    self.create = function(obj) {
      var cmd = self._create(obj);
      return DB.query(cmd.sql, cmd.params);
    }

    self._update = function(obj) {
      var sql    = 'UPDATE account set account_mpk=?, privkey=?, skip32_key=?, memo_mpk=?, encrypted=? where id=?';
      var params = [obj.account_mpk, obj.privkey, obj.skip32_key, obj.memo_mpk, obj.encrypted, obj.id];

      return {sql:sql, params:params};
    }

    self._create = function(obj) {
      var sql    = 'INSERT into account (name, account_mpk, access_key, secret_key, pubkey, address, number, privkey, skip32_key, memo_mpk, encrypted, registered, avatar_hash) values (?,?,?,?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.name, obj.account_mpk, obj.access_key, obj.secret_key, obj.pubkey, obj.address, obj.number, obj.privkey, obj.skip32_key, obj.memo_mpk, obj.encrypted, obj.registered, obj.avatar_hash];

      return {sql:sql, params:params};
    }

    self.count = function() {

      var deferred = $q.defer();

      DB.query('SELECT COUNT(*) as county FROM account')
      .then(function(result){
          deferred.resolve(DB.fetch(result)['county']);
      });

      return deferred.promise;
    }

    self.setProfileInfo = function(obj) {
      var cmd = self._setProfileInfo(obj);
      return DB.query(cmd.sql, cmd.params);
    }

    self._setProfileInfo = function(obj) {
      var sql    = 'UPDATE account set name=?, avatar_hash=?, registered=? where id=?';
      var params = [obj.name, obj.avatar_hash, obj.registered, obj.id];

      return {sql:sql, params:params};
    }

    self.updateAccesKeys = function(obj) {
      var sql    = 'UPDATE account set access_key=?, secret_key=? where id=?';
      var params = [obj.access_key, obj.secret_key, obj.id];

      return DB.query(sql, params);
    }

    return self;
})

// Operation Service
.service('Operation', function(DB, $q) {
    var self = this;

    self.add = function(obj) {
      var tmp = self._add(obj);
      return DB.query(tmp.sql, tmp.params);
    }

    self._add = function(obj) {
      var sql    = 'INSERT into operation (block_id, timestamp, memo_hash, address, asset_id, fee, txid, amount, block, type, slate) values (?,?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.block_id, obj.timestamp, obj.memo_hash, obj.address, obj.asset_id, obj.fee, obj.txid, obj.amount, obj.block, obj.type, obj.slate]
      return {'sql':sql, 'params':params};
    }
   
    self.all = function() {
      var query = "SELECT * FROM ( \
        SELECT o.timestamp*1000 as TS, o.slate, IFNULL(m.encrypted,-1) encmsg, m.message, m.pubkey pubkey, c.name, m.address, \
          IFNULL(et.extra_data, o.type) as ui_type, \
            o.*, et.* FROM operation o \
          LEFT JOIN exchange_transaction et \
            ON o.txid = et.cl_pay_tx OR o.txid = et.cl_recv_tx \
          LEFT JOIN memo m \
            ON o.memo_hash = m.id \
          LEFT JOIN contact c \
            ON (m.in_out = 0 and m.pubkey = c.pubkey) or (m.in_out = 1 and m.address = c.address) \
        UNION \
          SELECT IFNULL(et.created_at*1000, et.quoted_at*1000) as TS, 0, -1, NULL, NULL, NULL, NULL,  \
            et.extra_data as ui_type, \
            o.*, et.* FROM exchange_transaction et  \
            LEFT JOIN operation o \
            ON 1=0 \
          WHERE et.cl_recv_tx IS NULL and (et.cl_pay_tx is NULL or et.extra_data = 'deposit') \
        ) AS peto ORDER BY TS DESC";

      return DB.query(query).then(function(result){
          return DB.fetchAll(result);
      });
    }
    
    self.clear = function() {
      return DB.query('DELETE from operation ', []);
    };
    
    self.lastUpdate = function(){
      var deferred = $q.defer();
      DB.query('SELECT block_id FROM operation order by block limit 1', [])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result).block_id);
            return;
        });
      return deferred.promise;
    }
    
    self.byTxId = function(tx_id){
      var deferred = $q.defer();
      DB.query('SELECT * FROM operation where txid = ? limit 1', [tx_id])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result));
            return;
        });
      return deferred.promise;
    }

    self.byTxIdEx = function(txid){
      var deferred = $q.defer();
      
      var query = " \
        SELECT o.timestamp*1000 as TS, o.slate, IFNULL(m.encrypted,-1) encmsg, m.message, m.pubkey pubkey, IFNULL(c.name, m.address) name, m.address, \
          o.type as ui_type, \
            o.* FROM operation o \
          LEFT JOIN memo m \
            ON o.memo_hash = m.id \
          LEFT JOIN contact c \
            ON (m.in_out = 0 and m.pubkey = c.pubkey) or (m.in_out = 1 and m.address = c.address) \
          WHERE o.txid = ? \
          ORDER BY TS DESC";
  

      DB.query(query, [txid]).then(function(result){
          if( result.rows.length == 0 ) {
            deferred.resolve(undefined);
            return;
          }
          deferred.resolve(DB.fetch(result));
          return;
      });
      return deferred.promise;
    }
    return self;
})

// ExchangeTransaction Service
.service('ExchangeTransaction', function(DB, $q) {
    var self = this;


    self.add = function(obj) {
      var tmp = self._add(obj);
      return DB.query(tmp.sql, tmp.params);
    }

    self._add = function(obj) {
      var sql    = 'insert or replace into exchange_transaction (id,asset_id,cl_pay,cl_pay_curr,cl_pay_addr,cl_pay_tx,cl_recv,cl_recv_curr,cl_recv_addr,cl_recv_tx,refund_tx,balance,rate,book,quoted_at,updated_at,status,extra_data,cl_cmd,created_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.id, obj.asset_id, obj.cl_pay, obj.cl_pay_curr, obj.cl_pay_addr, obj.cl_pay_tx, obj.cl_recv, obj.cl_recv_curr, obj.cl_recv_addr, obj.cl_recv_tx, obj.refund_tx, obj.balance, obj.rate, obj.book, obj.quoted_at, obj.updated_at, obj.status, obj.extra_data, obj.cl_cmd, obj.created_at];
      return {'sql':sql, 'params': params};
    }

    self.lastUpdate = function(){
      var deferred = $q.defer();
      DB.query('SELECT updated_at FROM exchange_transaction where updated_at is not null order by updated_at limit 1 ', [])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result).updated_at);
            return;
        });
      return deferred.promise;
    }
    
    self.byXId = function(x_id){
      var deferred = $q.defer();
      DB.query('SELECT * FROM exchange_transaction where id = ?', [x_id])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result));
            return;
        });
      return deferred.promise;
    }

    self.byXIdEx = function(x_id){
      var deferred = $q.defer();
      var query = "SELECT et.created_at*1000 as TS, o.slate, IFNULL(m.encrypted,-1) encmsg, m.message, m.pubkey pubkey, c.name, m.address, \
          IFNULL(et.extra_data, o.type) as ui_type, \
            et.*, o.* FROM exchange_transaction et \
          LEFT JOIN operation o \
            ON o.txid = et.cl_pay_tx OR o.txid = et.cl_recv_tx \
          LEFT JOIN memo m \
            ON o.memo_hash = m.id \
          LEFT JOIN contact c \
            ON (m.in_out = 0 and m.pubkey = c.pubkey) or (m.in_out = 1 and m.address = c.address) \
          WHERE et.id = ? ";
      DB.query( query, [x_id])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result));
            return;
        });
      return deferred.promise;
    }
    
    self.clear = function() {
        return DB.query('DELETE from exchange_transaction ', []);
    };
    
    return self;
})

// Balance Service
.service('Balance', function(DB) {
    var self = this;
    
    self.all = function(limit) {
        return DB.query('SELECT asset_id, sum(amount) amount FROM balance group by asset_id order by asset_id desc ')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.forAsset = function(asset_id) {
        return DB.query('SELECT asset_id, sum(amount) amount FROM balance where asset_id=?', [asset_id])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.add = function(obj) {
      var tmp = self._add(obj);
      return DB.query(tmp.sql, tmp.params);
    }

    self._add = function(obj) {
      var sql    = 'INSERT or REPLACE into balance (asset_id, amount, address) values (?,?,?)';
      var params = [obj.asset_id, obj.amount, obj.address];
      return {'sql':sql, 'params':params};
    }

    self.clear = function() {
        return DB.query('DELETE from balance', []);
    };

    return self;
});
