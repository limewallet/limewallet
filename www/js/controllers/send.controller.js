bitwallet_controllers.controller('SendCtrl', function($scope, $q, ENVIRONMENT, T, BitShares, Asset, AddressBook, Scanner, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams) {
  
  $scope.data = {address_book:[]};
  //$scope.transaction = {message:'send.generating_transaction', amount:0, address:'', asset_id:$scope.asset.id};
  
  // Did user scan a payment request? If so, we receive asset_id
  // if (!angular.isUndefined($stateParams.asset_id))
    // $scope.data.asset = $rootScope.assets[$stateParams.asset_id];
  
  var amount = 0;
  if (!angular.isUndefined($stateParams.amount))
  {
    amount = $stateParams.amount;

    //document.querySelector( '.amout_so_send' ).value = amount;
  } 
  
  var address = '';
  if (!angular.isUndefined($stateParams.address))
  address = $stateParams.address;

  $scope.transaction = {message:'send.generating_transaction', amount:amount, address:address};
  sendForm.transactionAmount.value = $scope.transaction.amount;
  sendForm.transactionAddress.value = $scope.transaction.address;
  
  $scope.showAddressBook = function(){
    $scope.address_book_modal.show();
  }
  
  $scope.loadAddressBook = function() {
    AddressBook.all().then(function(addr_book) {
        $scope.data.address_book = addr_book;
    });
  };

  $scope.loadAddressBook();
  
  $scope.selectContact = function(contact){
    $scope.address_book_modal.hide();
    sendForm.transactionAddress.value = contact.address;
    $scope.transaction.address = contact.address;
    console.log($scope.transaction.address);
  }
  
  $scope.scanQR = function() {
    Scanner.scan()
    .then(function(result) {
      if( !result.cancelled ) {
        //Pubkey scanned
        if(result.pubkey !== undefined) {
          //bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(result.pubkey))
          BitShares.btsPubToAddress(result.pubkey).then(function(addy){
            $scope.transaction.address = addy;
            console.log($scope.transaction.address);
          })
          return;
        }
        
        $scope.transaction.address = result.address;
        if(result.amount !== undefined)
        {
          //HACK: 
          $scope.transaction.amount = result.amount;
          sendForm.transactionAmount.value = result.amount;
        }
        
        if(result.asset_id !== undefined && result.asset_id != $scope.asset.symbol)
        {
          window.plugins.toast.show(T.i('err.invalid_asset'), 'long', 'bottom');
          return;
        }
      }
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }
  
  $scope.goBack = function() {
    console.log('trying to go back SendCtrl');
    $ionicNavBarDelegate.back();
  };
  
  $scope.validateSend = function(transaction) {
    //$scope.transaction.amount = sendForm.transactionAmount.value;
    console.log(' Amount: ['+$scope.transaction.amount+'] Precision: ['+$scope.asset.precision+']');
    var amount = parseInt(parseFloat($scope.transaction.amount)*$scope.asset.precision);
    console.log($scope.transaction.amount + ' => ' + amount);
    if ( isNaN(amount) || amount <= 0 ) {
       $ionicPopup.alert({
         title    : T.i('err.invalid_amount') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.enter_valid_amount'),
         okType   : 'button-assertive', 
       });
       return;
    }
    
    var err_msg;
    var owner_key;
    var extra_data;
    var prom;
    
    BitShares.btsIsValidAddress(sendForm.transactionAddress.value)
    .then(function(is_valid){
      return is_valid;
    },
    function(error){
      // Check if registered name to fill owner_key and extra_data (robohash).
      $ionicLoading.show({
        template: T.i('send.searching_account')
      });

      var deferred = $q.defer();

      var url;
      if(ENVIRONMENT.test) {
        url = 'https://bsw-test.latincoin.com/api/v1/account/' + sendForm.transactionAddress.value;
      } else {
        url = 'https://bsw.latincoin.com/api/v1/account/' + sendForm.transactionAddress.value;
      }

      prom = $http.get(url, {timeout:10000})
      .success(function(r) {
        if(r.error !== undefined) {
          err_msg = T.i('err.invalid_address_account');
          return;
        }
        owner_key  = r.owner_key;
        extra_data = '</br><img src="'+ 'http://robohash.org/'+r.name+'?size=150x150' + '"></img>';
      })
      .error(function(data, status, headers, config) {
        err_msg = T.i('err.server_error');
      })
      .finally(function() {
        $ionicLoading.hide();

        if( err_msg !== undefined ) {
          var alertPopup = $ionicPopup.alert({
           title    : T.i('send.send_payment') + ' <i class="fa fa-warning float_right"></i>',
           template : err_msg,
           okType   : 'button-assertive'
          })
          .then(function() {
            $ionicLoading.hide();
          });
          return deferred.reject();
        }
        else {
          return deferred.resolve(true);
        }
      });
      
      // $ionicPopup.alert({
        // title    : T.i('err.invalid_address') + ' <i class="fa fa-warning float_right"></i>',
        // template : T.i('err.enter_valid_address'),
        // okType   : 'button-assertive',
      // });
      console.log('no habia nada');

      return deferred.promise;


    })
    .then(function(is_valid){
      

      var symbol =  '<i class="'+$scope.asset.symbol_ui_class+'">'+$scope.asset.symbol_ui_text;
      var confirmPopup = $ionicPopup.confirm({
        title    : T.i('send.payment_confirm'),
        template : T.i('send.are_you_sure',{symbol:symbol,amount:$scope.transaction.amount,address:sendForm.transactionAddress.value, extra_data:extra_data})
        //template : T.i('send.are_you_sure',{symbol:symbol,amount:$scope.transaction.amount,address:sendForm.transactionAddress.value})
      });

      confirmPopup.then(function(res) {
        if(res) {
          $scope.sending_modal.show();

          var from  = [];
          var addys = Object.keys($rootScope.my_addresses);
          for(var i=0; i<addys.length; i++) {
            from.push({"address":addys[i]});
          }
          
          var prom_addy;
          dst_addr = sendForm.transactionAddress.value;
          if(owner_key !== undefined) {
            var p = BitShares.btsPubToAddress(owner_key)
                    .then(
                      function(addy){
                        dst_addr = addy;
                      }
                      ,function(error){
                        
                      })
            prom_addy = p;
            //dst_addr = bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(owner_key));
          }
          else
          {
            var deferred = $q.defer();
            deferred.resolve();
            prom_addy = deferred.promise;
          }
          
          prom_addy.then(function() {
          
            var tx_req = {
              "asset" : $scope.asset.id, // ? sendForm.transactionAssetId.value ?
              "fee"   : 250,
              "from"  : from,
              "to"    : [{
                  "address" : dst_addr, //sendForm.transactionAddress.value,
                  "amount"  : amount
              }]
            }

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
                  $scope.sending_modal.hide();
                });
                return;
              }

              $scope.transaction.message = 'send.signing_transaction';
              
              console.log(r.tx);
              console.log(r.to_sign);
              console.log(r.required_signatures);

              r.tx.signatures = [];

              //HACK: expose Buffer
              // Buffer = bitcoin.ECKey.curve.n.toBuffer().constructor;
              // var to_sign = new Buffer(r.to_sign, 'hex')
               
              var prom = [];
              angular.forEach(r.required_signatures, function(req_addy) {
                var p = Address.by_address(req_addy)
                  .then(function(addy) {
                    return BitShares.compactSignatureForHash(r.to_sign, addy.privkey)
                      .then(function(compact){
                        console.log(addy.address);
                        r.tx.signatures.push(compact);
                        console.log(compact);
                      })
                      
                    // console.log(addy.address);
                    // var priv = bitcoin.ECKey.fromWIF(addy.privkey);
                    // var signature = bitcoin.ecdsa.sign(bitcoin.ECKey.curve, to_sign, priv.d);
                    // var i = bitcoin.ecdsa.calcPubKeyRecoveryParam(bitcoin.ECKey.curve, priv.d.constructor.fromBuffer(to_sign), signature, priv.pub.Q);
                    // var compact = signature.toCompact(i, priv.pub.compressed).toString('hex');
                    // console.log(compact);
                    // r.tx.signatures.push(compact);
                  });
                prom.push(p);
              });

              $q.all(prom).then(function() {
                console.log('firmado .. mandando'); 
                $scope.transaction.message = 'send.sending_transaction';

                if(ENVIRONMENT.test) {
                  url = 'https://bsw-test.latincoin.com/api/v1/txs/send';
                } else {
                  url = 'https://bsw.latincoin.com/api/v1/txs/send';
                }
                $http.post(url, r.tx)
                .success(function(r) {
                  $scope.sending_modal.hide();
                  $location.path('/home');
                  window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom')
                  $rootScope.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/1e4, state:'P', date: new Date().getTime()});
                  
                })
                .error(function(data, status, headers, config) {
                   console.log('error...: '+status);
                    var alertPopup = $ionicPopup.alert({
                       title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                       template: T.i('err.server_error'),
                       okType: 'button-assertive', 
                    })
                    .then(function() {
                      $scope.sending_modal.hide();
                    });
                })
                .finally(function() {
                   console.log('finally...');
                });

                 
              });

            })
            .error(function(data, status, headers, config) {
               console.log('error...: '+status);
                 var alertPopup = $ionicPopup.alert({
                    title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                    template: T.i('err.server_error'),
                    okType: 'button-assertive', 
                 })
                .then(function() {
                  $scope.sending_modal.hide();
                });
            })
            .finally(function() {
               console.log('finally...');
            });

          });
        } 
          else {
           console.log('You are not sure');
        }
      });
    })
    
  };
  
  // Load Address book modal
  $ionicModal.fromTemplateUrl('address-book-modal.html', function($ionicModal) {
      $scope.address_book_modal = $ionicModal;
  }, {
      // Use our scope for the scope of the modal to keep it simple
      scope: $scope,
      // The animation we want to use for the modal entrance
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
  });
  
  // Load sending process modal view.
  $ionicModal.fromTemplateUrl('sending-modal.html', function($ionicModal) {
      $scope.sending_modal = $ionicModal;
  }, {
      // Use our scope for the scope of the modal to keep it simple
      scope: $scope,
      // The animation we want to use for the modal entrance
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
  });  
})
