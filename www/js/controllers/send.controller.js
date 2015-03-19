bitwallet_controllers.controller('SendCtrl', function($scope, $q, ENVIRONMENT, T, BitShares, AddressBook, Scanner, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, Wallet) {
  
  $scope.data = {address_book:[], is_btc:false};
  
  $scope.data_btc = {
        bitcoin_address:    '', //BweMQsJqRdmncwagPiYtANrNbApcRvEV77 'msmmBfcvrdG2yZiUQQ21phPkbw966f8nbb',
        
        amount_usd:         undefined,
        amount_btc:         undefined,
        quoting_usd:        false,
        quoting_usd_error:  undefined,
        
        timer:              {options:{}, remaining:undefined, percent:undefined, start:0, stop:0, expired:0},
        quote_expired:      false,
        
        quote:              undefined,
        signature:          undefined,
        tx:                 undefined,
        
        quote_ttl:          30,
        
        quote_btc:          'BTC_'+$scope.wallet.asset.x_symbol
  };
  
                       

  $scope.default_data_btc = {};
  angular.copy($scope.data_btc, $scope.default_data_btc);
  
  // Check if bts or btc payment request
  var amount = 0;
  if (!angular.isUndefined($stateParams.amount))
  {
    amount = $stateParams.amount;
  } 
  
  var address = '';
  if (!angular.isUndefined($stateParams.address))
    address = $stateParams.address;

  var is_btc = false;
  if (!angular.isUndefined($stateParams.is_btc))
    is_btc = $stateParams.is_btc;

  // Hack! Let's think a better way to initialize controller!!
  if(is_btc==='true'){
    $scope.data.is_btc              = true;
    $scope.data_btc.bitcoin_address = address;
    $scope.data_btc.amount_btc      = amount;
    $timeout(function () {
      $scope.isBTC();
    }, 250);
    $scope.transaction                = {message:'send.generating_transaction'};
  }
  else{
    $scope.data.is_btc                = false;
    $scope.transaction                = {message:'send.generating_transaction', amount:amount, address:address};
    sendForm.transactionAmount.value  = $scope.transaction.amount;
    sendForm.transactionAddress.value = $scope.transaction.address;
  }

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
        
        if(result.asset_id !== undefined && result.asset_id != $scope.wallet.asset.symbol && !result.is_btc)
        {
          window.plugins.toast.show(T.i('err.invalid_asset'), 'long', 'bottom');
          return;
        }

        if(result.is_btc)
        {

        }
      }
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }
  
  $scope.doSend = function(transaction) {
    if($scope.data.is_btc==true)
    {  
      $scope.doSendBTC();
      console.log('doSendBTC()??');
    }
    else
    {  
      $scope.validateSend();
    }
  }
  
  $scope.validateSend = function(transaction) {
    
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

      prom = BitShares.getAccount(sendForm.transactionAddress.value).then(function(r) {
        if(r.error !== undefined) {
          err_msg = T.i('err.invalid_address_account');
          return;
        }
        owner_key  = r.owner_key;
        extra_data = '</br><div class="full_width"><img class="i_centered" src="'+ 'http://robohash.org/'+r.name+'?size=150x150' + '" /></div>';
        if(r.public_data && r.public_data.gravatarId)
          extra_data = '</br><div class="full_width"><img class="i_centered" src="http://www.gravatar.com/avatar/'+r.public_data.gravatarId+'?s=150" /></div>';
      }, function(error){
        err_msg = T.i('err.server_error');
      });
      
      $q.all([prom]).then(function() {
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
      
      return deferred.promise;
    })
    .then(function(is_valid){
      

      var symbol =  '<i class="'+$scope.wallet.asset.symbol_ui_class+'">'+$scope.wallet.asset.symbol_ui_text+'</i>';
      var confirmPopup = $ionicPopup.confirm({
        title    : T.i('send.payment_confirm'),
        template : T.i('send.are_you_sure',{symbol:symbol,amount:$scope.transaction.amount,address:sendForm.transactionAddress.value, extra_data:extra_data})
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
          }
          else
          {
            var deferred = $q.defer();
            deferred.resolve();
            prom_addy = deferred.promise;
          }
          
          prom_addy.then(function() {
            BitShares.prepareSendAsset($scope.wallet.asset.symbol, from, dst_addr, amount).then(function(r){
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
                $scope.transaction.message = 'send.sending_transaction';

                BitShares.sendAsset(r.tx, r.secret).then(function(r) {
                  $scope.sending_modal.hide();
                  $scope.goHome();
                  window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom')
                  $scope.wallet.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/$scope.wallet.assets[$scope.wallet.asset.id].precision, state:'P', date: new Date().getTime()});
                  
                }, function(){
                    var alertPopup = $ionicPopup.alert({
                       title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                       template: T.i('err.server_error'),
                       okType: 'button-assertive', 
                    })
                    .then(function() {
                      $scope.sending_modal.hide();
                    });
                });
                 
              });

            }, function(error){
               var alertPopup = $ionicPopup.alert({
                    title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                    template: T.i('err.server_error'),
                    okType: 'button-assertive', 
                 })
                .then(function() {
                  $scope.sending_modal.hide();
                });
            });

          });
        } 
          else {
           console.log('You are not sure');
        }
      });
    })
    
  };
  
  $scope.$on( '$ionicView.beforeLeave', function(){
    // Destroy timers
    console.log('SendCtrl.ionicView.beforeLeave killing timers.');
    $scope.stopTimer(false);
  });

  /*********************************************************/
  /* BITCOINS payment handlers *****************************/
  var quote_timeout = undefined;
  $scope.doQuoteAndStartTimer = function(){
    
    quote_timeout = $timeout(function () {
      $scope.data_btc.quoting_usd = true;
      $scope.data_btc.amount_usd = undefined;
      // llamo a quotear
      BitShares.getBuyQuote($scope.data_btc.quote_btc, $scope.data_btc.amount_btc).then(function(res){
        $scope.clearQuoteError();
        $scope.data_btc.amount_usd  = Number(res.quote.cl_pay);
        $scope.data_btc.quote       = res.quote;
        $scope.data_btc.signature   = res.signature;
        $timeout(function () {
          $scope.data_btc.quoting_usd = false;
          $scope.startTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        $scope.stopTimer(false);
        $scope.data_btc.quoting_usd       = false;
        $scope.setMessageErr(error);
        $scope.data_btc.quote             = undefined;
        $scope.data_btc.signature         = undefined;
        //console.log(error);
      });
    }, 750);
    
  }
  
  $scope.setMessageErr = function(error){
    var message = error;
    var errors = ['max_op', 'min_op'];
    if(errors.indexOf(error)>=0)
      message = T.i('err.'+error, {amount:(error=='max_op'?'50.0 USD':'0.50 USD')});
    $scope.data_btc.quoting_usd_error = message;
  };
  
  $scope.clearQuoteError = function(){
    $scope.data_btc.quoting_usd_error = undefined;
  };

  $scope.nanobar = undefined;
  var ttl = 60;
  var counter_timeout = ttl;
  
  $scope.onTimeout = function() {
    counter_timeout = counter_timeout - 1;
    if(counter_timeout==0)
    {
      $scope.stopTimer(true);
      return;
    }
    $scope.nanobar.go((ttl-counter_timeout)*100/ttl);
    quote_timeout = $timeout($scope.onTimeout, 1000);
  }
  
  $scope.startTimer = function() {
    counter_timeout = ttl;
    quote_timeout = $timeout($scope.onTimeout, 1000);
  };
  
  $scope.stopTimer = function(requote) {
    if(quote_timeout!==undefined)
      $timeout.cancel(quote_timeout);
    counter_timeout = ttl;
    if(requote!==undefined && requote==true)
      $scope.doQuoteAndStartTimer();
  }
  
  $scope.$on( '$ionicView.enter', function(){
    //$scope.isBTC();
  });
  
  $scope.isBTC = function(){
    if (!$scope.data.is_btc)
      return;
    // 1.- Quote
    // 2.- Show quote rate
    // 3.- Init timer
    // 4.- Ontimer Tic adjust $scope.nanobar.go( XX );
    // 5.- On expired, goto: 1
    
    if($scope.nanobar===undefined)
    {
      var options = {
        //bg: '#acf',
        target: document.getElementById('quote_ttl'), //bitcoin_payment_info
        id: 'mynano'
      };
      $scope.nanobar = new Nanobar( options );
    }
    
    $scope.doQuoteAndStartTimer();
    
  }
  
  $scope.doSendBTC = function(){
    
    if(!$scope.data_btc.signature || !$scope.data_btc.quote)
    {
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      return;
    }
    
    // if($scope.remainingTime()<=0)
    // {
      // $scope.showAlert('err.quote_expired', 'err.quote_expired_retry');
      // return;
    // }
    if(!$scope.data_btc.bitcoin_address || $scope.data_btc.bitcoin_address.length<1)
    {
      $scope.showAlert('err.btc_addr_error', 'err.btc_addr_error_input');
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data_btc.quote, $scope.data_btc.signature, token, $scope.data_btc.bitcoin_address, BitShares.X_BTC_PAY).then(function(result){
        var xtx = result.tx;
        if(!result.tx || !result.tx.cl_pay_addr)
        {
          $scope.showAlert('err.occurred', 'err.please_retry');
          return;
        }
        
        $scope.sending_modal.show();
        var from  = [];
        var addys = Object.keys($scope.wallet.addresses);
          for(var i=0; i<addys.length; i++) {
            from.push({"address":addys[i]});
        }
        
        var pay_amount = parseInt(parseFloat(result.tx.cl_pay)*$scope.wallet.asset.precision);
        BitShares.prepareSendAsset($scope.wallet.asset.symbol, from, result.tx.cl_pay_addr, pay_amount).then(function(r){
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
            $scope.transaction.message = 'send.sending_transaction';

            BitShares.sendAsset(r.tx, r.secret).then(function(res) {
              $scope.sending_modal.hide();
              
              // Wallet.buildTxList(r, $scope.wallet.data.asset.id).then(function(res){
                // console.log('Insertando xtx con oper_id = ' + res.insertId.toString());
                // xtx['operation_id'] = res.insertId;
                // Wallet.onNewXTx(xtx);
              // });
              xtx['operation_tx_id'] = res.tx_id;
              Wallet.onNewXTx(xtx);
              $scope.goHome();
              //window.plugins.toast.show( T.i('withdraw.succesful'), 'short', 'bottom');
              window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom');
              
              
              
              
            }, function(){
                var alertPopup = $ionicPopup.alert({
                   title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                   template: T.i('err.server_error'),
                   okType: 'button-assertive', 
                })
                .then(function() {
                  $scope.sending_modal.hide();
                });
            });
             
          });

        }, function(error){
           var alertPopup = $ionicPopup.alert({
                title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                template: T.i('err.server_error'),
                okType: 'button-assertive', 
             })
            .then(function() {
              $scope.sending_modal.hide();
            });
        });
 
      }, function(error){
        console.log(error);
        if(error=='auth_failed')
          Setting.remove(Setting.BSW_TOKEN);
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        return;
      });
    }, function(error){
      console.log(error);
      if(error=='auth_failed')
        Setting.remove(Setting.BSW_TOKEN);
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      return;
    });
    
  }
  
  
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
