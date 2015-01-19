bitwallet_controllers
.controller('ReceiveCtrl', function($scope, $rootScope, T, Address, $http, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $state) {
  
  $scope.doGenerateQRCodeRecvPayment = function(){
    var amount = parseInt(parseFloat(receiveForm.transactionAmount.value)*$scope.wallet.asset.precision);
    if( isNaN(amount) || amount <= 0 ) {
      $ionicPopup.alert({
        title    : T.i('err.invalid_amount')+' <i class="fa fa-warning float_right"></i>',
        template : T.i('err.enter_valid_amount'),
        okType   : 'button-assertive',
      });
      return;
    }

    Address.getDefault().then(function(address) {
      var amount = receiveForm.transactionAmount.value;
      $state.go('app.receive_qrcode', {address:address.address, amount:amount});
    });

  }
});

