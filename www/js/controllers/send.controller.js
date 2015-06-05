bitwallet_controllers.controller('SendCtrl', function($scope, $q, ENVIRONMENT, T, BitShares, Scanner, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, Wallet, Contact) {

  $scope.isSelectable = function (query) {

    var deferred = $q.defer();

    BitShares.isValidPubkey(query).then(function(res) {
      deferred.resolve(true);
    }, function(err) {
      BitShares.btsIsValidAddress(query).then(function(res) {
        deferred.resolve(false);
      }, function(err) {
        deferred.reject();
      });
    });

    return deferred.promise;
  }

  $scope.localSearch = function (query) {
    return Contact.startsWith(query);
  }

  $scope.globalSearch = function (query) {
    return BitShares.searchAccount(query);
  }

  $scope.transaction = {
    amount      : 0,
    destination : {},
    memo        : ''
  }

  if (!angular.isUndefined($stateParams.amount))
    $scope.transaction.amount = $stateParams.amount;
  
  if (!angular.isUndefined($stateParams.destination))
    $scope.transaction.destination = $stateParams.destination;

  if (!angular.isUndefined($stateParams.memo))
    $scope.transaction.memo = $stateParams.memo;

  $scope.clearDestination = function(){
    $scope.transaction.destination = {};
  }
  
  $scope.scanQR = function() {
    Scanner.scan().then(function(result) {
      if( result.cancelled ) return;

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
    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }
  
  $scope.doSend = function(tx) {

    //$scope.formInProgress();
    if ( $scope.validateSend(tx) == false ) {
      //$scope.formDone();
      return;
    }

    $scope.trySend(tx).then(function(res) {
      
      //TODO: Store in pending tx
      window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom')
      //HACK:

      if (Wallet.data.ord_transactions['0_today'] === undefined) {
        Wallet.data.ord_transactions['0_today'] = [];
      }
      
      Wallet.data.ord_transactions['0_today'].unshift({
        ui_type   : 'sent',
        address   : tx.destination.address_or_pubkey,
        name      : tx.destination.name,
        message   : tx.memo,
        amount    : tx.amount,
        state     : 'P',
        date      : new Date().getTime()
      });


      $scope.goToSuccess({  txid        : undefined
                            , xtxid      : undefined
                            , address   : tx.destination.address_or_pubkey
                            , name      : tx.destination.name
                            , message   : tx.memo
                            , amount    : tx.amount
                            , type      : 'send' });
      //$scope.goHome();

    }, function(err) {
       //$scope.formDone();
    });
  }


  $scope.computeMemo = function(tx) {
    var deferred = $q.defer();

    if ( !tx.destination.is_pubkey ) {
      console.log('No es para un pubkey, no hacemos memor');
      deferred.resolve();
      return deferred.promise;
    }

    BitShares.randomInteger().then(function(rand_int) {

      rand_int = (rand_int>>>0) & 0x7FFFFFFF;

      BitShares.computeMemo(
        Wallet.data.account.pubkey,
        tx.memo.trim(),
        tx.destination.address_or_pubkey,
        Wallet.data.mpk.plain_value,
        Wallet.data.account.plain_account_mpk,
        Wallet.data.account.plain_memo_mpk,
        rand_int
      ).then(function(res) {
        console.log('OK -> ' + JSON.stringify(res));

        BitShares.skip32(rand_int, Wallet.data.account.plain_skip32_key, true).then(function(skip32_index) {

          skip32_index = skip32_index>>>0;

          console.log('%%%%%%%%%%%%%%%%%%%% => RANDINT ' + rand_int);
          console.log('%%%%%%%%%%%%%%%%%%%% => SKIP32 ' + skip32_index);
          console.log('%%%%%%%%%%%%%%%%%%%% => KEY ' + Wallet.data.account.plain_skip32_key);

          res.skip32_index = skip32_index;
          deferred.resolve(res);
        }, function(err) {
          console.log('ERR SKIP32->' + JSON.stringify(err));
          deferred.reject();
        }); 

      }, function(err) {
        console.log('ERR computeMemo->' + JSON.stringify(err));
        deferred.reject();
      });


    }, function(err) {
      console.log('ERR ->' + JSON.stringify(err));
      deferred.reject();
    });

    return deferred.promise;
  }

  $scope.promptSend = function(asset, tx) {

    var symbol =  asset.symbol_ui_text;
    return $ionicPopup.confirm({
      title    : T.i('send.payment_confirm'),
      template : T.i('send.are_you_sure', { 
        symbol     : symbol,
        amount     : tx.amount,
        address    : tx.destination.name
      })
    });

  }

  $scope.signAll = function(to_sign, addys) {
    var proms = [];
    
    addys.forEach(function(addy) {
      //TODO: change privkey when sending from multiples accounts
      proms.push(BitShares.compactSignatureForHash(to_sign, Wallet.data.account.plain_privkey)) 
    });
    return $q.all(proms);
  }


  $scope.validateSend = function(tx) {

    var error = '';

    // Validate amount > 0
    var amount = parseInt(parseFloat(tx.amount)*Wallet.data.asset.precision);
    if ( isNaN(amount) || amount <= 0 ) {
      error = 'invalid_amount';
    // Validate enough funds
    } else if ( Wallet.canSend(amount) < 0 ) {
      error = 'no_funds';
    // Validate destination
    } else if ( tx.destination.is_pubkey === undefined ) {
      error = 'no_destination';
    } 

    if (error) {
      $ionicPopup.alert({
        title    : 'Error',
        template : error,
        okType   : 'button-assertive', 
      });

      return false;
    }

    return true;
  }

  $scope.trySend = function(tx) {
    var deferred = $q.defer();

    tx.memo = tx.memo || '';

    $scope.computeMemo(tx).then(function(memo) {

      var slate = undefined;
      if ( memo !== undefined ) slate = memo.skip32_index;

      BitShares.new_(
        Wallet.data.account.address, 
        tx.destination.address_or_pubkey, 
        tx.amount*Wallet.data.asset.precision, 
        Wallet.data.asset.name, 
        memo, slate).then(function(new_tx) {

        $scope.promptSend(Wallet.data.asset, tx).then(function(accept) {

          if (!accept) {
            deferred.reject();
            return; 
          }

          $scope.signAll(new_tx.to_sign, new_tx.required_signatures).then( function(signatures) {
            new_tx.tx.signatures = signatures;

            BitShares.sendAsset(new_tx.tx, new_tx.secret).then(function(res) {
              deferred.resolve(res);
            }, function(err) {
              console.log(JSON.stringify(err));
              deferred.reject(err);
            });

          }, function(err) {
            console.log(JSON.stringify(err));
            deferred.reject(err);
          });

        });

      }, function(err) {
        console.log(JSON.stringify(err));
        deferred.reject(err);
      });

    }, function(err) {
      console.log(JSON.stringify(err));
      deferred.reject(err);
    });

    return deferred.promise;
  }
  
  $scope.$on( '$ionicView.beforeLeave', function(){
    // Destroy timers
    //console.log('SendCtrl.ionicView.beforeLeave killing timers.');
    $scope.stopTimer(false);
    //$scope.formDone();
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
  
  // $scope.$on( '$ionicView.enter', function(){
  //   //$scope.isBTC();
  // });
  
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
    
    $scope.formInProgress();
    if(!$scope.data_btc.signature || !$scope.data_btc.quote)
    {
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      //$scope.formDone();
      return;
    }
    
    if(!$scope.data_btc.bitcoin_address || $scope.data_btc.bitcoin_address.length<1)
    {
      $scope.showAlert('err.btc_addr_error', 'err.btc_addr_error_input');
      //$scope.formDone();
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data_btc.quote, $scope.data_btc.signature, token, $scope.data_btc.bitcoin_address, BitShares.X_BTC_PAY).then(function(result){
        var xtx = result.tx;
        if(!result.tx || !result.tx.cl_pay_addr)
        {
          $scope.showAlert('err.occurred', 'err.please_retry');
          //$scope.formDone();
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
               title: T.i('err.unable_to_create_tx'),
               template: r.error,
               okType: 'button-assertive', 
            })
            .then(function() {
              $scope.sending_modal.hide();
            });
            //$scope.formDone();
            return;
          }

          $scope.transaction.message = 'send.signing_transaction';
          
          // console.log(r.tx);
          // console.log(r.to_sign);
          // console.log(r.required_signatures);

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
              window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom');
              
              //$scope.formDone();
              
            }, function(){
                var alertPopup = $ionicPopup.alert({
                   title: T.i('err.unable_to_send_tx'),
                   template: T.i('err.server_error'),
                   okType: 'button-assertive', 
                })
                .then(function() {
                  $scope.sending_modal.hide();
                });
                //$scope.formDone();
            });
             
          });

        }, function(error){
           var alertPopup = $ionicPopup.alert({
                title: T.i('err.unable_to_send_tx'),
                template: T.i('err.server_error'),
                okType: 'button-assertive', 
             })
            .then(function() {
              $scope.sending_modal.hide();
            });
            //$scope.formDone();
        });
 
      }, function(error){
        console.log(error);
        if(error=='auth_failed')
          Setting.remove(Setting.BSW_TOKEN);
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        //$scope.formDone();
        return;
      });
    }, function(error){
      console.log(error);
      if(error=='auth_failed')
        Setting.remove(Setting.BSW_TOKEN);
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      $scope.formDone();
      return;
    });
    
  }
 
  
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
