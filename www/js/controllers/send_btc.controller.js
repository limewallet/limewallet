bitwallet_controllers.controller('SendBTCCtrl', function($scope, $q, T, ExchangeTransaction, BitShares, Scanner, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, Wallet, Contact) {

  $scope.data = {

    amount        : undefined,
    address       : undefined,
    memo          : undefined,
    valid_quote   : false,
    other_amount  : undefined,
    input_timeout : undefined,
    quoting       : false,
    quote         : undefined,
    quote_timestamp :  0

  }

  $scope.nanobar = {
    step    : 0.2, 
    current : 0, 
    total   : 30,
    element : undefined,
    stop    : 0
  };

  $scope.stopNanobar = function() {
    $scope.nanobar.current = 0;
    $scope.nanobar.stop    = 1;
    
    if($scope.nanobar.element) {
      $timeout(function(){
        $scope.nanobar.element.go(0);
      }, 0);
    }

  }

  $scope.startNanobar = function() {
    if($scope.nanobar.element === undefined)
    {
      var options3 = {
        target: document.getElementById('nanobar_id'),
        id: 'mynano3',
        bg: '#5abb5c'
      };
      $scope.nanobar.element = new Nanobar( options3 );
      $scope.nanobar.current = 0;
    }

    $scope.stopNanobar();  
    $scope.nanobar.stop = 0;
    $timeout($scope.tickNanobar, $scope.nanobar.step*1000);
  };

  $scope.tickNanobar = function() {

    if ( $scope.nanobar.stop ) { 
      $scope.nanobar.element.go(0);
      return;
    }

    var new_val = 100*$scope.nanobar.current/$scope.nanobar.total;

    $scope.nanobar.current += $scope.nanobar.step;
    $scope.nanobar.element.go(new_val);
    $timeout($scope.tickNanobar, $scope.nanobar.step*1000);

  }

  $scope.$watch('data.amount', function(newValue, oldValue, scope) {
      if(newValue===oldValue)
        return;

      $scope.getQuote();
  });

  $scope.getQuote = function() {

    $scope.data.valid_quote  = false;
    $scope.data.other_amount = undefined;

    $timeout.cancel($scope.input_timeout);
    $scope.stopNanobar();

    if(!$scope.data.amount) {
      $scope.data.quoting = false;
      return;
    }

    $scope.data.quoting = true;

    $scope.input_timeout = $timeout(function () {

      var prom = BitShares.getQuote('buy', $scope.data.amount, 'BTC', Wallet.data.asset.name);

      prom.then(function(res){

        $scope.data.other_amount    = Number(res.quote.cl_pay);
        $scope.data.quote           = res;
        $scope.data.quote_timestamp = parseInt((new Date()).getTime());
        $scope.data.valid_quote     = true;
        $scope.data.quoting         = false;

        $scope.startNanobar();
        $timeout.cancel($scope.requote_timeout);
        $scope.requote_timeout = $timeout(function () {
          $scope.getQuote();
        }, $scope.nanobar.total*1000 );

      }, function(err){
        console.log(JSON.stringify(err));
        $scope.data.quoting = false;
      });
    }, 750);

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
      $scope.showAlert('send_btc.title', err);
      return false;
    }

    return true;
  }

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
        'btc_pay'
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
              type            : 'btc_pay'
            });
          }, function(err) {
            $scope.hideLoading();
            $scope.showAlert('send.title_btc', err);
            console.log(JSON.stringify(err));
          });

        }, function(err) {
          $scope.hideLoading();
          $scope.showAlert('send.title_btc', err);
          console.log(JSON.stringify(err));
        });

      }, function(err) {
        $scope.hideLoading();
        $scope.showAlert('send.title_btc', err);
        console.log(err);
      });

    }, function(err) {
      $scope.hideLoading();
      $scope.showAlert('send.title_btc', 'err.invalid_btc_addy');
      console.log(err);
    });

  }

  $scope.applyScan = function(scan_data) {
    $scope.data.amount  = scan_data.amount ? Number(scan_data.amount) : undefined;
    $scope.data.memo    = scan_data.message;
    $scope.data.address = scan_data.address;

    if($scope.data.amount) {
      $scope.getQuote();
    }
  }

  var scan_data = $stateParams.scan_data;
  if(scan_data) {
    console.log('SEBND BTC controller: ' + JSON.stringify(scan_data));
    $scope.applyScan(scan_data);
  }


});
