bitwallet_controllers
.controller('DepositCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares) {
  $scope.data = {
        amount_usd:     undefined,
        amount_btc:     undefined,
        quoting_usd:    false,
        quoting_btc:    false,
        step:           1
  
  }
  
  var usd_timeout = undefined;
  $scope.$watch('data.amount_usd', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(usd_timeout)
    {
      $timeout.cancel(usd_timeout);
      usd_timeout = undefined;
      $scope.data.quoting_btc = false;
    }
    console.log('$scope.data.quoting_usd:'+$scope.data.quoting_usd);
    if($scope.data.quoting_usd)
      return;
    usd_timeout = $timeout(function () {
      $scope.data.quoting_btc = true;
      $scope.data.amount_btc = undefined;
      // llamo a quotear
      BitShares.getBuyQuote('USD', $scope.data.amount_usd).then(function(res){
        $scope.data.amount_btc = Number(res.quote.client_pay.replace(' BTC', ''));
        $timeout(function () {
          $scope.data.quoting_btc = false;
        } , 150);
        console.log(res);
      }, function(error){
        $scope.data.quoting_btc = false;
        console.log(error);
      });
    }, 750);
  });
  
  var btc_timeout = undefined;
  $scope.$watch('data.amount_btc', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(btc_timeout)
    {
      $timeout.cancel(btc_timeout);
      btc_timeout = undefined;
      $scope.data.quoting_usd = false;
    }
    console.log('$scope.data.quoting_btc:'+$scope.data.quoting_btc);
    if($scope.data.quoting_btc)
      return;
    btc_timeout = $timeout(function () {
      $scope.data.quoting_usd = true;
      $scope.data.amount_usd = undefined;
      // llamo a quotear
      BitShares.getSellQuote('BTC', $scope.data.amount_btc).then(function(res){
        $scope.data.amount_usd = Number(res.quote.client_recv.replace(' USD', ''));
        $timeout(function () {
          $scope.data.quoting_usd = false;
        } , 150);
        console.log(res);
      }, function(error){
        $scope.data.quoting_usd = false;
        console.log(error);
      });
    }, 750);
  });
  
  // $scope.showLoading = function(){
    // $ionicLoading.show({
      // template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      // animation    : 'fade-in',
      // showBackdrop : true,
      // maxWidth     : 200,
      // showDelay    : 10
    // }); 
  // }

  // $scope.hideLoading = function(){
    // $ionicLoading.hide();
  // }
  
})

