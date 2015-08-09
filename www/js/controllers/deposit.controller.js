bitwallet_controllers
.controller('DepositCtrl', function($translate, $stateParams, T, ExchangeTransaction, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, Setting, $q) {
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = {
    valid_quote      : false,
    quoting          : false,
    input_timeout    : undefined,
    input_in_btc     : false,
    input_amount     : undefined,
    input_curr       : Wallet.data.asset.symbol,
    other_amount     : undefined,
    other_curr       : 'BTC',
    step             : 1,
    quote            : undefined
  }

  $scope.open_bitcoin_wallet = function() {
    window.open($scope.data.deposit_short_uri, '_system', 'location=yes');
  }

  $scope.buildQRCode = function (xtx) {

    $scope.data.tx                = xtx;
    $scope.data.deposit_short_uri = 'bitcoin://'+xtx.cl_pay_addr+'?amount='+xtx.cl_pay;
    $scope.data.deposit_uri       = $scope.data.deposit_short_uri+'&label=Lime%20Deposit&message=Deposit%20'+xtx.cl_recv+'%20'+xtx.cl_recv_curr;
    
    var qrcode = new QRCode(document.getElementById("deposit_qrcode"), {
      text         : $scope.data.deposit_uri,
      width        : 324,
      height       : 324,
      colorDark    : "#000000",
      colorLight   : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });

  }

  //TODO:
  if($stateParams.xtx_id) {
    ExchangeTransaction.byXId($stateParams.xtx_id).then(function(xtx) {
      $scope.buildQRCode(xtx);
      $scope.data.step=2;
    });
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
        prom = BitShares.getQuote('sell', $scope.data.input_amount, 'BTC', Wallet.data.asset.name);
      } else {
        prom = BitShares.getQuote('buy', $scope.data.input_amount, Wallet.data.asset.name, 'BTC');
      }

      prom.then(function(res){
        $scope.data.other_amount    = $scope.data.input_in_btc ? Number(res.quote.cl_recv) : Number(res.quote.cl_pay);
        console.log(' Deposit -> other_amount:'+$scope.data.other_amount);
        $scope.data.quote           = res;
        $scope.data.valid_quote     = true;
        $scope.data.quoting         = false;
      }, function(err){
        console.log(JSON.stringify(err));
        $scope.data.quoting = false;
        $scope.showAlert('err.occurred','err.invalid_quote_msg');
      });
    }, 750);
  });
  
  $scope.setMessageErr = function(asset, error){
    var message = error;
    var errors = ['max_op', 'min_op'];
    if(errors.indexOf(error)>=0)
      message = T.i('err.'+error, {amount:(error=='max_op'?'50.0 USD':'0.50 USD')});
    if(asset=='USD')
      $scope.data.quoting_usd_error = message;
    else
      $scope.data.quoting_btc_error = message;
  };
        
        
  $scope.next = function() {

    var deferred = $q.defer();

    if ( !$scope.data.valid_quote ) {
      $scope.showAlert('err.invalid_quote', 'err.invalid_quote_msg');
      deferred.reject();
      return deferred.promise;
    }

    var keys = Wallet.getAccountAccessKeys();

    BitShares.acceptQuote(
      $scope.data.quote.quote, 
      $scope.data.quote.signature, 
      keys, 
      Wallet.data.account.address,
      'deposit'
    ).then(function(xtx) {
      ExchangeTransaction.add(xtx.tx).then(function(res) {

        $scope.buildQRCode(xtx.tx);
        $scope.data.step=2;

        Wallet.loadBalance();
        deferred.resolve();
      }, function(err) {
        console.log(JSON.stringify(err));
        deferred.reject();
      });

    }, function(err) {
      console.log(err);
      deferred.reject();
    });

    return deferred.promise;
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
  
})

