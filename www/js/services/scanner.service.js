bitwallet_services
.service('Scanner', function($q, T, $ionicModal, $ionicPopup, $cordovaDevice, BitShares) {

    var self = this;

    self.parseBTCUrl = function(url) {

      var deferred = $q.defer();
      var res      = {};

      ////bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]

      var data  = url.substring(8);
      var parts = data.split('?');

      var address = parts[0];
      if ( parts.length > 1 ) {
        parts = parts[1].split('&');
      }

      BitShares.btcIsValidAddress(address).then(function() {

        res.type    = 'btc_request';
        res.address = address;

        var expected = ['amount', 'label', 'message'];
        
        console.log('FORMATO:' + JSON.stringify(parts));

        for(var i=0; i<parts.length; i++) {
          var tmp = parts[i].split('=');
          if( expected.indexOf(tmp[0]) != -1 )
            res[tmp[0]] = tmp[1];
        } 

        deferred.resolve(res);

      }, function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    }

    self.parseBTSUrl = function(url) {

      var deferred = $q.defer();
      var res      = {};

      //xts:name:XTSaccountkey
      //xts:name/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] 
      //xts:name:XTSaccountkey/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] (unregistered accounts) (Not Yet Implemented)

      var data  = url.substring(4);
      var parts = data.split('/');

      var name_parts = parts[0].split(':');
      
      //Contact account
      if (parts.length == 1 && name_parts.length == 2) {

        res.type   = 'bts_contact';
        res.name   = name_parts[0];
        res.pubkey = name_parts[1];

        if ( BitShares.isValidBTSName(res.name).valid ) {

          BitShares.btsIsValidPubkey(res.pubkey).then(function() {
            deferred.resolve(res);
          }, function(err) {
            deferred.reject(err);
          });

        } else {
          deferred.reject('err.invalid_name');
        }

        return deferred.promise;
      }

      //Request Payment
      if(parts.length > 1 && parts[1] == 'transfer') {
        res.type   = 'bts_request';
        res.name   = name_parts[0];
        res.pubkey = name_parts.length > 1 ? name_parts[1] : undefined;

        var expected = ['amount', 'memo', 'from', 'asset'];
        for(var i=2; i<parts.length; i+=2) {
          if( expected.indexOf(parts[i]) != -1 )
            res[parts[i]] = parts[i+1];
        } 

        if ( BitShares.isValidBTSName(res.name).valid ) {

          if ( !res.pubkey ) {
            deferred.resolve(res);
          } else {

            BitShares.btsIsValidPubkey(res.pubkey).then(function() {
              deferred.resolve(res);
            }, function(err) {
              deferred.reject(err);
            });

          } 

        } else {
          deferred.reject(err);
        }

        return deferred.promise;
      }

      deferred.reject('invalid url');
      return deferred.promise;
    }

    self.parseScannedData = function(data) {

      var deferred = $q.defer();

      data = data.replace('bts://', 'bts:');
      data = data.replace('bitcoin://', 'bitcoin:');

      console.log('Scanner.parseUrl: cleaned data: '+data);
      
      // BitShares (bts:) Url
      if( data.indexOf('bts:') == 0 ) {

        self.parseBTSUrl(data).then(function(info) {
          deferred.resolve(info);
        }, function(err) {
          deferred.reject(err);
        });

        return deferred.promise;
      } 
      
      // Bitcoin (bitcoin:) Url
      if( data.indexOf('bitcoin:') == 0 ) {

        self.parseBTCUrl(data).then(function(info) {
          deferred.resolve(info);
        }, function(err) {
          deferred.reject(err);
        });

        return deferred.promise;
      } 

      // Check if scanned data is BitShares [addy, pubkey, privkey/wif] or Bitcoin [addy]
      BitShares.btsIsValidAddress(data).then(
        function(is_valid){
          console.log(' barcodescanner dijo es valid address : ' + data);
          deferred.resolve({
            type : 'bts_address',
            address : data
          }); 
        },
        function(error){
          //console.log(' barcodescanner dijo NO es valid address ');
          BitShares.btsIsValidPubkey(data).then(
            function(is_valid){
              console.log(' barcodescanner dijo es valid pubkey : ' + data);
              deferred.resolve({
                type   : 'bts_pubkey',
                pubkey : data
              }); 
            },
            function(error){
              //console.log(' barcodescanner dijo NO es valid pubkey ');
              BitShares.isValidWif(data).then(
                function(is_valid){
                  console.log(' barcodescanner dijo es valid WIF : ' + data);
                  deferred.resolve({
                    type : 'bts_wif',
                    wif  : data
                  }); 
                },
                function(error){
                  //console.log(' barcodescanner dijo NO es valid WIF' );
                  BitShares.btcIsValidAddress(data).then(
                    function(is_valid){
                      console.log(' barcodescanner dijo es valid btc address : ' + data);
                      deferred.resolve({
                        type    : 'btc_address',
                        address : data
                      }); 
                    },
                    function(error){
                      console.log(' barcodescanner dijo NO es valid DATA + ' + JSON.stringify(error) );
                      deferred.reject(error);
                    });
                });
            });
        });
      
      return deferred.promise;      
    };

    self.scan = function() {

      var deferred = $q.defer();

      window.plugins.BarcodeScanner.scan(function(result) {

        console.log(JSON.stringify(result));

        if ( result.cancelled ) {
          deferred.resolve(result);
          return;
        }

        self.parseScannedData(result.text).then(function(info){
          info.cancelled = false;
          deferred.resolve(info);
        }, function(error) {
          console.log('Services.Scanner Invalid or Unrecognizable input data.');
          deferred.reject('err.invalid_scan_data');  
        });
          
      }, function(error) {
        console.log('Services.Scanner retorno ERROR');
        deferred.reject(error);
        return;
      });

      return deferred.promise;
    };

    return self;
});


