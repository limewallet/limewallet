bitwallet_controllers
.controller('HomeCtrl', function(T, Wallet, Scanner, $ionicHistory, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, BitShares, $q, $ionicLoading) {

  $scope.toggleBalance = function() {

    if(!$scope.wallet.ui.balance.allow_hide)
      return;

    $scope.wallet.ui.balance.hidden = !$scope.wallet.ui.balance.hidden;
  }
  
  $scope.scanQR = function() {
    Scanner.scan().then(function(result) {
      
      //console.log('SCAN en home (' + result.type + ') => ' + JSON.stringify(result));

      if(!result || result.cancelled)
        return;

      // PRIVKEY
      // TODO:
      
      // SEND BTC
      if(result.type == 'btc_request') { 
        //$state.go('app.send_btc', {scan_data:result}, {inherit:true});
        $scope.goToState('app.send_btc', result);
        return;
      }


      // SEND BTS
      if(result.type == 'bts_request' || 
         result.type == 'bts_address' || 
         result.type == 'bts_pubkey'  || 
         result.type == 'bts_contact') {

        //TODO: check bitAsset if request
        if( result.asset && result.asset != Wallet.data.asset.name ) {
          window.plugins.toast.show('Switch your asset first', 'long', 'bottom')
        } else {
          $scope.goToState('app.send', result);
        }
      }

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
            window.plugins.toast.show( T.i('g.cancel_ok'), 'long', 'bottom');
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
    })
    .finally(function() {
      $scope.$broadcast('scroll.refreshComplete');
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

