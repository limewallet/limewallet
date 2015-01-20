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

        //console.log('me voy con todas las proms juntas');
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

//MasterKey service 
.service('MasterKey', function(DB) {
    var self = this;
    
    self.get = function() {
        return DB.query('SELECT * FROM master_key limit 1', [])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.store = function(key, deriv) {
        return DB.query('INSERT or REPLACE into master_key (id, key, deriv) values (0,?,?)', [key, deriv]);
    }
    
    return self;
})

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
        if( created_at === 'undefined' )
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
        if( is_favorite === 'undefined' ) 
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

    self.DEFAULT_ASSET = 'default_asset';
    self.BSW_TOKEN     = 'bsw_token';
    
    self.get = function(name, _default) {
        var deferred = $q.defer();
        DB.query('SELECT name, value FROM setting where name=?', [name])
        .then(function(result){
          console.log( 'GET ' + JSON.stringify(result) );

          if( result.rows.length == 0 ) {
            if( _default !== undefined )
            {
              console.log('ROW 0 RESOLVE');
              deferred.resolve({name:name, value:_default});
            }
            else
            {
              console.log('ROW 0 REJECT');
              deferred.resolve();
            }
            return;
          }

          console.log('ROW !=0 RESOLVE');
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

    return self;
})

//Account service 
.service('Account', function(DB, BitShares, $q) {
    var self = this;
    
    self.get = function() {
      return DB.query('SELECT * FROM account limit 1', [])
      .then(function(result){
        return DB.fetch(result);
      });
    };

    self.store = function(name, gravatar_id) {
      return DB.query('INSERT or REPLACE into account (id, name, gravatar_id) values (0,?,?)', [name, gravatar_id]);
    }
    
    self.updateGravatarId = function(gravatar_id) {
      return DB.query('UPDATE account set gravatar_id=? where id=0', [gravatar_id]);
    }

    self.register = function(address) {
      var deferred = $q.defer();

      console.log('Account::register');
      BitShares.getBackendToken(address).then(function(token) {
        console.log('toma el tokan ' + token);
        self.get().then(function(account) {
          BitShares.registerAccount(token, address, account).then(function() {
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

      return deferred.promise;
    }
    
    return self;
});
