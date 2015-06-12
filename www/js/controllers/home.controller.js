bitwallet_controllers
.controller('HomeCtrl', function(T, Wallet, Scanner, $ionicHistory, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, BitShares, $q, $ionicLoading) {

  // $timeout(function () {
  //   $rootScope.goTo('app.settings');
  // }, 2000); 
  

  // For testing purposes, remove on prod.
  // $scope.$on( '$ionicView.beforeEnter', function(){
  //   if(!$scope || !$scope.wallet || !$scope.wallet.ui)
  //     return;
  //   if(!$scope.wallet.ui.balance.allow_hide)
  //   { 
  //     $scope.wallet.ui.balance.hidden = false;
  //     return;
  //   }
  //   $scope.wallet.ui.balance.hidden = true;
    
  // });
  
  // $timeout(function () {
  //   $scope.wallet.initialized = true;
  // }, 2000); 
  
  //Wallet.refreshBalance(false);


  $scope.alertUnlock = function(){
    // if never shown (settings)
    var alertPopup = $ionicPopup.alert({
      title:    T.i('home.wallet_is_locked'),
      template: T.i('home.wallet_is_locked_content'),
      subTitle: '',
      okText: T.i('g.got_it'), 
      okType: 'button-positive'
     });
     alertPopup.then(function(res) {
       // save settings not to show anymore.
     });
  }
  
  $scope.toggleBalance = function() {

    if(!$scope.wallet.ui.balance.allow_hide)
      return;

    $scope.wallet.ui.balance.hidden = !$scope.wallet.ui.balance.hidden;
  }
  
  $scope.scanQR = function() {

    Scanner.scan().then(function(result) {
      console.log(JSON.stringify(result));
      $scope.resolveURI(result);
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }

  // on-hold
  $scope.showComplainView = function(tx) {

  }

  $scope.showActionSheet = function(tx) {

    if( BitShares.hasXtxRateChanged(tx) )
    {
      console.log(' xxxxxxxxxxxx app.xtx_requote xtx_id:'+tx['id']);
      $state.go('app.xtx_requote', {xtx_id:tx['id']});
      return;
    }
    
    var opt_buttons = [
     { text: T.i('home.view_details') },
    ];

    if( BitShares.canCancelXTx(tx) ) {
      opt_buttons.push({ text: '<span class="assertive">'+T.i('home.cancel_operation')+'</span>' });
    }

    //if($scope.homeActionSheet!==undefined)
    //{
      //console.log('showActionSheet: HIDE sheet!');
      //$scope.homeActionSheet();
    //}

    $scope.homeActionSheet = $ionicActionSheet.show({
     buttons    : opt_buttons,
     titleText  : T.i('home.transaction_options'),
     cancelText : T.i('g.dismiss'),

     buttonClicked: function(index) {
      if(index==0) {
        if(BitShares.isXtx(tx)) {
          console.log('ES XTX');
          if(BitShares.isDeposit(tx)) {
            console.log('ES DEPOSIT');
            $state.go('app.deposit', {xtx_id:tx['id']});
          } else { 
            console.log('NO ES DEPOSIT');
            $state.go('app.xtransaction_details', {x_id:tx['id']});
          }
        } else {
          $state.go('app.transaction_details', {tx_id:tx['txid']});
        }
      }
      else 
      if(index==1) {
        var confirmPopup = $ionicPopup.confirm({
          title    : T.i('g.sure_cancel_operation'),
          template : T.i('g.sure_cancel_operation_msg'),
        }).then(function(res) {

          if(!res) {
            console.log('User didnt want to cancel :(');
            return;
          }

          $scope.showLoading(T.i('g.cancel_progress'));
          var keys = Wallet.getAccountAccessKeys();
          BitShares.cancelXTx(keys, tx.id).then(function(res){
            $ionicLoading.hide();
            Wallet.refreshBalance();
          }, function(error){
            console.log(JSON.stringify(error));
            $ionicLoading.hide();
            window.plugins.toast.show( T.i('err.cant_cancel'), 'long', 'bottom');
          });
        });
      }
      return true;
     }
   });

  }

  $scope.doRefresh = function() {
    Wallet.refreshBalance()
    .then(function() {
      window.plugins.toast.show( T.i('g.updated'), 'short', 'bottom');
    }, function(err) {
      window.plugins.toast.show( T.i('g.unable_to_refresh'), 'long', 'bottom');
    });
  };
  
  $scope.loadMore = function() {
    //$scope.$broadcast('scroll.infiniteScrollComplete');
    return;
  };

  $scope.$on('$stateChangeSuccess', function() {
    //return;
    $scope.loadMore();
  });
  
  $scope.moreDataCanBeLoaded = function() {
    return false;
  };
  
});

