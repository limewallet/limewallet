bitwallet_controllers
.controller('WithdrawCtrl', function($ionicHistory, ExchangeTransaction, $translate, T, Account, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, Setting) {

  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = {
    address          : undefined,
    from_in_progress : false,
    valid_quote      : false,
    quoting          : false,
    input_timeout    : undefined,
    input_in_btc     : false,
    input_amount     : undefined,
    input_curr       : Wallet.data.asset.symbol,
    other_amount     : undefined,
    other_curr       : 'BTC'
  }
  
  $scope.pasteBitcoinAddress = function(){
    $cordovaClipboard
      .paste()
      .then(function (result) {
        //success
        $scope.data.address = result;
      }, function () {
        //error
        window.plugins.toast.show( T.i('err.unable_to_paste_btc_addr'), 'short', 'bottom');
      });
  }

  $scope.validateSend = function(amount) {

    var error = '';

    // Validate amount > 0
    var amount = parseInt(parseFloat(amount)*Wallet.data.asset.precision);
    if ( isNaN(amount) || amount <= 0 ) {
      error = 'invalid_amount';
    // Validate enough funds
    } else if ( Wallet.canSend(amount) < 0 ) {
      error = 'no_funds';
    }

    if (error) {
      $scope.showAlert('withdraw.title', err);
      return false;
    }

    return true;
  }


  $scope.toggleInputCurrency = function(){
    
    $scope.data.input_in_btc = !$scope.data.input_in_btc;

    $scope.data.input_amount = undefined;
    $scope.data.input_curr   = !$scope.data.input_in_btc ? Wallet.data.asset.symbol : 'BTC';

    $scope.data.other_curr   = !$scope.data.input_in_btc ? 'BTC' : Wallet.data.asset.symbol;
    $scope.data.other_amount = undefined;

    console.log(' toggled deposit currency. INPUT CURR:'+$scope.data.input_curr);
  }

  $scope.$watch('data.input_amount', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    //$scope.clearErrors();
    $scope.data.valid_quote  = false;
    $scope.data.other_amount = undefined;

    $timeout.cancel($scope.input_timeout);

    if(!$scope.data.input_amount) {
      $scope.data.quoting = false;
      return;
    }

    $scope.data.quoting = true;

    $scope.input_timeout = $timeout(function () {

      var prom;
      if ( $scope.data.input_in_btc ) {
        prom = BitShares.getQuote('buy', $scope.data.input_amount, 'BTC', Wallet.data.asset.name);
      } else {
        prom = BitShares.getQuote('sell', $scope.data.input_amount, Wallet.data.asset.name, 'BTC');
      }

      prom.then(function(res){

        $scope.data.other_amount    = !$scope.data.input_in_btc ? Number(res.quote.cl_recv) : Number(res.quote.cl_pay);
        $scope.data.quote           = res;
        $scope.data.valid_quote     = true;
        $scope.data.quoting         = false;
      }, function(err){
        console.log(JSON.stringify(err));
        $scope.data.quoting = false;
      });
    }, 750);
  });
  
  $scope.trySend = function(tx) {

    console.log('trySend ' + JSON.stringify(tx));

    var deferred = $q.defer();

    tx.memo = tx.memo || '';

    $scope.computeMemo(tx).then(function(memo) {

      slate = memo.skip32_index;

      BitShares.new_(
        Wallet.data.account.address, 
        tx.destination.address_or_pubkey, 
        tx.amount*Wallet.data.asset.precision, 
        Wallet.data.asset.name, 
        memo, slate).then(function(new_tx) {

        $scope.signAll(new_tx.to_sign, new_tx.required_signatures).then( function(signatures) {
          new_tx.tx.signatures = signatures;

          BitShares.sendAsset(new_tx.tx, new_tx.secret).then(function(res) {
            deferred.resolve(res);
          }, function(err) {
            console.log('trySend #1:' + JSON.stringify(err));
            deferred.reject(err);
          });

        }, function(err) {
          console.log('trySend #2:' + JSON.stringify(err));
          deferred.reject(err);
        });

      }, function(err) {
        console.log('trySend #3:' + JSON.stringify(err));
        deferred.reject(err);
      });

    }, function(err) {
      console.log(JSON.stringify(err));
      deferred.reject(err);
    });

    return deferred.promise;
  }


  $scope.doAcceptAndSend = function() {

    if (!$scope.data.valid_quote) {
      return;
    }

    BitShares.btcIsValidAddress($scope.data.address).then(function(is_valid) {

      if(!$scope.validateSend($scope.data.quote.quote.cl_pay)) {
        return;
      }

      $scope.showLoading('g.sending');

      var keys = Wallet.getAccountAccessKeys();

      BitShares.acceptQuote(
        $scope.data.quote.quote, 
        $scope.data.quote.signature, 
        keys, 
        $scope.data.address,
        'withdraw'
      ).then(function(xtx) {

        var tx = {
          destination : { 
            address_or_pubkey : xtx.tx.cl_pay_addr, 
            is_pubkey: false 
          },
          amount : xtx.tx.cl_pay,
          memo   : $scope.data.memo
        }

        $scope.trySend(tx).then(function() {

          ExchangeTransaction.add(xtx.tx).then(function(res) {
            Wallet.loadBalance();
            //TODO: show success
            $scope.hideLoading();
            $scope.goToSuccess({
              txid            : undefined,
              xtxid           : undefined,
              address         : xtx.tx.cl_recv_addr,
              currency_symbol : xtx.tx.cl_recv_curr,
              currency_name   : xtx.tx.cl_recv_curr,
              message         : tx.memo,
              amount          : xtx.tx.cl_recv,
              type            : 'withdraw'
            });
          }, function(err) {
            $scope.hideLoading();
            $scope.showAlert('withdraw.title', err);
            console.log(JSON.stringify(err));
          });

        }, function(err) {
          $scope.hideLoading();
          $scope.showAlert('withdraw.title', err);
          console.log(JSON.stringify(err));
        });

      }, function(err) {
        $scope.hideLoading();
        $scope.showAlert('withdraw.title', err);
        console.log(err);
      });

    }, function(err) {
      $scope.hideLoading();
      $scope.showAlert('withdraw.title', 'err.invalid_btc_addy');
      console.log(err);
    });

  }

  $scope.copyUri = function(){
    $cordovaClipboard
      .copy($scope.data.deposit_uri)
      .then(function () {
        //success
        window.plugins.toast.show(T.i('deposit.uri_copied'), 'short', 'bottom');
      }, function () {
        //error
        window.plugins.toast.show(T.i('err.unable_to_copy_uri'), 'short', 'bottom');
      });
  }

  $scope.copyAddy = function(){
    $cordovaClipboard
      .copy($scope.data.tx.cl_pay_addr)
      .then(function () {
        //success
        window.plugins.toast.show(T.i('deposit.addy_copied'), 'short', 'bottom');
      }, function () {
        //error
        window.plugins.toast.show(T.i('err.unable_to_copy_uri'), 'short', 'bottom');
      });
  }

  $scope.$on( '$ionicView.beforeLeave', function(){
    //$scope.stopNanobar();
  });
  
})

