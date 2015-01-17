var bitwallet_controllers = angular.module('bit_wallet.controllers', ['bit_wallet.services']);

bitwallet_controllers

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          element.on('load', function() {
            scope.hideLoading();
          });
        }
    };
})

.controller('ReceiveQrcodeCtrl', function($scope, $rootScope, T, $cordovaClipboard, $cordovaSocialSharing, Address, $stateParams, $http, $ionicNavBarDelegate, $location, $ionicLoading, $timeout, $ionicModal, $ionicPopup) {
  
  $scope.address    = $stateParams.address;
  $scope.amount     = $stateParams.amount;
  //$scope.asset_id   = $rootScope.asset_id;
  $scope.asset      = $rootScope.asset; //$rootScope.assets[$rootScope.asset_id];
  $scope.request    = 'bts:'+$scope.address+'/transfer/amount/'+$scope.amount+'/asset/'+$scope.asset.symbol; //symbol or asset_id required -> ?USD?
  $scope.imgurl     = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.request)+'&chld=H|0'

  //console.log('request -> ' + $scope.request);
  //console.log('imgurl -> ' + $scope.imgurl);

  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.showLoading();
  
  $scope.doShareRecvPayment = function(){
    $cordovaSocialSharing
    .share(null, null, null, $scope.request)
    .then(function(result) {
      // success

    }, function(err) {
      // error
      window.plugins.toast.show( T.i('err.unable_to_share_req'), 'long', 'bottom')
    });
  }
  
  $scope.doCopyRecvPayment = function(){
    $cordovaClipboard
      .copy($scope.request)
      .then(function () {
        // success
        window.plugins.toast.show( T.i('receive.copied_to_clipboard'), 'long', 'bottom')
      }, function () {
        // error
        window.plugins.toast.show( T.i('err.unable_to_copy_req'), 'long', 'bottom')
      });
  }

  $scope.goHome = function() {
    $location.path('/home');
  };
  
})

