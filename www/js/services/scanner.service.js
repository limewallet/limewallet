bitwallet_services
.service('Scanner', function($q, T, $ionicModal, $ionicPopup, $cordovaDevice, BitShares) {

    var self = this;
    
    self.parseUrl = function(url){

      var deferred = $q.defer();
      var res = url.replace('bts://', 'bts:').replace('bitcoin://', 'bitcoin:');
      console.log('Scanner.parseUrl: cleaned uri: '+res);
      // BitShares (bts:) Url
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
            deferred.reject('Invalid url');
            return;
          },
          function(error){
            deferred.reject('Invalid address');
            return;
          }
        );
      } 
      else
      // Bitcoin (bitcoin:) Url
      if( res.indexOf('bitcoin:') == 0 ) {
        var parts = res.substr(8).split('?');
        //bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]
        BitShares.btcIsValidAddress(parts[0]).then(
          function(is_valid){
            if( parts.length >= 2) {
              var query_string = parts[1].split('&');
              var data    = {'amount':undefined, 'label':'', 'message':''};
              var items   = ['amount','label','message'];
              for (var i = 0; i < query_string_parts.length; i++) {
                if(query_string[i].indexOf('=')==-1)
                  continue;
                var item = undefined;
                for (var j = 0; j < items.length; j++) {
                  if(query_string[i].indexOf(items[j])==-1)
                    continue;
                  item = items[j];
                  break;
                };
                if(item===undefined)
                  continue;
                data[item] = query_string[i].split('=')[1]; 
              };
              
              if(data['amount']!=undefined && isNaN(parseFloat(data['amount'])))
                data['amount'] = undefined;
              
              console.log('Metiste bitcoin: => ' + parts[0] + '=>' + data['amount'] );
              deferred.resolve({cancelled:false, address:parts[0], amount:data['amount'], asset_id:undefined, is_bitcoin:true, label:data['label'], message:data['message']}); 
              return;
            }
            //window.plugins.toast.show( 'Invalid url', 'long', 'bottom');
            deferred.reject('Invalid url');
            return;
          },
          function(error){
            deferred.reject('Invalid address');
            return;
          }
        );
      } 
      else
      // Check if scanned data is BitShares [addy, pubkey, privkey/wif]
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
      
      return deferred.promise;      
    };

    self.scan = function() {

      var deferred = $q.defer();

      window.plugins.BarcodeScanner.scan(
          function(result) {
          console.log( 'Services.Scanner retorno algo');
          if ( result.cancelled ) {

            deferred.resolve(result);
            return;
          }

          var res = result.text;
          self.parseUrl(res).then(function(parsedDict){
            deferred.resolve(parsedDict);
          }, function(error){
            deferred.reject(error);  
          });
            
        }, function(error) {
          console.log( 'Services.Scanner retorno ERROR');
          
          deferred.reject(error);
          return;
        });

        return deferred.promise;
    };

    return self;
});


