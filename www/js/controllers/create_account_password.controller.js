bitwallet_controllers
.controller('CreateAccountPwdCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, T, ){
  
  $scope.data = { password:         undefined,
                  retype_password:  undefined};
  
  $scope.createWallet = function(){


    if($scope.data.password!=$scope.data.retype_password)
    {
      $scope.data.error = T.i('err.password_mismatch');
      return;
    }

    var do_encrypt = ($scope.data.password!='');
    
    Account.create(privkey, encrypted, pubkey, address, number).then(function(){

    }, function(error){

    });

    $scope.goHome();
  }
});