.controller('ReceiveCtrl', function($scope, $rootScope, T, Address, $http, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $state) {
  $scope.asset = $rootScope.asset; //$rootScope.assets[$rootScope.asset_id];
  
  $scope.doGenerateQRCodeRecvPayment = function(){
    var amount = parseInt(parseFloat(receiveForm.transactionAmount.value)*$scope.asset.precision);
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
    
  $scope.goBack = function() {
    console.log('trying to go back');
    $ionicNavBarDelegate.back();
  };
})

.controller('ImportPrivCtrl', function($scope, ENVIRONMENT, T, $q, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, BitShares) {
  
  $scope.imported_pk = [];
  $scope.showLoading = function(){
    $ionicLoading.show({
      template      : '<i class="icon ion-looping"></i> ' + T.i('import_priv.loading_balance'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200
      //showDelay    : 0
    }); 
  }

  $scope.showLoading();
  
  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.getImportedKeyBalance = function(addr){
    
    var url;
    if(ENVIRONMENT.test) {
      url = 'https://bsw-test.latincoin.com/api/v1/addrs/' + addr + '/balance';
    } else {
      url = 'https://bsw.latincoin.com/api/v1/addrs/' + addr + '/balance';
    }


    $http.get(url)
    .success(function(r) {
      var total = 0;
      var other_symbols = [];
      if(r.error === undefined)
      { 
        r.balances.forEach(function(b){
          if(b.asset_id == $scope.asset.id) {
            total += b.amount;
          } else {
            //TODO: warining!!
            if(b.amount > 0) {
              other_symbols.push($rootScope.assets[b.asset_id].symbol);
            }
          }
        });
      }
      else
      {
        $location.path('/home');
        window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        return;
      }

      if(total == 0 && other_symbols.length > 0) {

       $ionicPopup.alert({
         title    : T.i('import_priv.paper_wallet'),
         template : T.i('import_priv.switch_currency', {'symbols':other_symbols.join(',')}),
       }).then(function(res) {
        if(res) {
          $location.path('/home');
        }
       });

       return;
      }

      $scope.imported_pk.amount = total/$scope.asset.precision;
    })
    .error(function(data, status, headers, config) {
      $timeout(function () {
          $location.path('/home');
          window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        }, 500);
    })
    .finally(function() {
      $rootScope.$emit('refresh-done');
      $scope.hideLoading();
    });
  }
  
  $scope.goBack = function() {
    console.log('trying to go back SendCtrl');
    $ionicNavBarDelegate.back();
  };
  
  $scope.sweepBalance = function(){
    
    var fee=250;
    var amount = parseInt(parseFloat($scope.imported_pk.amount)*1e4);
    console.log($scope.imported_pk.amount + ' => ' + amount);
    if ( isNaN(amount) || amount <= 0 ) {
       $ionicPopup.alert({
         title    : T.i('err.empty_paper_wallet') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.paper_no_balance'),
         okType   : 'button-assertive', 
       });
       return;
    }
    amount = amount - fee;
    
    Address.getDefault().then(function(my_default_address) {
      
      $scope.sweeping_modal.show();
      var from  = [{'address':$scope.imported_pk.address}];
      var tx_req = {
        "asset" : 22,
        "fee"   : fee,
        "from"  : from,
        "to"    : [{
            "address" : my_default_address.address,
            "amount"  : amount
        }]
      }

      console.log('voy a llamar a new en sweeping');

      var url;
      if(ENVIRONMENT.test) {
        url = 'https://bsw-test.latincoin.com/api/v1/txs/new';
      } else {
        url = 'https://bsw.latincoin.com/api/v1/txs/new';
      }

      $http.post(url, tx_req)
      .success(function(r) {
        if(r.error !== undefined) {
          console.log('There where errors ' + r.error);
          var alertPopup = $ionicPopup.alert({
             title: T.i('err.unable_to_create_tx') + ' <i class="fa fa-warning float_right"></i>',
             template: r.error,
             okType: 'button-assertive', 
          })
          .then(function() {
            $scope.sweeping_modal.hide();
          });
          return;
        }

        $scope.sweeping.message = 'send.signing_transaction';
        
        //console.log(r.tx);
        //console.log(r.to_sign);
        //console.log(r.required_signatures);

        r.tx.signatures = [];

        //HACK: expose Buffer
        // Buffer = bitcoin.ECKey.curve.n.toBuffer().constructor;
        // var to_sign = new Buffer(r.to_sign, 'hex')
         
        // var priv = bitcoin.ECKey.fromWIF($scope.imported_pk.priv_key); // Si ya viene en format Wif
        // var signature = bitcoin.ecdsa.sign(bitcoin.ECKey.curve, to_sign, priv.d);
        // var i = bitcoin.ecdsa.calcPubKeyRecoveryParam(bitcoin.ECKey.curve, priv.d.constructor.fromBuffer(to_sign), signature, priv.pub.Q);
        // var compact = signature.toCompact(i, priv.pub.compressed).toString('hex');
        // console.log(compact);
        // r.tx.signatures.push(compact);
        BitShares.compactSignatureForHash(r.to_sign, $scope.imported_pk.priv_key)
        .then(function(compact){
          r.tx.signatures.push(compact);
          console.log('firmado .. mandando'); 
          $scope.sweeping.message = 'send.sending_transaction';

          if(ENVIRONMENT.test) {
            url = 'https://bsw-test.latincoin.com/api/v1/txs/send';
          } else {
            url = 'https://bsw.latincoin.com/api/v1/txs/send';
          }

          $http.post(url, r.tx)
          .success(function(r) {
            $scope.sweeping_modal.hide();
            $location.path('/home');
            window.plugins.toast.show( T.i('import_priv.transaction_sent'), 'long', 'bottom')
            $rootScope.transactions.unshift({sign:1, address:$scope.imported_pk.address, addr_name:$scope.imported_pk.address, amount:amount/$scope.asset.precision, state:'P', date: new Date().getTime()});
          })
          .error(function(data, status, headers, config) {
             console.log('error...: '+status);
              var alertPopup = $ionicPopup.alert({
                 title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                 template: T.i('err.server_error'),
                 okType: 'button-assertive', 
              })
              .then(function() {
                $scope.sweeping_modal.hide();
              });
          })
          .finally(function() {
             console.log('finally...');
          });
        })
      })
      .error(function(data, status, headers, config) {
         console.log('error...: '+status);
           var alertPopup = $ionicPopup.alert({
              title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
              template: T.i('err.server_error'),
              okType: 'button-assertive', 
           })
          .then(function() {
            $scope.sweeping_modal.hide();
          });
      })
      .finally(function() {
         console.log('finally...');
      });
      
    });
  }
  
  // Load sweeping modal
  $ionicModal.fromTemplateUrl('sweeping-modal.html', function($ionicModal) {
      $scope.sweeping_modal = $ionicModal;
  }, {
      // Use our scope for the scope of the modal to keep it simple
      scope: $scope,
      // The animation we want to use for the modal entrance
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
  });
  
  /* Initialization */
  $scope.initImport = function(){
  
    $scope.imported_pk = {amount:{}, priv_key:'NOT_AVAILABLE', address:'NOT_AVAILABLE'};
    $scope.sweeping = {message:'send.generating_transaction'};
    
    $scope.imported_pk.priv_key = $stateParams.private_key;
    BitShares.btsWifToAddress($scope.imported_pk.priv_key)
    .then(function(addy){
      $scope.imported_pk.address = addy; //bitcoin.bts.wif_to_address($scope.imported_pk.priv_key);
      $timeout( function() { 
        $scope.getImportedKeyBalance($scope.imported_pk.address);
      }, 1000);
    })
  }
  $scope.initImport();
})

.controller('AddressBookCtrl', function($scope, $state, T, $ionicHistory, $ionicPopup, $ionicActionSheet, AddressBook, $rootScope, $ionicNavBarDelegate, $stateParams){

  $scope.showActionSheet = function(addr){
    var fav_text = 'book.add_to_fav';
    if(addr.is_favorite)
      fav_text = 'book.remove_from_fav';

   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i(fav_text)+'</b>' },
       { text: T.i('g.remove') },
       ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // Set as favorite
      if(index==0)
      {
        var fav = addr.is_favorite ? 0 : 1;
        console.log('mandamos: ' + addr.id + '->' + fav);
        AddressBook.setFavorite(addr.id, fav).then(function() {
          $scope.loadAddys();
        });
      }
      // Remove from address book
      else if(index==1)
      {
          // load current label
         var confirmPopup = $ionicPopup.confirm({
           title    : T.i('book.remove_from_ab'),
           template : T.i('book.remove_sure', {'name':addr.name}),
         }).then(function(res) {
          if(!res)
            return;
            AddressBook.remove(addr.id).then(function() {
              $scope.loadAddys();
            });
         });
      }
      return true;
     }
   });
  }

})

