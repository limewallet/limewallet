bitwallet_controllers
.controller('AccountCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard) {
  
  $scope.assets      = [];

  angular.forEach( Object.keys($scope.wallet.assets), function(asset_id) {

    var items = []
    angular.forEach(Object.keys($scope.wallet.addresses), function(addy) {
      var amount = 0;
      if( asset_id in $scope.wallet.addresses[addy].balances )
        amount = $scope.wallet.addresses[addy].balances[asset_id];

      items.push({addy:addy, balance:amount});
    });

    $scope.assets.push({
      asset    : $scope.wallet.assets[asset_id],
      items    : items
    });

  });
  
  $scope.data = {addys:[]}

  $scope.loadAddys = function() {
    Address.all().then(function(addys) {
        $scope.data.addys = addys;
    });
  };

  $scope.loadAddys();
    
  $scope.newAddr = function(){
     // A confirm dialog
     var confirmPopup = $ionicPopup.confirm({
       title    : T.i('addys.new_address'),
       template : T.i('addys.are_you_sure'),
     }).then(function(res) {

      if(!res)
        return;

      MasterKey.get().then(function(master_key) {
        master_key.deriv = parseInt(master_key.deriv)+1;

        BitShares.derivePrivate(master_key.key, master_key.deriv)
        .then(
          function(extendedPrivateKey){
            BitShares.extractDataFromKey(extendedPrivateKey)
            .then(
              function(keyData){
                MasterKey.store(master_key.key, master_key.deriv).then(function() {
                  Address.create(master_key.deriv, 
                                keyData.address, 
                                keyData.pubkey, 
                                keyData.privkey, 
                                false, '').then(function(){
                      $scope.loadAddys();
                      $rootScope.$emit('wallet-changed');
                  });
                });
            })
        })
        
        // var hdnode = bitcoin.HDNode.fromBase58(master_key.key);
        // var nkey = hdnode.derive(master_key.deriv);
        // var privkey = nkey.privKey;
        // var pubkey  = nkey.pubKey.toBuffer();

        // MasterKey.store(master_key.key, master_key.deriv).then(function() {
          // Address.create(master_key.deriv, 
                         // bitcoin.bts.pub_to_address(pubkey), 
                         // bitcoin.bts.encode_pubkey(pubkey), 
                         // privkey.toWIF(), 
                         // false, '').then(function(){
            // $scope.loadAddys();
            // $rootScope.$emit('wallet-changed');
          // });
        // });
      });
     });
  }
  
  $scope.showActionSheet = function(addr){
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('addys.set_as_default')+'</b>' },
       { text: T.i('addys.set_label') },
       { text: T.i('addys.copy_address') },
       { text: T.i('addys.copy_public_key') }
       ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // Set as default
      if(index==0)
      {
        Address.setDefault(addr.id).then(function() {
          $scope.loadAddys();
        });
      }
      // Set label
      else if(index==1)
      {
        // load current label
        $ionicPopup.prompt({
          title            : T.i('addys.set_label'),
          inputPlaceholder : addr.label,//T.i('g.label'),
          inputType        : 'text',
          cancelText       : T.i('g.cancel')
       }).then(function(label) {
          if(label === undefined)
            return;
          Address.setLabel(addr.id, label).then(function() {
            $scope.loadAddys();
          });
       });
      }
      // Copy to clipboard
      else if(index==2 || index==3)
      {
        $cordovaClipboard
          .copy(index==2 ? addr.address : addr.pubkey)
          .then(function () {
            // success
            window.plugins.toast.show( (index == 2 ? T.i('g.address') : T.i('g.public_key')) + ' ' + T.i('g.copied_to_clipboard'), 'short', 'bottom')
          }, function () {
            // error
          });
      }
      return true;
     }
   });
  }
  
})

