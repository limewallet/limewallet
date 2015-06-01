bitwallet_controllers
.controller('RegisterCtrl', function($translate, T, BitShares, $scope, $rootScope, $http, $timeout, $ionicPopup, $ionicLoading, $q, Account, Wallet, $interval) {
  
  $scope.data = { valid_name  : true
                  , error     : ''
                  , new_name  : '' };

  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android"></ion-spinner> ' + T.i('g.registering'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }

  $scope.alert = function(error){
    $ionicPopup.alert({
      title    : T.i(error.title) + ' <i class="fa fa-warning float_right"></i>',
      template : T.i(error.message),
      okType   : 'button-assertive', 
    });
    return;
  }

  $scope.skip = function(){
    $scope.goTo('app.home');
  }

  $scope.register = function(){
    
    $scope.showLoading();

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
    $scope.isNameAvailable(name).then(function(){
      
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

          BitShares.registerAccount(keys, account).then(function(result) {
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
  
  $scope.isNameAvailable = function(name) {
    var deferred = $q.defer();

    BitShares.getAccount(name).then(
      function(data){
        if( data[name].error === undefined ) {
          deferred.reject('Name is not available');
          return;
        }

        deferred.resolve();
      },
      function(error){
        deferred.reject('Unknown Error - Check internet connection and try again later.');
      }
    )
    return deferred.promise;
  }
});

