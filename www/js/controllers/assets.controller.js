bitwallet_controllers
.controller('AssetsCtrl', function($translate, T, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading) {
  
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
  
})

