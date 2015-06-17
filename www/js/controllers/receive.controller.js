bitwallet_controllers
.controller('ReceiveCtrl', function($scope, $rootScope, T, $http, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $state) {
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.doGenerateQRCodeRecvPayment = function(){
    var amount = parseInt(parseFloat(receiveForm.transactionAmount.value)*$scope.wallet.asset.precision);
    if( isNaN(amount) || amount <= 0 ) {
      $ionicPopup.alert({
        title    : T.i('err.invalid_amount'),
        template : T.i('err.enter_valid_amount'),
        okType   : 'button-assertive',
      });
      return;
    }

    var amount = receiveForm.transactionAmount.value;
    $state.go('app.receive_qrcode', {amount:amount});

    // Address.getDefault().then(function(address) {
    //   var amount = receiveForm.transactionAmount.value;
    //   $state.go('app.receive_qrcode', {address:address.address, amount:amount});
    // });

  }

});

