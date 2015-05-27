bitwallet_services
.service('Scanner', function($q, T, $ionicModal, $ionicPopup, $cordovaDevice, BitShares) {

    var self = this;

    self.getBTSParts = function(url) {

      //xts:name:XTSaccountkey
      //xts:name/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] 
      //xts:name:XTSaccountkey/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] (unregistered accounts) (Not Yet Implemented)

      res = {};

      var data  = url.substring(4);
      var parts = data.split('/');

      var name_parts = parts[0].split(':');
      
      //Contact account
      if (parts.length == 1 && name_parts.length == 2) {
        res.type   = 'contact';
        res.name   = name_parts[0];
        res.pubkey = name_parts[1];
        return res;
      }

      //Request Payment
      if(parts.length > 1 && parts[1] == 'transfer') {
        res.type   = 'request';
        res.name   = name_parts[0];
        res.pubkey = name_parts.length > 1 ? name_parts[1] : undefined;

        var expected = ['amount', 'memo', 'from', 'asset'];
        for(var i=2; i<parts.length; i+=2) {
          if( expected.indexOf(parts[i]) != -1 )
            res[parts[i]] = parts[i+1];
        } 

        return res;
      }

      return undefined;
    }

    self.isValidBTSDestination = function (address) {
      var deferred = $q.defer();
      BitShares.isValidPubkey(query).then(function(res) {
        deferred.resolve(true);
      }, function(err) {
        BitShares.btsIsValidAddress(query).then(function(res) {
          deferred.resolve(false);
        }, function(err) {

          //Not a pubkey, not an address ... lets check if its lowecase and dashes not ending in dash.
          //HACK: use regex
          var tmp = address.toLowerCase();

          //No upercase
          if ( tmp != address ) {
            deferred.reject();
            return;
          }

          //Starts with a letter
          if (tmp[0] > 'z' || tmp[0] < 'a') {
            deferred.reject();
            return;
          }
          
          //Ends with a letter or a number
          if (tmp[0] > 'z' || tmp[0] < 'a' || tmp[0] < '0' || tmp[0] > '9') {
            deferred.reject();
            return;
          }

          var reject = false;
          var l_a    = 'a'.charCodeAt(0);
          var l_z    = 'z'.charCodeAt(0);
          var l_0    = '0'.charCodeAt(0);
          var l_9    = '9'.charCodeAt(0);
          var l_dash = '-'.charCodeAt(0);
          var l_dot  = '.'.charCodeAt(0);

          for(var i=0; i<tmp.length; i++) {
            var c = tmp.charCodeAt(i);
            if ( (c >= l_a && c <= l_z) || 
                 (c >= l_0 && c <= l_9) || 
                 (c == l_dash ) ||
                 (c == l_dot) ) continue;

            reject = true;
            break;
          }

          if (reject)
            deferred.reject();
          else
            deferred.resolve(false);
        });
      });
      return deferred.promise;
    }
      
    self.parseUrl = function(url){

      var deferred = $q.defer();

      url = url.replace('bts://', 'bts:');
      url = url.replace('bitcoin://', 'bitcoin:');

      console.log('Scanner.parseUrl: cleaned uri: '+url);
      
      // BitShares (bts:) Url
      if( url.indexOf('bts:') == 0 ) {

        var info = self.getBTSParts(url);

        if( info === undefined ) {
          deferred.reject('Invalid url');
          return;
        }

        //if(self.isValidBTSDestination(info.name

        deferred.resolve(info);
      } 
      //else
      //// Bitcoin (bitcoin:) Url
      //if( res.indexOf('bitcoin:') == 0 ) {
        //var parts = res.substr(8).split('?');
        ////bitcoin:<address>[?amount=<amount>][?label=<label>][?message=<message>]
        //BitShares.btcIsValidAddress(parts[0]).then(
          //function(is_valid){
            //if( parts.length >= 2) {
              //var query_string_parts = parts[1].split('&');
              //var data    = {'amount':undefined, 'label':'', 'message':''};
              //var items   = ['amount','label','message'];
              //for (var i = 0; i < query_string_parts.length; i++) {
                //if(query_string_parts[i].indexOf('=')==-1)
                  //continue;
                //var item = undefined;
                //for (var j = 0; j < items.length; j++) {
                  //if(query_string_parts[i].indexOf(items[j])==-1)
                    //continue;
                  //item = items[j];
                  //break;
                //};
                //if(item===undefined)
                  //continue;
                //data[item] = query_string_parts[i].split('=')[1]; 
              //};
              
              //if(data['amount']!=undefined && isNaN(parseFloat(data['amount'])))
                //data['amount'] = undefined;
              
              //console.log('Metiste bitcoin: => ' + parts[0] + '=>' + data['amount'] );
              //deferred.resolve({cancelled:false, address:parts[0], amount:data['amount'], asset_id:undefined, is_btc:true, label:data['label'], message:data['message']}); 
              //return;
            //}
            ////window.plugins.toast.show( 'Invalid url', 'long', 'bottom');
            //deferred.reject('Invalid url');
            //return;
          //},
          //function(error){
            //deferred.reject('Invalid address');
            //return;
          //}
        //);
      //} 
      //else
      //// Check if scanned data is BitShares [addy, pubkey, privkey/wif]
      //BitShares.btsIsValidAddress(res).then(
        //function(is_valid){
          //console.log(' barcodescanner dijo es valid address : ' + res);
          //deferred.resolve({cancelled:false, address:res}); 
          //return;
        //},
        //function(error){
          //console.log(' barcodescanner dijo NO es valid address ');
          //return BitShares.btsIsValidPubkey(res).then(
            //function(is_valid){
              //console.log(' barcodescanner dijo es valid pubkey : ' + res);
              //deferred.resolve({cancelled:false, pubkey:res}); 
              //return;
            //},
            //function(error){
              //console.log(' barcodescanner dijo NO es valid pubkey ');
              //return BitShares.isValidWif(res).then(
                //function(is_valid){
                  //console.log(' barcodescanner dijo es valid WIF : ' + res);
                  //deferred.resolve({cancelled:false, privkey:res}); 
                  //return;
                //},
                //function(error){
                  //console.log(' barcodescanner dijo NO es valid WIF' );
                  //deferred.reject(error);
                //});        
            //});

        //});
      
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

        self.parseUrl(result.text).then(function(info){
          info.cancelled = false;
          deferred.resolve(info);
        }, function(error) {
          deferred.reject(error);  
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


