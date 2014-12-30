angular.module('bit_wallet.services', ['bit_wallet.config'])
// DB wrapper
.factory('DB', function($q, DB_CONFIG) {
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
        angular.forEach(DB_CONFIG.tables, function(table) {
            var columns = [];
 
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
            });

            proms.push(p);
        });

        return $q.all(proms);
    };
 
    self.query = function(query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
 
        self.db.transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
                deferred.resolve(result);
            }, function(transaction, error) {
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
.factory('MasterKey', function(DB) {
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
.factory('Address', function(DB) {
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
.factory('AddressBook', function(DB) {
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
//Asset service 
.factory('Asset', function(DB, DB_CONFIG) {
    var self = this;
    
    self.all = function() {
        return DB.query('SELECT * FROM asset order by is_default desc, is_enabled desc, id asc')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    self.allEnabled = function() {
        return DB.query('SELECT * FROM asset where is_enabled = 1 order by is_default desc, is_enabled desc, id asc')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };

    self.bySymbol = function(name) {
        return DB.query('SELECT * FROM asset where symbol = ?',[name])
        .then(function(result){
            return DB.fetch(result);
        });
    };
    
    self.getDefault = function() {
        return DB.query('SELECT * FROM asset order by is_default desc limit 1',[])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    self.setDefault = function(id) {
        return DB.query('UPDATE asset set is_default=0', [])
        .then(function(result){
          return DB.query('UPDATE asset set is_default=1 where id = ?', [id]);
        });
    };
    
    self.hide = function(id) {
        return DB.query('UPDATE asset set is_enabled=0 where id = ? and is_default=0', [id]);
    };
    
    self.show = function(id) {
        return DB.query('UPDATE asset set is_enabled=1 where id = ?', [id]);
    };
    
    return self;
})

//Bitshares Service
.factory('BitShares', function($translate, $q, $rootScope) {
    var self = this;

    self.createMasterKey = function() {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.createMasterKey(
        function(data){
          deferred.resolve(data.masterPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
      );
    
      return deferred.promise;
    };

    self.extractDataFromKey = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extractDataFromKey(
        function(data){
          deferred.resolve(data);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.extendedPublicFromPrivate = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.extendedPublicFromPrivate(
        function(data){
          deferred.resolve(data.extendedPublicKey);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.encryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.encryptString(
        function(data){
          deferred.resolve(data.encryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.decryptString = function(data, password) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.decryptString(
        function(data){
          deferred.resolve(data.decryptedData);
        },
        function(error){
          deferred.reject(error);
        },
        data, 
        password
      );

      return deferred.promise;
    };

    self.isValidKey = function(key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidKey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        key
      );

      return deferred.promise;
    };

    self.isValidWif = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.isValidWif(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        wif
      );

      return deferred.promise;
    };

    self.derivePrivate = function(key, deriv) {
      var deferred = $q.defer();
      
      window.plugins.BitsharesPlugin.derivePrivate(
        function(data){
          deferred.resolve(data.extendedPrivateKey);
        },
        function(error){
          deferred.reject(error);
        }
        , key
        , deriv
      );

      return deferred.promise;
    };

    self.compactSignatureForHash = function(hash, key) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.compactSignatureForHash(
        function(data){
          deferred.resolve(data.compactSignatureForHash);
        },
        function(error){
          deferred.reject(error);
        }
        , hash
        , key
      );

      return deferred.promise;
    };

    self.btsWifToAddress = function(wif) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsWifToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , wif
      );

      return deferred.promise;
    };

    self.btsPubToAddress = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsPubToAddress(
        function(data){
          deferred.resolve(data.addy);
        },
        function(error){
          deferred.reject(error);
        }
        , pubkey
      );

      return deferred.promise;
    };

    self.btsIsValidAddress = function(addy) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidAddress(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        addy
      );

      return deferred.promise;
    };

    self.btsIsValidPubkey = function(pubkey) {
      var deferred = $q.defer();

      window.plugins.BitsharesPlugin.btsIsValidPubkey(
        function(data){
          deferred.resolve(true);
        },
        function(error){
          deferred.reject(error);
        },
        pubkey
      );

      return deferred.promise;
    };
    
    return self;
})

//QR Code service
.factory('Scanner', function($q, T, $ionicModal, $ionicPopup, $cordovaDevice, BitShares) {

    var self = this;
    
    self.scan = function() {

      var deferred = $q.defer();

      // $cordovaBarcodeScanner
      //   .scan()
        // .then(function(result) {
      window.plugins.BarcodeScanner.scan(
          function(result) {
          console.log( 'Services.Scanner retorno algo');
          if ( result.cancelled ) {

            //HACK for android
            if( $rootScope.platform == "Android" ) {
              $ionicModal.fromTemplate('').show().then(function() {
                $ionicPopup.alert({ title: T.i('qr_scan_cancelled') });
              });
            } else {
              $ionicPopup.alert({ title: T.i('qr_scan_cancelled') });
            }

            deferred.resolve(result);
            return;
          }

          var res = result.text;
          if( res.indexOf('bts:') == 0 ) {

            var parts = res.substr(4).split('/');
            
            BitShares.btsIsValidAddress(parts[0]).then(
              function(is_valid){
                if( parts.length >= 2 && parts.indexOf('transfer') != -1 ) {

                   var amount = undefined;
                   var amount_inx = parts.indexOf('amount');
                   if( amount_inx != -1 ) {
                     obj = parts[amount_inx+1];
                     if( (obj - parseFloat( obj ) + 1) >= 0 ) {
                       amount = obj;
                     }
                   }

                   var asset = undefined;
                   var asset_inx  = parts.indexOf('asset');
                   if( asset_inx != -1 ) {
                     asset = parts[asset_inx+1];
                   }

                   console.log('Metiste bts: => ' + parts[0] + '=>' + amount + '=>' + asset);
                   deferred.resolve({cancelled:false, address:parts[0], amount:amount, asset_id:asset}); 
                   return;
                }
                //window.plugins.toast.show( 'Invalid url', 'long', 'bottom');
                resolve.reject('Invalid url');
                return;
              },
              function(error){
                resolve.reject('Invalid address');
                return;
              }
            );
            return;

          } 
          BitShares.btsIsValidAddress(res).then(
            function(is_valid){
              console.log(' barcodescanner dijo es valid address : ' + res);
              deferred.resolve({cancelled:false, address:res}); 
              return;
            },
            function(error){
              console.log(' barcodescanner dijo NO es valid address ');
              return BitShares.btsIsValidPubkey(res).then(
                function(is_valid){
                  console.log(' barcodescanner dijo es valid pubkey : ' + res);
                  deferred.resolve({cancelled:false, pubkey:res}); 
                  return;
                },
                function(error){
                  console.log(' barcodescanner dijo NO es valid pubkey ');
                  return BitShares.isValidWif(res).then(
                    function(is_valid){
                      console.log(' barcodescanner dijo es valid WIF : ' + res);
                      deferred.resolve({cancelled:false, privkey:res}); 
                      return;
                    },
                    function(error){
                      console.log(' barcodescanner dijo NO es valid WIF' );
                      deferred.reject(error);
                    });        
                });

            });
        }, function(error) {
          console.log( 'Services.Scanner retorno ERROR');
          
          deferred.reject(error);
          return;
        });

        return deferred.promise;
    };

    return self;
})


//i18n Helper
.factory('T', function($translate) {
    var self = this;
    
    self.i = function(txt, obj) {
      return $translate.instant(txt, obj);
    };

    return self;
});
