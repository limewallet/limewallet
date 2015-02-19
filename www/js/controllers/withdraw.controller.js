bitwallet_controllers
.controller('WithdrawCtrl', function($translate, T, Address, MasterKey, Wallet, BitShares, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard, $ionicLoading, $timeout, BitShares, $state, $ionicModal, $q, Setting) {

// Bitcoin Address:
// msmmBfcvrdG2yZiUQQ21phPkbw966f8nbb
// Private Key (Wallet Import Format):
// 92UK2S47eLEMPrstMfqD44UCLraQ99VSchwhj5VRCMe5X9zUJWe
  
  $scope.data = {
        bitcoin_address:    '', //'BweMQsJqRdmncwagPiYtANrNbApcRvEV77', //'msmmBfcvrdG2yZiUQQ21phPkbw966f8nbb',
        
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
        signature:          undefined,
        tx:                 undefined,
        
        quote_ttl:          60
  }
  
  $scope.default_data = {};
  angular.copy($scope.data, $scope.default_data);
  
  $scope.quote_data = {'quote_curr'     : $scope.wallet.asset.symbol+'_BTC'
                       , 'quote_btc'    : 'BTC_'+$scope.wallet.asset.symbol
                       , 'curr_replace' : ' '+$scope.wallet.asset.symbol };
  
  
  $scope.transaction = {message:'send.generating_transaction'};
  
  var usd_timeout = undefined;
  $scope.$watch('data.amount_usd', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
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
      // llamo a quotear
      BitShares.getSellQuote($scope.quote_data.quote_curr, $scope.data.amount_usd).then(function(res){
        $scope.data.amount_btc = Number(res.quote.client_recv.replace(' BTC', ''));
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_btc = false;
          $scope.startTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        $scope.stopTimer();
        $scope.data.quoting_btc       = false;
        $scope.setMessageErr('BTC', error);
        //console.log(error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
      });
    }, 750);
  });
  
  var btc_timeout = undefined;
  $scope.$watch('data.amount_btc', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
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
        $scope.data.amount_usd  = Number(res.quote.client_pay.replace($scope.quote_data.curr_replace, ''));
        $scope.data.quote       = res.quote;
        $scope.data.signature   = res.signature;
        $timeout(function () {
          $scope.data.quoting_usd = false;
          $scope.startTimer();
        } , 200);
        //console.log(res);
      }, function(error){
        $scope.stopTimer();
        $scope.data.quoting_usd       = false;
        $scope.setMessageErr('USD', error);
        $scope.data.quote             = undefined;
        $scope.data.signature         = undefined;
        //console.log(error);
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
        
        
  $scope.clearErrors = function(){
    $scope.data.quoting_btc_error = undefined;
    $scope.data.quoting_usd_error = undefined;
  };
  // $scope.showLoading = function(){
    // $ionicLoading.show({
      // template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      // animation    : 'fade-in',
      // showBackdrop : true,
      // maxWidth     : 200,
      // showDelay    : 10
    // }); 
  // }

  // $scope.hideLoading = function(){
    // $ionicLoading.hide();
  // }
  
  $scope.remainingTime = function(){
    var d = new Date();
    var n = parseInt(d.getTime()/1000);
    if(!$scope.data.quote.timestamp)
      return 0;
    //console.log('['+$scope.data.quote.timestamp+'] + ['+$scope.data.quote_ttl+'] - ['+n+'] = '+($scope.data.quote.timestamp+$scope.data.quote_ttl-n));
    return parseInt($scope.data.quote.timestamp)+$scope.data.quote_ttl-n;
    
  }
  
  $scope.showAlert = function(title, message){
    $ionicPopup.alert({
       title    : T.i(title) + ' <i class="fa fa-warning float_right"></i>',
       template : T.i(message),
       okType   : 'button-assertive', 
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
  
  $scope.doWithdraw = function(){

    if(!$scope.data.signature || !$scope.data.quote)
    {
      $scope.showAlert('err.no_quote', 'err.no_quote_input_val');
      return;
    }
    
    // if($scope.remainingTime()<=0)
    // {
      // $scope.showAlert('err.quote_expired', 'err.quote_expired_retry');
      // return;
    // }
    if(!$scope.data.bitcoin_address || $scope.data.bitcoin_address.length<1)
    {
      $scope.showAlert('err.btc_addr_error', 'err.btc_addr_error_input');
      return;
    }
    
    var addy = Wallet.getMainAddress();
    BitShares.getBackendToken(addy).then(function(token) {
      BitShares.acceptQuote($scope.data.quote, $scope.data.signature, token, $scope.data.bitcoin_address, BitShares.X_WITHDRAW).then(function(result){
        
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

            BitShares.sendAsset(r.tx, r.secret).then(function(r) {
              $scope.sending_modal.hide();
              $scope.goHome();
              window.plugins.toast.show( T.i('withdraw.succesful'), 'short', 'bottom');
              //$scope.wallet.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/$scope.wallet.assets[$scope.wallet.asset.id].precision, state:'P', date: new Date().getTime()});
              
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
  
  $scope.nanobar  = undefined;
  var ttl = 60;
  var counter_timeout = ttl;
  
  $scope.onTimeout = function() {
    counter_timeout = counter_timeout - 1;
    if(counter_timeout==0)
    {
      $scope.stopTimer();
      $scope.nanobar.go(100);
      $scope.data.timer.expired = 1;
      return;
    }
    $scope.nanobar.go((ttl-counter_timeout)*100/ttl);
    quote_timeout = $timeout($scope.onTimeout, 1000);
  }
  
  $scope.startTimer = function() {
    ttl = $scope.remainingTime();
    counter_timeout = ttl;
    if($scope.nanobar===undefined)
    {
      var options = {
        target: document.getElementById('quote_ttl'),
        id: 'mynano'
      };
      $scope.nanobar = new Nanobar( options );
    }
    $scope.data.timer.expired = 0;
    counter_timeout = ttl;
    quote_timeout = $timeout($scope.onTimeout, 1000);
  };
  
  $scope.stopTimer = function() {
    counter_timeout = ttl;
    if($scope.nanobar)
      $timeout(function(){
          $scope.nanobar.go(0);
        }, 1000);
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
})

