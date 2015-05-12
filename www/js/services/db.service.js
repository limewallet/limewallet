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
        if ( query.lenght == 0 )
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
              df.reject(err);
            });

            proms.push(df);
          }

          $q.all(proms).then(function(res) {
            deferred.resolve(res);
          }, function(err) {
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
 
    self.fetch = function(result) {
        return result.rows.item(0);
    };
 
    return self;
})

//Contact service
.service('Contact', function(DB) {
    var self = this;
    
    self.all = function() {
        return DB.query('SELECT * FROM contact order by name')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.add = function(name, pub_key, address, public_data, source) {
      var created_at = new Date().getTime()//1000;
        return DB.query('INSERT or REPLACE into contact (name, pub_key, address, public_data, source, created_at) values (?,?,?,?,?)', 
                        [name, pub_key, address, public_data, source, created_at]);
    }

    self.remove = function(id) {
        return DB.query('DELETE from contact where id=?',[id]);
    };

    self.deleteAll = function() {
        return DB.query('DELETE from address_book');
    };

    return self;
})

//Settings service 
.service('Setting', function(DB, DB_CONFIG, $q) {
    var self = this;

    self.DEFAULT_ASSET          = 'default_asset';
    self.UI_HIDE_BALANCE        = 'hide_balance';
    self.UI_ALLOW_HIDE_BALANCE  = 'allow_hide_balance';
    self.SEED                   = 'seed'; // json 
    
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
        var res = self._set(name, value);
        return DB.query(res[0], res[1]);
    };

    self._set = function(name, value) {
        return ['INSERT or REPLACE into setting (name, value) values (?,?)', [name, value.toString()] ];
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
          var account = DB.fetch(result);
          
          //TODO: BORRAR!!
          if( account !== undefined) {
            account.pubkey       = 'DVS6G3wqTYYt8Hpz9pFQiJYpxvUja8cEMNwWuP5wNoxr9NqhF8CLS';
            account.address      = 'DVSM5HFFtCbhuv3xPfRPauAeQ5GgW7y4UueL';
            account.priv_account = '5HymcH7QHpzCZNZcKSbstrQc1Q5vcNjCLj9wBk5aqYZcHCR6SzN';
            account.access_key   = '7cMHdvnvhv8Q36c4Xf8HJQaibTi4kpANNaBQYhtzQ2M6';
            account.secret_key   = '7teitGUUbtaRJY6mnv3mB9d1VB3UggiBQf4kyiL2PaKB';
          }

          deferred.resolve(account);

      }, function(err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
    
    self.create = function(pubkey, address, number, priv_account, priv_memos, memo_index, encrypted) {
      var res = self._create(pubkey, address, number, priv_account, priv_memos, memo_index, encrypted);
      return DB.query(res[0], res[1]);
    }

    self._create = function(pubkey, address, number, priv_account, priv_memos, memo_index, encrypted) {
      var sql    = 'INSERT into account (pubkey, address, number, priv_account, priv_memos, memo_index, encrypted) values (?,?,?,?,?,?,?)';
      var params = [pubkey, address, number, priv_account, priv_memos, memo_index, encrypted];

      return [sql, params];
    }

    self.count = function() {

      var deferred = $q.defer();

      DB.query('SELECT COUNT(*) as county FROM account')
      .then(function(result){
          deferred.resolve(DB.fetch(result)['county']);
      });

      return deferred.promise;
    }

    //self.register = function(address) {
      //var deferred = $q.defer();
      //console.log('Account::register');
      //BitShares.getBackendToken(address).then(function(token) {
        ////console.log('toma el token ' + token);
        //self.get().then(function(account) {
          //if(account===undefined || account.name.length<1)
          //{
            //deferred.reject('Account is undefined');
            //return;
          //}
          //BitShares.registerAccount(token, address, account).then(function(result) {
            ////console.log(JSON.stringify(result));
            //deferred.resolve(result);
            
          //}, function(err) {
            //deferred.reject(err);
          //});
        //}, function(err) {
          //deferred.reject(err);
        //});
      //}, function(err) {
        //deferred.reject(err);
      //});

      //return deferred.promise;
    //}
    
    //self.update = function(address, addys, assets) {
      //var deferred = $q.defer();
      //console.log('Account::update');
      //BitShares.getBackendToken(address).then(function(token) {
        ////console.log('toma el token ' + token);
        //self.get().then(function(account) {
          //if(account===undefined || account.name.length<1)
          //{
            //deferred.reject('Account is undefined');
            //return;
          //}
          //BitShares.updateAccount(token, addys, assets, account).then(function(result) {
            ////console.log(JSON.stringify(result));
            //deferred.resolve(result);
            
          //}, function(err) {
            //deferred.reject(err);
          //});
        //}, function(err) {
          //deferred.reject(err);
        //});
      //}, function(err) {
        //deferred.reject(err);
      //});

      //return deferred.promise;
    //}
    
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
      var sql    = 'INSERT into operation (block_id, timestamp, memo_hash, address, asset_id, fee, txid, amount, block, type) values(?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.block_id, obj.timestamp, obj.memo_hash, obj.address, obj.asset_id, obj.fee, obj.txid, obj.amount, obj.block, obj.type]
      return {'sql':sql, 'params':params};
    }
   
    self.all = function() {
          var query = "SELECT * FROM ( \
            SELECT o.timestamp as TS, \
              CASE \
                   WHEN o.type=='deposit'  and et.x_id IS NULL        THEN 'received' \
                   WHEN o.type=='withdraw' and et.x_id IS NULL        THEN 'sent' \
                   WHEN o.type=='deposit'  and et.x_id IS NOT NULL    THEN 'deposit' \
                   WHEN o.type=='withdraw' and et.x_id IS NOT NULL    THEN 'withdraw' \
                END as ui_type, \
                o.*, et.* FROM operation o \
              LEFT JOIN exchange_transaction et \
                ON o.txid = et.cl_pay_tx OR o.txid = et.cl_recv_tx \
            UNION \
              SELECT IFNULL(et.created_at, et.quoted_at) as TS, \
                et.tx_type as ui_type, \
                o.*, et.* FROM exchange_transaction et  \
                LEFT JOIN operation o \
              WHERE et.cl_recv_tx IS NULL and (et.cl_pay_tx is NULL or et.cl_pay_curr = 'BTC') \
            ) AS peto ORDER BY TS DESC";

        return DB.query(query).then(function(result){
            return DB.fetchAll(result);
        });
    }

    //self.allWithXTxForAsset = function(asset_id, limit) {
        //var my_limit = 30;
        //if (limit!==undefined)
          //my_limit = limit;
        //return DB.query(" \
          //SELECT * FROM ( \
            //SELECT o.date as TS, \
              //CASE \
                   //WHEN o.sign>0 and et.tx_type IS NULL             THEN 'received' \
                   //WHEN o.sign<0 and et.tx_type IS NULL             THEN 'sent' \
                   //WHEN o.sign==0 and et.tx_type IS NULL            THEN 'self' \
                   //WHEN o.sign>0 and et.tx_type=='deposit'          THEN 'deposit' \
                   //WHEN o.sign<0 and et.tx_type=='withdraw'         THEN 'withdraw' \
                   //WHEN o.sign<0 and et.tx_type=='btc_pay'          THEN 'btc_pay' \
                //END as ui_type, \
                //o.*, et.* FROM operation o \
              //LEFT JOIN exchange_transaction et \
                //ON o.tx_id = ifnull(et.cl_pay_tx, '-999') OR o.tx_id = ifnull(et.cl_recv_tx, '-999') OR o.tx_id = ifnull(et.operation_tx_id,'-999') \
              //WHERE o.asset_id = ?  \
            //UNION \
              //SELECT IFNULL(et.created_at, et.quoted_at) as TS, \
                //et.tx_type as ui_type, \
                //o.*, et.* FROM exchange_transaction et  \
                //LEFT JOIN operation o on o.tx_id = '-999' \
              //WHERE et.x_asset_id = ? \
                    //and et.status <> 'XX' \
                    //and ifnull(et.cl_pay_tx, '-999') not in (select tx_id from operation) \
                    //and ifnull(et.cl_recv_tx, '-999') not in (select tx_id from operation) \
                    //and ifnull(et.operation_tx_id, '-999') not in (select tx_id from operation) \
            //) AS peto WHERE ui_type IS NOT NULL ORDER BY TS DESC LIMIT " + my_limit, [asset_id, asset_id])
        //.then(function(result){
            //return DB.fetchAll(result);
        //});
        
                        ////ON o.tx_id = et.cl_pay_tx OR o.tx_id = et.cl_recv_tx 
    //};
    
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
      DB.query('SELECT * FROM operation where tx_id = ? limit 1', [tx_id])
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
      var sql = 'INSERT into exchange_transaction (x_id, x_asset_id, status, quoted_at, created_at, cl_pay_curr, cl_pay_addr, cl_pay_tx, canceled, rate, cl_pay, balance, expired, cl_recv, cl_recv_tx, cl_recv_addr, cl_recv_curr, tx_type, updated_at) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.x_id, obj.x_asset_id, obj.status, obj.quoted_at, obj.created_at, obj.cl_pay_curr, obj.cl_pay_addr, obj.cl_pay_tx, obj.canceled, obj.rate, obj.cl_pay, obj.balance, obj.expired, obj.cl_recv, obj.cl_recv_tx, obj.cl_recv_addr, obj.cl_recv_curr, obj.tx_type, obj.updated_at];
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
      DB.query('SELECT * FROM exchange_transaction et LEFT JOIN operation o ON o.tx_id = et.cl_pay_tx OR o.tx_id = et.cl_recv_tx where x_id = ? limit 1', [x_id])
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
        return DB.query('SELECT asset_id, sum(amount) FROM balance group by asset_id order by asset_id desc ')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.forAsset = function(asset_id) {
        return DB.query('SELECT asset_id, sum(amount) FROM balance group by asset_id where asset_id=?', [asset_id])
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
