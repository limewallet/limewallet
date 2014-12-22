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

    self.add = function(asset_id, symbol, fullname, is_default, precision, symbol_ui_class, symbol_ui_text) {
        return DB.query('INSERT or REPLACE into asset (asset_id, symbol, fullname, is_default, is_enabled, precision, symbol_ui_class, symbol_ui_text) values (?,?,?,?,?,?,?,?)', [asset_id, symbol, fullname, is_default, 1, precision, symbol_ui_class, symbol_ui_text]);
    }
    
    self.init = function() {
      angular.forEach(DB_CONFIG.assets, function(asset) {
            self.add(asset.asset_id, asset.symbol, asset.fullname, (asset.symbol=='USD'?1:0), asset.precision, asset.symbol_ui_class, asset.symbol_ui_text);
            console.log('Asset ' + asset.symbol + ' initialized');
        });
    }
    
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
//QR Code service
.factory('Scanner', function($q, $cordovaBarcodeScanner, T, $ionicModal, $ionicPopup, $cordovaDevice) {

    var self = this;
    
    self.scan = function() {

      var deferred = $q.defer();

      $cordovaBarcodeScanner
        .scan()
        .then(function(result) {
          
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
                  //TODO: check optionals
                  var amount_inx = parts.indexOf('amount');
                  var asset_inx  = parts.indexOf('asset');

                  var obj = parts[amount_inx+1];
                  //(asset_inx != -1 && parts[asset_inx+1] == 'USD') && 
                  if( (obj - parseFloat( obj ) + 1) >= 0 ) {
                    console.log('Metiste bts: => ' + parts[0] + '=>' + obj);
                    deferred.resolve({cancelled:false, address:parts[0], amount:obj, asset_id:asset_inx}); 
                    return;
                  }
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
            

          } 
          BitShares.btsIsValidAddress(res).then(
            function(is_valid){
              deferred.resolve({cancelled:false, address:res}); 
              return;
            },
            function(error){
              BitShares.btsIsValidPubkey(res).then(
                function(is_valid){
                  deferred.resolve({cancelled:false, pubkey:res}); 
                  return;
                },
                function(error){
                  BitShares.isValidWif(res).then(
                    function(is_valid){
                      deferred.resolve({cancelled:false, privkey:res}); 
                      return;
                    },
                    function(error){
                      deferred.reject(error);
                    });        
                });

            });
          
          
          /*else if( bitcoin.bts.is_valid_address(res) ) {

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
          }*/

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
})

//Bitshares Helper
.factory('BitShares', function($translate, $q, $rootScope) {
    var self = this;

    self.createMasterKey = function() {
      var deferred = $q.defer();

      if( $rootScope.platform== "iOS" ) {

        window.plugins.BitsharesPlugin.createMasterKey(
          function(data){
            console.log(data);
            console.log('data.masterPrivateKey: '+data.masterPrivateKey);
            deferred.resolve(data.masterPrivateKey);
          },
          function(error){
            deferred.reject(error);
          }
        );

      } else {        
        var hdnode  = bitcoin.HDNode.fromBase58( bitcoin.HDNode.fromSeedBuffer( bitcoin.ECKey.makeRandom().d.toBuffer() ).toString() );        
        deferred.resolve(hdnode.toString());
      }
    
      return deferred.promise;

    };


    self.extractDataFromKey = function(key) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.extractDataFromKey(
          function(data){
            deferred.resolve(data);
          },
          function(error){
            deferred.reject(error);
          },
          key
        );

      } else {
        
        var hdnode  = bitcoin.HDNode.fromBase58(key);
        var privkey = hdnode.privKey;
        var pubkey  = hdnode.pubKey.toBuffer();
        
        deferred.resolve({ 
          address : bitcoin.bts.pub_to_address(pubkey),
          pubkey  : bitcoin.bts.encode_pubkey(pubkey), 
          privkey : privkey.toWIF() 
        });

      }

      return deferred.promise;
    
    };

    self.extendedPublicFromPrivate = function(key) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.extendedPublicFromPrivate(
          function(data){
            deferred.resolve(data.extendedPublicKey);
          },
          function(error){
            deferred.reject(error);
          },
          key
        );

      } else {
        deferred.resolve(bitcoin.HDNode.fromBase58(key).neutered().toString());
      }
      return deferred.promise;
    };

    self.encryptString = function(data, password) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

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

      } else {
        deferred.resolve(
          CryptoJS.AES.encrypt(data, password).toString()
        );

      }
      return deferred.promise;
    };

    self.decryptString = function(data, password) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

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

      } else {
        
        deferred.resolve(CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Latin1));

      }
      return deferred.promise;
    };

    self.isValidKey = function(key) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.isValidKey(
          function(data){
            deferred.resolve(true);
          },
          function(error){
            deferred.reject(error);
          },
          key
        );

      } else {
        
        try {
          bitcoin.HDNode.fromBase58(key);
        } catch (err) {
          deferred.reject(err);
          return;
        }
        deferred.resolve(true);
        
      }
      return deferred.promise;
    };

    self.isValidWif = function(wif) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.isValidWif(
          function(data){
            deferred.resolve(true);
          },
          function(error){
            deferred.reject(error);
          },
          wif
        );

      } else {
        try {
          bitcoin.ECKey.fromWIF(wif);
        } catch(err) {
          deferred.reject(err);
          return;
        }
    
        deferred.resolve(true);
        
      }
      return deferred.promise;
    };

    self.derivePrivate = function(key, deriv) {
      
      var deferred = $q.defer();
      
      if( $rootScope.platform == "iOS" ) {

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

      } else {
        
        var hdnode = bitcoin.HDNode.fromBase58(key);
        var nkey = hdnode.derive(deriv);
        deferred.resolve(nkey.toString());
        
      }
      return deferred.promise;
    };

    self.compactSignatureForHash = function(hash, key) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

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

      } else {
        
        //HACK: expose Buffer
        Buffer = bitcoin.ECKey.curve.n.toBuffer().constructor;
        var to_sign = new Buffer(hash, 'hex')
        var priv = bitcoin.ECKey.fromWIF(key); // Si ya viene en format Wif
        var signature = bitcoin.ecdsa.sign(bitcoin.ECKey.curve, to_sign, priv.d);
        var i = bitcoin.ecdsa.calcPubKeyRecoveryParam(bitcoin.ECKey.curve, priv.d.constructor.fromBuffer(to_sign), signature, priv.pub.Q);
        var compact = signature.toCompact(i, priv.pub.compressed).toString('hex');
        deferred.resolve(compact);
      }
      return deferred.promise;
    };

    self.btsWifToAddress = function(wif) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.btsWifToAddress(
          function(data){
            deferred.resolve(data.addy);
          },
          function(error){
            deferred.reject(error);
          }
          , wif

        );

      } else {
        
        deferred.resolve(bitcoin.bts.wif_to_address(wif));
        
      }
      return deferred.promise;
    };

    self.btsPubToAddress = function(pubkey) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.btsPubToAddress(
          function(data){
            deferred.resolve(data.addy);
          },
          function(error){
            deferred.reject(error);
          }
          , pubkey

        );

      } else {
        
        deferred.resolve(bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(pubkey)));
        
      }
      return deferred.promise;
    };

    self.btsIsValidAddress = function(addy) {
      
      var deferred = $q.defer();

      if( $rootScope.platform == "iOS" ) {

        window.plugins.BitsharesPlugin.btsIsValidAddress(
          function(data){
            deferred.resolve(true);
          },
          function(error){
            deferred.reject(error);
          },
          addy
        );

      } else {
        if(!bitcoin.bts.is_valid_address(addy))
        {
          err = {'message':'Invalid address'}
          deferred.reject(err);
          return;
        }
        deferred.resolve(true);
        
      }
      return deferred.promise;
    };
    
    return self;
});