.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams){

  $scope.getWithdraws = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='w')
        ops.push(op);
    })
    return ops;
  }
  $scope.getDeposits = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        ops.push(op);
    })
    return ops;
  }
  $scope.getFee = function(){
    var fee = 0;
    var precision = -1;
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        fee=fee-op.amount;
      else
        fee=fee+op.amount;
      if(precision==-1)
        precision = $scope.data.assets[op.asset_id].precision;
        //precision = $rootScope.asset.precision;
    })
    return fee/precision;
  }
  $scope.goBack = function() {
    $ionicNavBarDelegate.back();
  };
})

.controller('HomeCtrl', function(T, Scanner, AddressBook, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, BitShares, $q) {
  
  $scope.scanQR = function() {
           
    Scanner.scan()
    .then(function(result) {
      if( !result.cancelled ) {

        if(result.privkey !== undefined)
        {
          $state.go('app.import_priv', {private_key:result.privkey});
          return;
        }
        
        var promises = [];
        //Pubkey scanned
        if(result.pubkey !== undefined) {
          //result.address = bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(result.pubkey));
          var p = BitShares.btsPubToAddress(result.pubkey)
          .then(function(addy){
            result.address = addy;
          })
          promises.push(p);
        }
        $q.all(promises).then(function() {
          $state.go('app.send', {address:result.address, amount:result.amount, asset_id:result.asset_id});
        })
      }
    }, function(error) {
      
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }

  $rootScope.$on('refresh-done', function(event, data) {
    $scope.$broadcast('scroll.refreshComplete');
  });

  $rootScope.$on('address-book-changed', function(event, data) {
    var txs = [];
    angular.copy($rootScope.transactions, txs);
    for(var i=0; i<txs.length; i++) {
       
       if(txs[i]['addr_name'] != 'Me')
       {
         if( txs[i]['address'] in $rootScope.my_book )
          txs[i]['addr_name'] = $rootScope.my_book[txs[i]['address']].name;
         else
          txs[i]['addr_name'] = txs[i]['address'];
       }
       console.log('ADDRNAME => ' + txs[i]['addr_name']);
    }
    
    $rootScope.transactions = txs;
  });

  $scope.showActionSheet = function(tx) {
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('home.add_to_book')+'</b>' },
       { text: T.i('home.view_details') },
     ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
     },
     buttonClicked: function(index) {
       // Add to addressbook
       if(index==0) {
         // load current label
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
             $rootScope.loadAddressBook();
             window.plugins.toast.show( T.i('home.save_successfull'), 'short', 'bottom');
           });

         });
      }
      // View transaction details
      else if(index==1) {
        $state.go('app.transaction_details', {tx_id:tx['tx_id']});
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
    $rootScope.refreshBalance(true);
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
