bitwallet_controllers
.controller('ImportPrivCtrl', function($scope, Wallet, BitShares, T, $ionicLoading, $ionicModal, $ionicPopup, $stateParams, $ionicSideMenuDelegate, $q) {
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data  = {
    amount    : 0, 
    priv_key  : '', 
    asset     : Wallet.data.asset.symbol,
    sweep     : undefined
  };

  $scope.sweepBalance = function() {
    var deferred = $q.defer();

    $scope.showLoading('import_priv.transfering');

    var new_tx = $scope.data.sweep;

    $scope.signAll(new_tx.to_sign, new_tx.required_signatures, $scope.data.priv_key).then( function(signatures) {
      new_tx.tx.signatures = signatures;

      BitShares.sendAsset(new_tx.tx, new_tx.secret).then(function(res) {

        $scope.hideLoading();
        deferred.resolve();
        $scope.goToSuccess({
          amount  : $scope.data.amount,
          type    : 'sweep'
        });

      }, function(err) {
        console.log(JSON.stringify(err));
        $scope.hideLoading();
        $scope.showAlert('import_priv.sweep_balance',err);
        deferred.reject();
      });

    }, function(err) {
      console.log(JSON.stringify(err));
      $scope.hideLoading();
      $scope.showAlert('import_priv.sweep_balance',err);
      deferred.reject();
    });

    return deferred.promise;
  }
  
  $scope.$on( '$ionicView.enter', function(){
    $ionicSideMenuDelegate.canDragContent(false);
  });

  $scope.$on( '$ionicView.leave', function(){
    $ionicSideMenuDelegate.canDragContent(true);
  });

  //console.log('->import priv controller ' + JSON.stringify($stateParams));

  $scope.showLoading('import_priv.loading_balance');

  $scope.data.priv_key = $stateParams.private_key;

  BitShares.btsWifToAddress($stateParams.private_key).then(function(addy) {

    $scope.data.addy = addy;

    BitShares.sweep(addy, Wallet.data.account.address, Wallet.data.asset.name).then(function(sweep) {

      $scope.data.amount = sweep.total/Wallet.data.asset.precision;
      $scope.hideLoading();

      $scope.data.sweep = sweep; 

    }, function(err) {
      $scope.hideLoading();
      console.log('Import Priv #2' + JSON.stringify(err));
    });

  }, function(err) {
    $scope.hideLoading();
    console.log('Import Priv #1' + JSON.stringify(err));
  }); 



});
