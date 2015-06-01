bitwallet_controllers
.controller('CreateAccountSeedCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams, Operation, ExchangeTransaction, T){
  
  $scope.data = { retype_seed : ''
                  , error:''};
  $scope.next = function(){
    $scope.data.error = '';
    console.log('$scope.init.mode = ' + $scope.init.mode);
    // Validate seed if creating wallet.
    if($scope.isCreateInitMode())
    {
      // Check if seed was retyped correctly
      if(!$scope.isEqualSeed($scope.data.retype_seed))
      {
        $scope.data.error = T.i('err.seed_equal_error');
        console.log('seed error!!!!!!!');
        return;
      }
    }
    else{
      $scope.setSeed($scope.data.retype_seed);
    }

    console.log('Lets set password :)');
    $rootScope.goTo('app.create_wallet_password');
  }
});


