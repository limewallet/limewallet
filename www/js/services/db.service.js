bitwallet_services
.service('DB', function($q, DB_CONFIG) {
    var self = this;
    self.db = null;
 
    self.init = function(remove) {
        if(remove) {
          window.sqlitePlugin.deleteDatabase(DB_CONFIG.name, function() {
            console.log('Database deleted');
          }, function(e) {
            console.log('Error removing database ' + e.message);
          });
        }
        self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name});

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

// //MasterKey service 
// .service('MasterKey', function(DB) {
//     var self = this;
    
//     self.get = function() {
//         return DB.query('SELECT * FROM master_key limit 1', [])
//         .then(function(result){
//             return DB.fetch(result);
//         });
//     };

//     self.store = function(key, deriv) {
//         return DB.query('INSERT or REPLACE into master_key (id, key, deriv) values (0,?,?)', [key, deriv]);
//     }
    
//     return self;
// })

//Address service 
.service('Address', function(DB) {
    var self = this;
    
    self.all = function() {
        return DB.query('SELECT * FROM address')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.getDefault = function() {
        return DB.query('SELECT * FROM address order by is_default desc limit 1',[])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.by_address = function(addy) {
        return DB.query('SELECT * FROM address where address=?',[addy])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.setDefault = function(id) {
        return DB.query('UPDATE address set is_default=0', [])
        .then(function(result){
          return DB.query('UPDATE address set is_default=1 where id = ?', [id]);
        });
    };

    self.setLabel = function(id, label) {
        return DB.query('UPDATE address set label=? where id=?', [label, id]);
    };
    
    self.create = function(deriv, address, pubkey, privkey, is_default, label, created_at) {
        if( created_at === undefined )
          created_at = (new Date()).getTime();

        return DB.query('INSERT INTO address (deriv, address, pubkey, privkey, created_at, is_default, label) values (?,?,?,?,?,?,?)', [deriv, address, pubkey, privkey, created_at, is_default ? 1 : 0, label]);
    };

    self.deleteAll = function() {
        return DB.query('DELETE from address');
    };
    
    return self;
})

//AddressBook service 
.service('AddressBook', function(DB) {
    var self = this;
    
    self.all = function() {
        return DB.query('SELECT * FROM address_book order by is_favorite desc')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.add = function(address, name, is_favorite) {
        if( is_favorite === undefined ) 
          is_favorite = 0;
        return DB.query('INSERT or REPLACE into address_book (name, address, is_favorite) values (?,?,?)', [name, address, is_favorite]);
    }

    self.setFavorite = function(id, fav) {
        return DB.query('UPDATE address_book set is_favorite=? where id=?', [fav,id]);
    };

    self.remove = function(id) {
        return DB.query('DELETE from address_book where id=?',[id]);
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
    self.BSW_TOKEN              = 'bsw_token';
    self.UI_ALLOW_HIDE_BALANCE  = 'allow_hide_balance';
    
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
        return DB.query('INSERT or REPLACE into setting (name, value) values (?,?)', [name, value.toString()]);
    };
    
    self.remove = function(name) {
        return DB.query('DELETE from setting where name=?', [name]);
    };

    return self;
})

//Account service 
.service('Account', function(DB, BitShares, $q, $timeout) {
    var self = this;
    
    self.get = function() {
      
      // // DB.query(' update address set address=?, pubkey=?, privkey=? where id = 1;', ['DVS3NGm7x7NNXLSTLpqGioTZx3e2gfjJG2Rq', 'DVS63DAgNVVTzmnHK2r4c5GfX1iiHXKC8zSqSzeAgNhToBD7VygsK', 'L2CkKoHGKiwgvaNtUVvBqh6CezSVfhR3Zb5eDJdNRT2zVyEWu75V']);
      // return DB.query('SELECT * FROM account limit 1', [])
      // .then(function(result){
      //   return DB.fetch(result);
      // });
      var deferred = $q.defer();
      DB.query('SELECT * FROM account limit 1', [])
        .then(function(result){
            if( result.rows.length == 0 ) {
              deferred.resolve(undefined);
              return;
            }
            deferred.resolve(DB.fetch(result));
            return;
        });
      return deferred.promise;
    };
    
    self.storeProfile = function(name, gravatar_id) {
      //return DB.query('INSERT or REPLACE into account (id, name, gravatar_id, registered) values (0,?,?,?)', [name, gravatar_id, 0]);
      return DB.query('UPDATE account set name=? gravatar_id=? registered=0 WHERE id=0', [name, gravatar_id, 0]);
    }
    
    self.storeKey = function(key, deriv) {
      var deferred = $q.defer();
      self.get().then(function(acc){
        //if(acc && (acc.key!==undefined || acc.key.length<1)) {
        //if(!acc || acc===undefined) {
        if(acc===undefined || acc.rows.length == 0 || (acc.key!==undefined || acc.key.length<1)){
          //DB.query('INSERT OR REPLACE into account (id, key, deriv) values (0,?,?)', [key, deriv])
          //DB.query('UPDATE account set key=?, deriv=? where id=0', [key, deriv])
          DB.query('INSERT OR REPLACE into account (id, key, deriv) values (0,?,?)', [key, deriv]).then(function(res){
            deferred.resolve(DB.fetch(res));
          }, function(error){
            deferred.reject(error);
          });
        }
        else{
          deferred.reject('ya existe key');
        }
      })
      return deferred.promise;
    }

    self.clearProfile = function() {
      return DB.query('UPDATE account set name=? gravatar_id=? registered=0 WHERE id=0', [undefined, undefined, 0]);
      //return DB.query('DELETE from account');
    }
    
    self.registeredOk = function() {
      return DB.query('UPDATE account set registered=1 where id=0');
    }
    
    self.updateGravatarId = function(gravatar_id) {
      return DB.query('UPDATE account set gravatar_id=? where id=0', [gravatar_id]);
    }
    
    self.clearGravatarId = function() {
      return DB.query('UPDATE account set gravatar_id=? where id=0', [undefined]);
    }
    
    self.register = function(address) {
      var deferred = $q.defer();
      console.log('Account::register');
      BitShares.getBackendToken(address).then(function(token) {
        //console.log('toma el token ' + token);
        self.get().then(function(account) {
          if(account===undefined || account.name.length<1)
          {
            deferred.reject('Account is undefined');
            return;
          }
          BitShares.registerAccount(token, address, account).then(function(result) {
            //console.log(JSON.stringify(result));
            deferred.resolve(result);
            
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
    
    self.update = function(address, addys, assets) {
      var deferred = $q.defer();
      console.log('Account::update');
      BitShares.getBackendToken(address).then(function(token) {
        //console.log('toma el token ' + token);
        self.get().then(function(account) {
          if(account===undefined || account.name.length<1)
          {
            deferred.reject('Account is undefined');
            return;
          }
          BitShares.updateAccount(token, addys, assets, account).then(function(result) {
            //console.log(JSON.stringify(result));
            deferred.resolve(result);
            
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
})

// Raw Operation Service (bitshres txs)
.service('RawOperation', function(DB, $q) {
    var self = this;
    
    self.allForTx = function(tx_id) {
        return DB.query('SELECT * FROM raw_operation WHERE txid = ? order by id desc ' , [tx_id])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.addTXs = function(txs) {
        var proms = [];
        angular.forEach(txs, function(tx){
          var p = self.addTx(tx);
          proms.push(p);
        });
        return $q.all(proms);
    };
    
    self.addTx = function(obj){
      return DB.query('INSERT or REPLACE into raw_operation (id, asset_id, amount, other, timestamp, op_type, block, txid) values (?,?,?,?,?,?,?,?)', [obj.id, obj.asset_id, obj.amount, obj.other, obj.timestamp, obj.op_type, obj.block, obj.txid]);
    }
    self.clear = function() {
        return DB.query('DELETE from raw_operation ', []);
    };
    
    return self;
})
// Operation Service
.service('Operation', function(DB, $q) {
    var self = this;
    
    self.all = function(limit) {
        var my_limit = 30;
        if (limit!==undefined)
          my_limit = limit;
        return DB.query('SELECT * FROM operation order by id desc limit ' + my_limit)
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.allForAsset = function(asset_id, limit) {
        var my_limit = 30;
        if (limit!==undefined)
          my_limit = limit;
        return DB.query('SELECT * FROM operation WHERE asset_id = ? order by id desc limit ' + my_limit, [asset_id])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.addObj = function(obj, just_sql) {
      var sql    = 'INSERT or REPLACE into operation (id, asset_id, amount, other, date, op_type, sign, address, block, block_id, tx_id, fee, addr_name, memo_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)';
      var params = [obj.id, obj.asset_id, obj.amount, obj.other, obj.date, obj.op_type, obj.sign, obj.address, obj.block, obj.block_id, obj.tx_id, obj.fee, obj.addr_name, obj.memo_id];

      if(just_sql == true) 
        return [sql, params];

      return DB.query(sql, params);
    };
    
    self.allWithXTxForAsset = function(asset_id, limit) {
        var my_limit = 30;
        if (limit!==undefined)
          my_limit = limit;
        return DB.query(" \
          SELECT * FROM ( \
            SELECT o.date as TS, \
              CASE \
                   WHEN o.sign>0 and et.tx_type IS NULL             THEN 'received' \
                   WHEN o.sign<0 and et.tx_type IS NULL             THEN 'sent' \
                   WHEN o.sign==0 and et.tx_type IS NULL            THEN 'self' \
                   WHEN o.sign>0 and et.tx_type=='deposit'          THEN 'deposit' \
                   WHEN o.sign<0 and et.tx_type=='withdraw'         THEN 'withdraw' \
                   WHEN o.sign<0 and et.tx_type=='btc_pay'          THEN 'btc_pay' \
                END as ui_type, \
                o.*, et.* FROM operation o \
              LEFT JOIN exchange_transaction et \
                ON o.tx_id = ifnull(et.cl_pay_tx, '-999') OR o.tx_id = ifnull(et.cl_recv_tx, '-999') OR o.tx_id = ifnull(et.operation_tx_id,'-999') \
              WHERE o.asset_id = ?  \
            UNION \
              SELECT IFNULL(et.created_at, et.quoted_at) as TS, \
                et.tx_type as ui_type, \
                o.*, et.* FROM exchange_transaction et  \
                LEFT JOIN operation o on o.tx_id = '-999' \
              WHERE et.x_asset_id = ? \
                    and et.status <> 'XX' \
                    and ifnull(et.cl_pay_tx, '-999') not in (select tx_id from operation) \
                    and ifnull(et.cl_recv_tx, '-999') not in (select tx_id from operation) \
                    and ifnull(et.operation_tx_id, '-999') not in (select tx_id from operation) \
            ) AS peto WHERE ui_type IS NOT NULL ORDER BY TS DESC LIMIT " + my_limit, [asset_id, asset_id])
        .then(function(result){
            return DB.fetchAll(result);
        });
        
                        //ON o.tx_id = et.cl_pay_tx OR o.tx_id = et.cl_recv_tx 
    };
    
    self.deleteFromBlock = function(block_num) {
        return DB.query('DELETE from operation WHERE block > ?', [block_num]);
    };
    
    self.clear = function() {
        return DB.query('DELETE from operation ', []);
    };
    
    self.cleanMarty = function(){
      return DB.query("UPDATE exchange_transaction set tx_type='deposit' where tx_type='marty'", []);
    }

    self.lastUpdate = function(){
      var deferred = $q.defer();
      DB.query('SELECT block_id FROM operation where block_id is not null order by block desc limit 1', [])
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

    self.byId = function(id){
      var deferred = $q.defer();
      DB.query('SELECT * FROM operation where id = ? limit 1', [tx_id])
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
    
    self.all = function(limit) {
        var my_limit = 30;
        if (limit!==undefined)
          my_limit = 30;
        return DB.query('SELECT * FROM exchange_transaction order by x_id desc limit ' + my_limit)
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.allForAsset = function(asset_id, limit) {
        var my_limit = 30;
        if (limit!==undefined)
          my_limit = 30;
        return DB.query('SELECT * FROM exchange_transaction WHERE asset_id = ? order by updated_at desc limit ' + my_limit, [asset_id])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.addObj = function(obj) {
        if (obj.operation_tx_id)
        {
          console.log('db.service addXTX vino con operation_tx_id:'+obj.operation_tx_id);
          return self.addObjEx(obj);
        }
        console.log('db.service addXTX vino SIN operation_tx_id.');
        return DB.query('INSERT or REPLACE into exchange_transaction (x_asset_id, status, quoted_at, cl_pay_curr, cl_pay_addr, cl_pay_tx, canceled, rate, cl_pay, x_id, balance, expired, cl_recv, cl_recv_tx, cl_recv_addr, cl_recv_curr, tx_type, updated_at, created_at, operation_tx_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, (SELECT operation_tx_id FROM exchange_transaction WHERE x_id = ?) )', [obj.x_asset_id, obj.status, obj.quoted_at, obj.cl_pay_curr, obj.cl_pay_addr, obj.cl_pay_tx, obj.canceled, obj.rate, obj.cl_pay, obj.x_id, obj.balance, obj.expired, obj.cl_recv, obj.cl_recv_tx, obj.cl_recv_addr, obj.cl_recv_curr, obj.tx_type, obj.updated_at, obj.created_at, obj.x_id]);
    }
    
    self.addObjEx = function(obj) {
        return DB.query('INSERT or REPLACE into exchange_transaction (x_asset_id, status, quoted_at, cl_pay_curr, cl_pay_addr, cl_pay_tx, canceled, rate, cl_pay, x_id, balance, expired, cl_recv, cl_recv_tx, cl_recv_addr, cl_recv_curr, tx_type, updated_at, created_at, operation_tx_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [obj.x_asset_id, obj.status, obj.quoted_at, obj.cl_pay_curr, obj.cl_pay_addr, obj.cl_pay_tx, obj.canceled, obj.rate, obj.cl_pay, obj.x_id, obj.balance, obj.expired, obj.cl_recv, obj.cl_recv_tx, obj.cl_recv_addr, obj.cl_recv_curr, obj.tx_type, obj.updated_at, obj.created_at, obj.operation_tx_id]);
    }

    self.lastUpdate = function(){
      var deferred = $q.defer();
      DB.query('SELECT updated_at FROM exchange_transaction where updated_at is not null order by updated_at desc limit 1 ', [])
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
        return DB.query('SELECT * FROM balance order by asset_id desc ')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.forAsset = function(asset_id) {
        return DB.query('SELECT * FROM balance where asset_id = ? limit 1 ', [asset_id])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.addObj = function(obj, just_sql) {
      var sql    = 'INSERT or REPLACE into balance (asset_id, amount, raw_amount, updated_at) values (?,?,?,?)';
      var params = [obj.asset_id, obj.amount, obj.raw_amount, obj.updated_at];

      if ( just_sql == true )
        return [sql, params];

      return DB.query(sql, params);
    }

    return self;
});
