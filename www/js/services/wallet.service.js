bit_wallet_services
//Bitshares Service
.factory('Wallet', function($translate, $q, MasterKey, BitShares) {
    var self = this;

    self.getMasterPubkey = function(){

      var deferred = $q.defer();
      MasterKey.get().then(function(master_key) {
        if(master_key === undefined)  {
          deferred.reject('no_master_key');
          return;
        }
        BitShares.extendedPublicFromPrivate(master_key.key).then(function(extendedPublicKey){
          deferred.resolve({masterPubkey:extendedPublicKey, deriv:master_key.deriv});
        }, function(err) {
          deferred.reject(err);  
        })
      }, function(err) {
        deferred.reject(err);    
      });

      return deferred.promise;
    } 
    
    self.getBalances = function() {
      var deferred = $q.defer();

      self.getMasterPubkey().then(function(res) {
        BitShares.getBalance(res.masterPubkey+':'+res.deriv).then(function(balances) {
          deferred.resolve(balances);
        }, function(err) {
          deferred.reject(err);
        })
      }, function(err) {
        deferred.reject(err); 
      });

      return deferred.promise;
    };

    return self;
});

