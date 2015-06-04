bitwallet_controllers
.controller('ReceiveQrcodeCtrl', function($scope, $ionicHistory, $rootScope, T, $cordovaClipboard, $cordovaSocialSharing, $stateParams, $ionicLoading, $timeout, $ionicModal, $ionicPopup, Wallet) {
  
  console.log(' ***** ReceiveQrcodeCtrl amount: '+$stateParams.amount);

  $scope.data = { amount          : undefined,
                  uri             : undefined,
                  name_or_pubkey  : undefined};

  $scope.buildUri = function(){

    $scope.data.amount     = $stateParams.amount;
    if(!$scope.data.amount || isNaN($scope.data.amount) || $scope.data.amount <= 0 ) {
      $scope.goTo('app.receive');
      window.plugins.toast.show( T.i('err.invalid_amount'), 'long', 'bottom');
      return;
    }

    if($scope.wallet.account.registered==1){
      $scope.data.uri             = 'bts:'+$scope.wallet.account.name+'/transfer/amount/'+$scope.data.amount+'/asset/'+$scope.wallet.asset.name;
      $scope.data.name_or_pubkey  = $scope.wallet.account.name;
    }
    else{
      $scope.data.uri = 'bts:'+$scope.wallet.account.name+':'+$scope.wallet.account.pubkey+'/transfer/amount/'+$scope.data.amount+'/asset/'+$scope.wallet.asset.name;
      $scope.data.name_or_pubkey  = $scope.wallet.account.pubkey;
    }
    /*
      xts:name/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] (registered accounts)
      xts:name:XTSaccountkey/transfer/[amount/amount/][memo/memo text/][from/sender name/][asset/asset name] (unregistered accounts) (Not Yet Implemented)
    */

    var qrcode = new QRCode(document.getElementById("qrcode"), {
      text: $scope.data.uri,
      width: 324,
      height: 324,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });
    
  };
  
  $scope.buildUri();
  
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

  $scope.doShareRecvPayment = function(){
    $cordovaSocialSharing
    .share(null, null, null, $scope.data.uri)
    .then(function(result) {
      // success

    }, function(err) {
      // error
      window.plugins.toast.show( T.i('err.unable_to_share_req'), 'long', 'bottom')
    });
  }
  
  $scope.doCopyRecvPayment = function(){
    $cordovaClipboard
      .copy($scope.data.uri)
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
