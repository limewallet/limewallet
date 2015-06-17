bitwallet_controllers
.controller('RegisterCtrl', function($translate, T, BitShares, $scope, $rootScope, $http, $timeout, $ionicPopup, $q, Account, Wallet, $interval) {
  
  $scope.data = { valid_name  : true
                  , error     : ''
                  , new_name  : '' };

  $scope.alert = function(error){
    $ionicPopup.alert({
      title    : T.i(error.title),
      template : T.i(error.message),
      okType   : 'button-assertive', 
    });
    return;
  }

  $scope.skip = function(){
    $scope.goTo('app.home');
  }

  $scope.register = function(){
    
    $scope.showLoading('register.in_progress');

    var name = $scope.data.new_name;
    if (name===undefined || name.length==0)
    {  
      name = $scope.wallet.account.name;
    }

    // Is valid name (retyped or original)
    var is_valid_name = BitShares.isValidBTSName(name);
    if(!is_valid_name.valid)
    {
      $scope.hideLoading();
      $scope.alert(is_valid_name);
      $scope.data.valid_name = false;
      $scope.error = T.i('err.invalid_name');
      return;
    }

    // Is available at BitShares Network?
    BitShares.isNameAvailable(name).then(function(){
      
      var keys = Wallet.getAccountAccessKeys();
      if (!keys)
      {
        $scope.alert({title:'err.no_active_account', message:'err.no_active_account_create'});
        $scope.hideLoading();
        return;
      }

      // console.log(' xxx new_name? ['+$scope.data.new_name+']');
      // console.log(' xxx wallet_name? ['+$scope.wallet.account.name+']');
      // return;
      
      Account.active().then(function(account) {
        account.name        = name;
        BitShares.sha256(name).then(function(hash){
          account.avatar_hash = hash;

          BitShares.registerAccount(keys, name, pubkey).then(function(result) {
            Account.setProfileInfo(account).then(function(res){
              $scope.hideLoading();
              window.plugins.toast.show( T.i('register.account_registered'), 'long', 'bottom');        
              //$scope.goTo('app.register');
              $scope.goHome();
            }, function(error){
              $scope.alert({title:'err.occurred', message:'err.account_registration'});
              $scope.hideLoading();
            });  
          }, function(err) {
            $scope.alert({title:'err.occurred', message:'err.account_registration'});
            $scope.hideLoading();
          });
          
        }, function(err){
          $scope.data.error = T.i('err.occurred') + T.i('err.please_retry');
          $scope.hideLoading();
          console.log('error sha256 account.constroller');
        });
      }, function(err) {
        $scope.data.error = T.i('err.occurred') + T.i('err.please_retry');
        $scope.hideLoading();
        console.log('error active account.constroller');
      });

    }, function(err){
      $scope.data.valid_name = false;
      $scope.data.error = T.i('err.unavailable_name');
      $scope.hideLoading();
    })
  }
  
  
});

