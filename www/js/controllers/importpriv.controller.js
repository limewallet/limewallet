bitwallet_controllers
.controller('ImportPrivCtrl', function($scope, ENVIRONMENT, T, $q, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, BitShares) {
  
  $scope.imported_pk  = {amount:{}, priv_key:'NOT_AVAILABLE', address:'NOT_AVAILABLE'};
  $scope.sweeping     = {message:'send.generating_transaction'};
  $scope.imported_pk  = [];

  $ionicLoading.show({
    template      : '<ion-spinner icon="android"></ion-spinner> ' + T.i('import_priv.loading_balance'),
    animation    : 'fade-in',
    showBackdrop : true,
    maxWidth     : 200
    //showDelay    : 0
  }); 

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }

  $scope.getImportedKeyBalance2 = function(addr){

  }
  
  $scope.getImportedKeyBalance = function(addr){
    
    var url;
    if(ENVIRONMENT.test) {
      url = 'https://bsw-test.latincoin.com/api/v2/addrs/' + addr + '/balance';
    } else {
      url = 'https://bsw.latincoin.com/api/v2/addrs/' + addr + '/balance';
    }


    $http.get(url)
    .success(function(r) {
      var total = 0;
      var other_symbols = [];
      if(r.error === undefined)
      { 
        r.balances.forEach(function(b){
          if(b.asset_id == $scope.wallet.asset.id) {
            total += b.amount;
          } else {
            //TODO: warining!!
            if(b.amount > 0) {
              other_symbols.push($scope.wallet.assets[b.asset_id].symbol);
            }
          }
        });
      }
      else
      {
        $scope.goHome();
        window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        return;
      }

      if(total == 0 && other_symbols.length > 0) {

       $ionicPopup.alert({
         title    : T.i('import_priv.paper_wallet'),
         template : T.i('import_priv.switch_currency', {'symbols':other_symbols.join(',')}),
       }).then(function(res) {
        if(res) {
          $scope.goHome();
        }
       });

       return;
      }

      $scope.imported_pk.amount = total/$scope.wallet.asset.precision;
    })
    .error(function(data, status, headers, config) {
      $timeout(function () {
          $scope.goHome();
          window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        }, 500);
    })
    .finally(function() {
      $rootScope.$emit('refresh-done');
      $scope.hideLoading();
    });
  }
  
  $scope.sweepBalance = function(){
    
    var fee=250;
    var amount = parseInt(parseFloat($scope.imported_pk.amount)*1e4);
    console.log($scope.imported_pk.amount + ' => ' + amount);
    if ( isNaN(amount) || amount <= 0 ) {
       $ionicPopup.alert({
         title    : T.i('err.empty_paper_wallet'),
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
        url = 'https://bsw-test.latincoin.com/api/v2/txs/new';
      } else {
        url = 'https://bsw.latincoin.com/api/v2/txs/new';
      }

      $http.post(url, tx_req)
      .success(function(r) {
        if(r.error !== undefined) {
          console.log('There where errors ' + r.error);
          var alertPopup = $ionicPopup.alert({
             title: T.i('err.unable_to_create_tx'),
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
            url = 'https://bsw-test.latincoin.com/api/v2/txs/send';
          } else {
            url = 'https://bsw.latincoin.com/api/v2/txs/send';
          }

          $http.post(url, r.tx)
          .success(function(r) {
            $scope.sweeping_modal.hide();
            $scope.goHome();
            window.plugins.toast.show( T.i('import_priv.transaction_sent'), 'long', 'bottom')
            $rootScope.transactions.unshift({sign:1, address:$scope.imported_pk.address, addr_name:$scope.imported_pk.address, amount:amount/$scope.wallet.asset.precision, state:'P', date: new Date().getTime()});
          })
          .error(function(data, status, headers, config) {
             console.log('error...: '+status);
              var alertPopup = $ionicPopup.alert({
                 title: T.i('err.unable_to_send_tx'),
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
              title: T.i('err.unable_to_send_tx'),
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
});
