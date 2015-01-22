bitwallet_controllers
.controller('AssetsCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading) {
  
  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }

  
  $scope.loadData = function(){
    $scope.assets      = [];
    angular.forEach( Object.keys($scope.wallet.assets), function(asset_id) {
      var items = []
      angular.forEach(Object.keys($scope.wallet.addresses), function(addy) {
        var amount = 0;
        if( asset_id in $scope.wallet.addresses[addy].balances )
          amount = $scope.wallet.addresses[addy].balances[asset_id];

        items.push({addy:$scope.wallet.addresses[addy], balance:amount});
      });

      $scope.assets.push({
        asset    : $scope.wallet.assets[asset_id],
        items    : items
      });

    });
  }
  
  $scope.loadData();
  $scope.selectedAsset = $scope.wallet.asset.id;
  $scope.showAddys = function(asset_id){
    $scope.selectedAsset = asset_id;
  }
  
  $rootScope.$on('address-derived-changed', function(event, data) {
    $scope.showLoading();
    $scope.loadData();
    $scope.hideLoading();
      
  });

  $scope.newAddr = function(){
    // A confirm dialog
    var confirmPopup = $ionicPopup.confirm({
      title    : T.i('addys.new_address'),
      template : T.i('addys.are_you_sure'),
    }).then(function(res) {

      if(!res)
        return;
      $scope.showLoading();
      Wallet.deriveNewAddress().then(function(){
        $scope.loadData();
        $scope.hideLoading();
      }, 
      function(err){
        $scope.hideLoading();
        window.plugins.toast.show( T.i('err.unable_to_refresh'), 'long', 'bottom');
      })
      
    });
  }
  
  $scope.showActionSheet = function(addr){
    console.log('Addr showActionSheet:');
    console.log(addr);
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       //{ text: '<b>'+T.i('addys.set_as_default')+'</b>' },
       { text: T.i('addys.set_label') },
       { text: T.i('addys.copy_address') },
       { text: T.i('addys.copy_public_key') }
       ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // // Set as default
      // if(index==0)
      // {
        // Address.setDefault(addr.id).then(function() {
          // $scope.loadAddys();
        // });
      // }
      //else 
      // Set label
      if(index==0)
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
            Wallet.onDerivedAddressChanged().then(function(){
              $rootScope.$emit('address-derived-changed');
            });
          });
       });
      }
      // Copy to clipboard
      else if(index==1 || index==2)
      {
        $cordovaClipboard
          .copy(index==1 ? addr.address : addr.pubkey)
          .then(function () {
            // success
            window.plugins.toast.show( (index == 1 ? T.i('g.address') : T.i('g.public_key')) + ' ' + T.i('g.copied_to_clipboard'), 'short', 'bottom')
          }, function () {
            // error
          });
      }
      return true;
     }
   });
  }
  
})

