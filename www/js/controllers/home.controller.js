bitwallet_controllers
.controller('HomeCtrl', function(T, Wallet, Scanner, AddressBook, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, BitShares, $q, $ionicLoading) {
  
  // $timeout(function(){
  //   $state.go('app.xtx_requote', {xtx_id:6});
  // }, 2500);

  $scope.$watch('master_key_new', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if($scope && $scope.master_key_new !== undefined && $scope.master_key_new==true)
    {
      $scope.master_key_new = false;
      $state.go('app.account', {first_time:'1'});
      return;
    }
  });
  
  $scope.$on( '$ionicView.beforeEnter', function(){
    if(!$scope || !$scope.wallet || !$scope.wallet.ui)
      return;
    if(!$scope.wallet.ui.balance.allow_hide)
    { 
      $scope.wallet.ui.balance.hidden = false;
      return;
    }
    $scope.wallet.ui.balance.hidden = true;
    
  });
  
  $timeout(function () {
    $scope.wallet.initialized = true;
  }, 2000); 
  
  $scope.toggleBalance = function(){
    if($scope.wallet.ui.balance.allow_hide)
    {
      $scope.wallet.ui.balance.hidden = !$scope.wallet.ui.balance.hidden;
      return;
    }
    if($scope.wallet.ui.balance.hidden)
      $scope.wallet.ui.balance.hidden = false;
  }
  
  $scope.scanQR = function() {
    
    //var uri = 'bts:DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo/transfer/amount/1.1/asset/USD';
    var uri = 'bitcoin://BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=0.11';
    Scanner.parseUrl(uri).then(function(data){
      console.log(JSON.stringify(data));
      $scope.resolveURI(data);
    }, function(error){
        console.log(error);
    });
    
    return;           
    
    Scanner.scan().then(function(result) {
      $scope.resolveURI(result);
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }

  $rootScope.$on('address-book-changed', function(event, data) {
    Wallet.onAddressBookChanged();
  });

  $scope.showLoading = function(text){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + text,
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }
  
  // on-hold
  $scope.showComplainView = function(tx) {

  }

  $scope.showActionSheet = function(tx) {
    
    var opt_buttons = [];
    var is_xtx = BitShares.isXtx(tx);
    if(is_xtx){
      
      if(BitShares.hasXtxRateChanged(tx))
      {
        $state.go('app.xtx_requote', {xtx_id:tx['x_id']});
        return;
      }

      if(BitShares.canCancelXTx(tx)){
        opt_buttons = [
          { text: T.i('home.view_details')      },
          { text: T.i('home.refresh')           },
          { text: '<span class="assertive">'+T.i('home.cancel_operation')+'</span>'  }];
      }
      else
      opt_buttons = [
        { text: T.i('home.view_details')  },
        { text: T.i('home.refresh')       }];
      // if(BitShares.hasXtxRateChanged(tx)){
      //   opt_buttons = [
      //     { text: T.i('home.view_details') }
      //     , { text: T.i('home.refresh') }
      //     , { text: T.i('home.requote') }
      //     , { text: T.i('home.refund') }
      //     /*, { text: '<span class="assertive">'+T.i('home.cancel_operation')+'</span>' }*/
      //   ];
      // }
    }
    else{
      opt_buttons = [
          { text: '<b>'+T.i('home.add_to_book')+'</b>' },
          { text: T.i('home.view_details') }
      ];
    }

    if($scope.homeActionSheet!==undefined)
    {
      console.log('showActionSheet: HIDE sheet!');
      $scope.homeActionSheet();
    }

    // Hack porque si no no se ve el dismiss!!!!
    //$scope.cancelText = T.i('g.dismiss');
    
    console.log('showActionSheet: SHOW sheet!');
    
    $scope.homeActionSheet = $ionicActionSheet.show({
     buttons: opt_buttons,
     titleText: T.i('home.transaction_options'),
     cancelText: T.i('g.dismiss'),
     cancel: function() {
          // add cancel code..
     },
     // destructiveText: (BitShares.canCancelXTx(tx))?T.i('home.cancel_operation'):undefined,
     // destructiveButtonClicked: function() {
     //      console.log('te hago mierdaaaaaaaaaaaaaaaaaaaaaaa');
     // },
     buttonClicked: function(index) {
      if(index==0) {
        if(is_xtx){
          // VIEW DETAILS XTx
          $state.go('app.xtransaction_details', {x_id:tx['x_id']});
        }
        else{
          // Add to addressbook
          $ionicPopup.prompt({
            title: T.i('home.add_to_book'),
            inputType: 'text',
            inputPlaceholder: T.i('home.address_name'),
            cancelText: T.i('g.cancel'),
            okText: T.i('g.save')
          }).then(function(name) {
            if(name === undefined)
              return;
            AddressBook.add(tx.address, name).then(function() {
              Wallet.loadAddressBook().then(function(){
                $rootScope.$emit('address-book-changed');
              });
              window.plugins.toast.show( T.i('home.save_successful'), 'short', 'bottom');
            });
          });
        }
      }
      
      else if(index==1) {
        if(is_xtx){
          // WAKEUP XTx
          $scope.showLoading(T.i('home.refresh_in_progress'));
          var addy = Wallet.getMainAddress();
          BitShares.getBackendToken(addy).then(function(token) {
            BitShares.wakeupXTx(token, tx.x_id).then(function(res){
              $ionicLoading.hide();
              window.plugins.toast.show( T.i('home.refresh_ok_wait'), 'long', 'bottom');
              Wallet.onNewXTx(res);
              Wallet.loadBalance();
            }, function(error){
              $ionicLoading.hide();
              console.log('wakeup xtx error 1'); console.log(error);
              //window.plugins.toast.show( T.i('err.cancel_failed'), 'long', 'bottom');
            })
          }, function(error){
            $ionicLoading.hide();
            console.log('wakeup xtx error 2'); console.log(error);
            //window.plugins.toast.show( T.i('err.cancel_failed'), 'long', 'bottom');
          });
        }
        else{
          // View transaction details
          $state.go('app.transaction_details', {tx_id:tx['tx_id']});
        } 
      }
      
      else if(index==2) {
        if(is_xtx){
          if(!BitShares.canCancelXTx(tx))
          {
            $ionicPopup.alert({
              title    : T.i('err.cant_cancel'),
              template : T.i('err.cant_cancel_msg'),
              okType   : 'button-assertive', 
            });
            return;
          }
          var confirmPopup = $ionicPopup.confirm({
            title    : T.i('g.sure_cancel_operation'),
            template : T.i('g.sure_cancel_operation_msg'),
          }).then(function(res) {
          if(!res)
          {
            console.log('User didnt want to cancel :(');
            return;
          }
          console.log('User DID like quote :)');
            // CANCEL XTx
            $scope.showLoading(T.i('g.cancel_progress'));
            var addy = Wallet.getMainAddress();
            BitShares.getBackendToken(addy).then(function(token) {
              BitShares.cancelXTx(token, tx.x_id).then(function(res){
                $ionicLoading.hide();
                Wallet.refreshBalance();
                
              }, function(error){
                $ionicLoading.hide();
                console.log('cancel xtx error 1'); console.log(JSON.stringify(error)); //console.log(error);
                window.plugins.toast.show( T.i('err.requote_failed'), 'long', 'bottom');
              })
            }, function(error){
              $ionicLoading.hide();
              console.log('cancel xtx error 2'); console.log(error);
              window.plugins.toast.show( T.i('err.requote_failed'), 'long', 'bottom');
            });
          });
        }
        else{
          // NONE
        } 
      }
      
      else if(index==3) {
        if(is_xtx){
          // REFUND XTx
          $scope.showLoading(T.i('g.refund_progress'));
          var addy = Wallet.getMainAddress();
          BitShares.getBackendToken(addy).then(function(token) {
            BitShares.refundXTx(token, tx.x_id).then(function(res){
              $ionicLoading.hide();
              console.log('refund ret 1'); console.log(JSON.stringify(res)); //console.log(res);
              window.plugins.toast.show( T.i('g.refund_ok'), 'long', 'bottom');
              Wallet.refreshBalance();
            }, function(error){
              $ionicLoading.hide();
              console.log('refund error 1'); console.log(error);
              window.plugins.toast.show( T.i('err.refund_failed'), 'long', 'bottom');
            })
          }, function(error){
            $ionicLoading.hide();
            console.log('refund error 2'); console.log(error);
            window.plugins.toast.show( T.i('err.refund_failed'), 'long', 'bottom');
          });
          
          // // CANCEL XTx
          // $scope.showLoading(T.i('g.cancel_progress'));
          // var addy = Wallet.getMainAddress();
          // BitShares.getBackendToken(addy).then(function(token) {
          //   BitShares.cancelXTx(token, tx.x_id).then(function(res){
          //     $ionicLoading.hide();
          //     console.log('cancel xtx ret 1'); console.log(JSON.stringify(res)); //consoleconsole.log(res);
          //     window.plugins.toast.show( T.i('g.cancel_ok'), 'long', 'bottom');
          //     Wallet.refreshBalance();
          //   }, function(error){
          //     $ionicLoading.hide();
          //     console.log('cancel xtx error 1'); console.log(error);
          //     window.plugins.toast.show( T.i('err.cancel_failed'), 'long', 'bottom');
          //   })
          // }, function(error){
          //   $ionicLoading.hide();
          //   console.log('cancel xtx error 2'); console.log(error);
          //   window.plugins.toast.show( T.i('err.cancel_failed'), 'long', 'bottom');
          // });
        }
        else{
          // NONE
        } 
      }
      return true;
     }
   });
  }

  $scope.go = function ( path ) {
    console.log('location:'+path);
    $timeout(function () {
      $location.path(path);
    });
  };

  $scope.doRefresh = function() {
    Wallet.refreshBalance()
    .then(function() {
      $scope.$broadcast('scroll.refreshComplete');
      window.plugins.toast.show( T.i('g.updated'), 'short', 'bottom');
    }, function(err) {
      $scope.$broadcast('scroll.refreshComplete');
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

