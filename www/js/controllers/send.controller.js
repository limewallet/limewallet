bitwallet_controllers.controller('SendCtrl', function($scope, $q, ENVIRONMENT, T, BitShares, AddressBook, Scanner, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams) {
  
  $scope.data = {address_book:[], is_btc:true};
  
  var amount = 0;
  if (!angular.isUndefined($stateParams.amount))
  {
    amount = $stateParams.amount;
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
        
        if(result.asset_id !== undefined && result.asset_id != $scope.wallet.asset.symbol)
        {
          window.plugins.toast.show(T.i('err.invalid_asset'), 'long', 'bottom');
          return;
        }
      }
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }
  
  $scope.nanobar = undefined;
  $scope.isBTC = function(){
    // 1.- Quotear
    // 2.- Mostrar quote amounts
    // 3.- Init timer
    // 4.- En cada tic ajustar -> $scope.nanobar.go( 30 ); // size bar 30%
    // 5.- On expired, ir a 1
    
    var options = {
      bg: '#acf',

      // leave target blank for global nanobar
      target: document.getElementById('bitcoin_payment_info'),

      // id for new nanobar
      id: 'mynano'
    };

    $scope.nanobar = new Nanobar( options );

    $scope.startTimer();

  }
  
  var ttl = 60;
  var counter_timeout = ttl;
  $scope.onTimeout = function() {
    counter_timeout = counter_timeout - 1;
    if(counter_timeout==0)
    {
      $scope.stopTimer();
      return;
    }
    $scope.nanobar.go((ttl-counter_timeout)*100/ttl);
    quote_timeout = $timeout($scope.onTimeout, 1000);
  }
  $scope.startTimer = function() {
    counter_timeout = ttl;
    quote_timeout = $timeout($scope.onTimeout, 1000);
  };
  $scope.stopTimer = function() {
    $timeout.cancel(counter_timeout);
    counter_timeout = ttl;
    $scope.startTimer();
  }
  $scope.$on( '$ionicView.enter', function(){
    $scope.isBTC();
  });
  
  
  $scope.validateSend = function(transaction) {
    //$scope.transaction.amount = sendForm.transactionAmount.value;
    console.log(' Amount: ['+$scope.transaction.amount+'] Precision: ['+$scope.wallet.asset.precision+']');
    var amount = parseInt(parseFloat($scope.transaction.amount)*$scope.wallet.asset.precision);
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
        extra_data = '</br><div class="full_width"><img class="i_centered" src="'+ 'http://robohash.org/'+r.name+'?size=150x150' + '" /></div>';
        if(r.public_data && r.public_data.gravatarId)
          extra_data = '</br><div class="full_width"><img class="i_centered" src="http://www.gravatar.com/avatar/'+r.public_data.gravatarId+'?s=150" /></div>';
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
      //console.log('no habia nada');

      return deferred.promise;


    })
    .then(function(is_valid){
      

      var symbol =  '<i class="'+$scope.wallet.asset.symbol_ui_class+'">'+$scope.wallet.asset.symbol_ui_text+'</i>';
      var confirmPopup = $ionicPopup.confirm({
        title    : T.i('send.payment_confirm'),
        template : T.i('send.are_you_sure',{symbol:symbol,amount:$scope.transaction.amount,address:sendForm.transactionAddress.value, extra_data:extra_data})
        //template : T.i('send.are_you_sure',{symbol:symbol,amount:$scope.transaction.amount,address:sendForm.transactionAddress.value})
      });

      confirmPopup.then(function(res) {
        if(res) {
          $scope.sending_modal.show();

          var from  = [];
          var addys = Object.keys($scope.wallet.addresses);
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
              "asset" : $scope.wallet.asset.id, // ? sendForm.transactionAssetId.value ?
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
                $http.post(url, {tx:r.tx, secret:r.secret})
                .success(function(r) {
                  $scope.sending_modal.hide();
                  $location.path('/home');
                  window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom')
                  $scope.wallet.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/$scope.wallet.assets[$scope.wallet.asset.id].precision, state:'P', date: new Date().getTime()});
                  
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
});
