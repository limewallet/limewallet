bitwallet_controllers
.controller('AssetsCtrl', function($translate, T, Balance, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading) {
  
  $scope.data = {balances : []}

  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android"></ion-spinner> ' + T.i('g.loading'),
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
    //Balance.add({asset_id:27, amount:12, address:'my_little_fucking_addy'}).then(function(){
      //Balance.add({asset_id:28, amount:12, address:'my_little_fucking_addy'}).then(function(){
        Balance.all().then(function(res){
          $scope.data.balances = res;
        }, function(err){

        });  
      //})
    //})
    
  }
  
  $scope.loadData();
  
})

