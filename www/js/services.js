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
 
        angular.forEach(DB_CONFIG.tables, function(table) {
            var columns = [];
 
            angular.forEach(table.columns, function(column) {
                columns.push(column.name + ' ' + column.type);
            });
 
            var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
            self.query(query);
            console.log('Table ' + table.name + ' initialized');
        });
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

    return self;
})
//QR Code service
.factory('Scanner', function($q, $cordovaBarcodeScanner, T, $ionicModal, $ionicPopup) {

    var self = this;
    
    self.scan = function() {

      var deferred = $q.defer();

      $cordovaBarcodeScanner
        .scan()
        .then(function(result) {
          
          if ( result.cancelled ) {

            //HACK for android
            if( device.platform == "Android" ) {
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
            if( parts.length >= 2 && bitcoin.bts.is_valid_address(parts[0]) && parts.indexOf('transfer') != -1 ) {
              //TODO: check optionals
              var amount_inx = parts.indexOf('amount');
              var asset_inx  = parts.indexOf('asset');

              var obj = parts[amount_inx+1];
              //(asset_inx != -1 && parts[asset_inx+1] == 'USD') && 
              if( (obj - parseFloat( obj ) + 1) >= 0 ) {
                console.log('Metiste bts: => ' + parts[0] + '=>' + obj);
                deferred.resolve({cancelled:false, address:parts[0], amount:obj}); 
                return;
              }
            }

            //window.plugins.toast.show( 'Invalid url', 'long', 'bottom');
            resolve.reject('Invalid url');
            return;

          } else if( bitcoin.bts.is_valid_address(res) ) {

            console.log('Escaneaste una address => ' + res);
            deferred.resolve({cancelled:false, address:res}); 
            return;

          } else if( bitcoin.bts.is_valid_pubkey(res) ) {

            console.log('Escaneaste una pubkey => ' + res);
            deferred.resolve({cancelled:false, pubkey:res}); 
            return;

          } else {
            var priv;
            try {
              priv = bitcoin.ECKey.fromWIF(res);
            } catch(err) {

            }
            if( priv === undefined) {
              deferred.reject('Invalid Qr');
              return;
            }
            console.log('Escaneaste una privada => ' + res);
            deferred.resolve({cancelled:false, privkey:res}); 
            return;
          }

        }, function(error) {
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
