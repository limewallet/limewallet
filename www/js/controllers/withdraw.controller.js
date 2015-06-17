bitwallet_controllers
.controller('WithdrawCtrl', function($ionicHistory, $translate, T, Account, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, Setting) {

// Bitcoin Address:
// msmmBfcvrdG2yZiUQQ21phPkbw966f8nbb
// Private Key (Wallet Import Format):
// 92UK2S47eLEMPrstMfqD44UCLraQ99VSchwhj5VRCMe5X9zUJWe
// bitcoin:BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=1.1
  
  console.log('WITHDRAW IN: ' + JSON.stringify($ionicHistory.viewHistory()))
  

  $scope.data = {
    input_in_btc     : false,
    input_amount     : undefined,
    input_curr       : 'USD',
    other_amount     : undefined,
    other_curr       : 'BTC',

    bitcoin_address:    '', //C4hJYM1NYgjqszEnqA9qr6QSAQLQvywnfk', //'BweMQsJqRdmncwagPiYtANrNbApcRvEV77', //'msmmBfcvrdG2yZiUQQ21phPkbw966f8nbb',
    
    amount_usd:         undefined,
    amount_btc:         undefined,
    quoting_usd:        false,
    quoting_btc:        false,
    quoting_btc_error:  undefined,
    quoting_usd_error:  undefined,
    
    timer:              {options:{}, remaining:undefined, percent:undefined, start:0, stop:0, expired:0},
    quote_expired:      false,
    
    deposit_uri:        undefined,
    deposit_qrcode:     undefined,
    deposit_short_uri:  undefined,  
    
    quote:              undefined,
    quote_timestamp:    0, 
    signature:          undefined,
    tx:                 undefined,
    
    quote_ttl:          60,
    
    from_in_progress:   false
  }
  
  $scope.toggleInputCurrency = function(){
    
    $scope.data.input_in_btc = !$scope.data.input_in_btc;

    $scope.data.input_amount = undefined;
    $scope.data.input_curr   = !$scope.data.input_in_btc ? Wallet.data.asset.symbol : 'BTC';

    $scope.data.other_curr   = !$scope.data.input_in_btc ? 'BTC' : Wallet.data.asset.symbol;
    $scope.data.other_amount = undefined;

    console.log(' toggled deposit currency. INPUT CURR:'+$scope.data.input_curr);
  }
    
  // Disable and enable form handlers
  // $scope.data   = {from_in_progress:false};
  $scope.formInProgress = function(){
    $scope.data.from_in_progress = true;
    console.log(' -- WithdrawCtrl Form DISABLED');
  }
  $scope.formDone = function(){
    $scope.data.from_in_progress = false; 
    console.log(' -- WithdrawCtrl Form ENABLED!!!!');
  }
  
  $scope.default_data = {};
  angular.copy($scope.data, $scope.default_data);
  //console.log('withdrawCtrl symbol?: '+$scope.wallet.asset.x_symbol);
  $scope.quote_data = {'quote_curr'     : $scope.wallet.asset.x_symbol+'_BTC'
                       , 'quote_btc'    : 'BTC_'+$scope.wallet.asset.x_symbol};
  
  
  $scope.transaction = {message:'send.generating_transaction'};
  
  var usd_timeout = undefined;
  $scope.$watch('data.amount_usd', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    $scope.getUSDQuote();
  });

  $scope.getUSDQuote = function()
  {
    $scope.clearErrors();
    if(usd_timeout)
    {
      $timeout.cancel(usd_timeout);
      usd_timeout = undefined;
      $scope.data.quoting_btc = false;
    }
    console.log('$scope.data.quoting_usd:'+$scope.data.quoting_usd);
    if($scope.data.quoting_usd)
      return;
    usd_timeout = $timeout(function () {
      $scope.data.quoting_btc = true;
      $scope.data.amount_btc = undefined;
      // Quote current request
      BitShares.getSellQuote($scope.quote_data.quote_curr, $scope.data.amount_usd).then(function(res){
        $scope.data.amount_btc      = Number(res.quote.cl_recv);
        $scope.data.quote           = res.quote;
        $scope.data.quote_timestamp = parseInt((new Date()).getTime()); 
        $scope.data.signature       = res.signature;
        $timeout(function () {
          $scope.data.quoting_btc = false;
          // $scope.startTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        // $scope.stopTimer();
        $scope.data.quoting_btc       = false;
        $scope.setMessageErr('BTC', error);
        //console.log(error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
      });
    }, 750);
  }
  
  var btc_timeout = undefined;
  $scope.$watch('data.amount_btc', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    $scope.getBTCQuote();
  });
  
  $scope.getBTCQuote = function(){
    $scope.clearErrors();
    if(btc_timeout)
    {
      $timeout.cancel(btc_timeout);
      btc_timeout = undefined;
      $scope.data.quoting_usd = false;
    }
    console.log('$scope.data.quoting_btc:'+$scope.data.quoting_btc);
    if($scope.data.quoting_btc)
      return;
    btc_timeout = $timeout(function () {
      $scope.data.quoting_usd = true;
      $scope.data.amount_usd = undefined;
      // llamo a quotear
      //BitShares.getBuyQuote('BTC_USD', $scope.data.amount_btc).then(function(res){
      BitShares.getBuyQuote($scope.quote_data.quote_btc, $scope.data.amount_btc).then(function(res){
        $scope.data.amount_usd  = Number(res.quote.cl_pay);
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_usd = false;
          // $scope.startTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        // $scope.stopTimer();
        $scope.data.quoting_usd       = false;
        $scope.setMessageErr('USD', error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
        //console.log(error);
      });
    }, 750);
  }
  
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
        
        
  $scope.clearErrors = function(){
    $scope.data.quoting_btc_error = undefined;
    $scope.data.quoting_usd_error = undefined;
  };
  
  // $scope.remainingTime = function(){
  //   var n = parseInt((new Date()).getTime());
  //   //var n = parseInt(d.getTime()/1000);
  //   if(!$scope.data.quote_timestamp)
  //     return 0;
  //   var rem = parseInt($scope.data.quote_timestamp)+($scope.data.quote_ttl*1000)-n;
  //   return rem;
  // }
  
  
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
  
  $scope.doWithdraw = function(){
    $scope.formInProgress();
    if(!$scope.data.signature || !$scope.data.quote)
    {
      $scope.formDone();
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      return;
    }
    
    if(!$scope.data.bitcoin_address || $scope.data.bitcoin_address.length<1)
    {
      $scope.formDone();
      $scope.showAlert('err.btc_addr_error', 'err.btc_addr_error_input');
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data.quote, $scope.data.signature, token, $scope.data.bitcoin_address, BitShares.X_WITHDRAW).then(function(result){
        
        if(!result.tx || !result.tx.cl_pay_addr)
        {
          $scope.formDone();
          $scope.showAlert('err.occurred', 'err.please_retry');
          return;
        }
        
        var xtx = result.tx;
        
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
            $scope.formDone();
            return;
          }

          $scope.transaction.message = 'send.signing_transaction';
          
          // console.log(r.tx);
          // console.log(r.to_sign);
          // console.log(r.required_signatures);

          r.tx.signatures = [];

          var prom = [];
          angular.forEach(r.required_signatures, function(req_addy) {
            // Address????
            // var p = Address.by_address(req_addy)
            //   .then(function(addy) {
            //     return BitShares.compactSignatureForHash(r.to_sign, addy.privkey)
            //       .then(function(compact){
            //         r.tx.signatures.push(compact);
            //       })
            //   });
            // prom.push(p);
          });

          $q.all(prom).then(function() {
            $scope.transaction.message = 'send.sending_transaction';

            BitShares.sendAsset(r.tx, r.secret).then(function(res) {
              $scope.sending_modal.hide();
              $scope.goHome();
              window.plugins.toast.show( T.i('withdraw.successful'), 'short', 'bottom');
              console.log('withdraw::send_asset XTX: '+JSON.stringify(xtx));
              console.log('withdraw::send_asset OPER res: '+JSON.stringify(res));
              xtx['operation_tx_id'] = res.tx_id;
              Wallet.onNewXTxAndLoad(xtx);

              $scope.formDone();
              
            }, function(error){
                console.log(' -- withdraw:sendAsset error #1 ');
                console.log(JSON.stringify(error));
                $scope.sending_modal.hide();
                var alertPopup = $ionicPopup.alert({
                   title: T.i('err.unable_to_send_tx'),
                   template: T.i('err.server_error'),
                   okType: 'button-assertive', 
                })
                .then(function() {
                  // Borramos la actual tx y mandamos a requotear?
                  BitShares.cancelXTx(token, xtx['id']).then(function(res){
                    console.log(' Cancelled tx because an error occurred: '+ xtx['id'].toString());
                  });
                  if(!$scope.quote)
                    return;
                  var cl_cmd = $scope.quote['cl_cmd'];
                  if(cl_cmd.split(' ')[2]=='BTC')
                  {
                    //buy 0.0222 BTC bitUSD
                    $scope.getBTCQuote();
                  }
                  else{
                    //sell 15 bitUSD BTC
                    $scope.getUSDQuote();
                  }
                  $scope.formDone();
                });
            });
             
          });

        }, function(error){
            console.log(' -- withdraw:sendAsset error #2 ');
            console.log(JSON.stringify(error));
            $scope.sending_modal.hide();    
            var alertPopup = $ionicPopup.alert({
              title: T.i('err.unable_to_send_tx'),
              template: T.i('err.server_error'),
              okType: 'button-assertive', 
            })
            .then(function() {
              
            });
            
            BitShares.cancelXTx(token, xtx['id']).then(function(res){
              console.log(' Cancelled tx because an error occurred: '+ xtx['id'].toString());
            }, function(error){

            }).finally(function(){
              $scope.formDone();
            });
        });
 
      }, function(error){
        console.log(' -- withdraw:sendAsset error #3 ');
        console.log(JSON.stringify(error));
        if(error=='auth_failed')
          Setting.remove(Setting.BSW_TOKEN);
        $scope.showAlert('err.cant_accept', 'err.cant_accept_retry');
        $scope.formDone();
        return;
      });
    }, function(error){
      console.log(' -- withdraw:sendAsset error #4 ');
      console.log(JSON.stringify(error));
      if(error=='auth_failed')
        Setting.remove(Setting.BSW_TOKEN);
      $scope.showAlert('err.no_token', 'err.no_token_retry');
      $scope.formDone();
      return;
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
  
  $scope.pasteBitcoinAddress = function(){
    $cordovaClipboard
      .paste()
      .then(function (result) {
        //success
        $scope.data.bitcoin_address = result;
      }, function () {
        //error
        window.plugins.toast.show( T.i('err.unable_to_paste_btc_addr'), 'short', 'bottom');
      });
  }
  
  $scope.restart = function(){
    angular.copy($scope.default_data, $scope.data);
  }

  $scope.$on( '$ionicView.beforeLeave', function(){
    // Destroy timers
    console.log('WithdrawCtrl.ionicView.beforeLeave killing timers.');
    counter_timeout=0;
    $scope.formDone();
    //$scope.stopTimer();
  });
})

