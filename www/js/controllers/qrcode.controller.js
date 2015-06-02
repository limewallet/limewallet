bitwallet_controllers
.controller('ReceiveQrcodeCtrl', function($scope, $ionicHistory, $rootScope, T, $cordovaClipboard, $cordovaSocialSharing, $stateParams, $http, $ionicNavBarDelegate, $location, $ionicLoading, $timeout, $ionicModal, $ionicPopup) {
  
  $scope.address    = $stateParams.address;
  $scope.amount     = $stateParams.amount;
  $scope.request    = 'bts:'+$scope.address+'/transfer/amount/'+$scope.amount+'/asset/'+$scope.wallet.asset.symbol;
        
  //console.log('request -> ' + $scope.request);
  //console.log('imgurl -> ' + $scope.imgurl);

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

  var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: $scope.request,
    width: 256,
    height: 256,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
  });
  
  //$scope.showLoading();
  
  $scope.doShareRecvPayment = function(){
    $cordovaSocialSharing
    .share(null, null, null, $scope.request)
    .then(function(result) {
      // success

    }, function(err) {
      // error
      window.plugins.toast.show( T.i('err.unable_to_share_req'), 'long', 'bottom')
    });
  }
  
  $scope.doCopyRecvPayment = function(){
    $cordovaClipboard
      .copy($scope.request)
      .then(function () {
        // success
        window.plugins.toast.show( T.i('receive.copied_to_clipboard'), 'long', 'bottom')
      }, function () {
        // error
        window.plugins.toast.show( T.i('err.unable_to_copy_req'), 'long', 'bottom')
      });
  }

  $scope.goBack = function() {
    $ionicHistory.goBack();
  };
  
});
