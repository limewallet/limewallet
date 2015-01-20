bitwallet_services
.service('Scanner', function($q, T, $ionicModal, $ionicPopup, $cordovaDevice, BitShares) {

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
            //if( device.platform == "Androidx" ) {
              //$ionicModal.fromTemplate('').show().then(function() {
                //$ionicPopup.alert({ title: T.i('qr_scan_cancelled') });
              //});
            //} else {
              //$ionicPopup.alert({ title: T.i('qr_scan_cancelled') });
            //}

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
