// BitWallet

function handleOpenURL(url) {
  var event = new CustomEvent('OnPaymentRequest', {detail: {'url': url}});
  setTimeout( function() {
      window.dispatchEvent(event);
    },
    0
  );
}


var bitwallet_module = angular.module('bit_wallet', ['ionic', 'ngCordova', 'pascalprecht.translate', 'reconnectingWebSocket', 'bit_wallet.controllers','bit_wallet.services', 'bit_wallet.filters', 'bit_wallet.config', 'ion-autocomplete']);

bitwallet_module

.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider, $translateProvider, ENVIRONMENT) {
  
  $ionicConfigProvider.views.maxCache(10); 
  $ionicConfigProvider.views.transition('none');
  $ionicConfigProvider.navBar.transition('none');
  $ionicConfigProvider.navBar.alignTitle('left');
  $translateProvider.useStaticFilesLoader({ prefix: 'static/locale-', suffix: '.json'});

  console.log(' app.js Init de .CONFIG !');

  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl',
      //cache: false,
      resolve : {
        'InitDone' : function(T, Wallet, BitShares, $ionicPlatform, $cordovaSplashscreen, $cordovaGlobalization, $translate, DB, $rootScope) {
        } //InitDone
      } //resolve
      
    })

    .state('app.backup', {
      url: "/settings/backup",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.backup.html",
          controller: 'BackupCtrl'
        }
      }
    })
    
    .state('app.restore', {
      url: "/settings/restore",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.restore.html",
          controller: 'RestoreCtrl'
        }
      }
    })
    
    .state('app.settings', {
      //cache: false,
      url: "/settings",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.html",
          controller: 'SettingsCtrl'
        }
      }
    })
    
    .state('app.assets', {
      //cache: false,
      url: "/assets",
      views: {
        'menuContent' :{
          templateUrl: "templates/assets.html",
          controller: 'AssetsCtrl'
        }
      }
    })

    .state('app.contacts', {
      url: "/contacts",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/contacts.html",
          controller: 'ContactsCtrl'
        }
      }
    })

    .state('app.contact', {
      url: "/contact",
      params: {contact : undefined},
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/contact.html",
          controller: 'ContactCtrl'
        }
      }
    })
    
    .state('app.receive', {
      url: "/receive",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/receive.html",
          controller: 'ReceiveCtrl'
        }
      }
    })
    
    .state('app.receive_qrcode', {
      url: "/receive/qrcode/:amount",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/receive.qrcode.html",
          controller: 'ReceiveQrcodeCtrl'
        }
      }
    })
    
    .state('app.send', {
      url: "/send",
      cache: false,
      params: {scan_data : undefined},
      views: {
        'menuContent' :{
          templateUrl: "templates/send.html",
          controller: 'SendCtrl'
        }
      }
    })

    .state('app.send_btc', {
      url: "/send_btc",
      cache: false,
      params: {scan_data : undefined},
      views: {
        'menuContent' :{
          templateUrl: "templates/send_btc.html",
          controller: 'SendBTCCtrl'
        }
      }
    })
    
    .state('app.transaction_details', {
      url: "/transaction/:tx_id",
      cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/tx.html",
          controller: 'TxCtrl'
        }
      }
    })
    
    .state('app.xtransaction_details', {
      url: "/xtransaction/:x_id",
      cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/xtx.html",
          controller: 'XTxCtrl'
        }
      }
    })

    .state('app.import_priv', {
      url: "/import_priv/:private_key",
      cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/import_priv.html",
          controller: 'ImportPrivCtrl'
        }
      }
    })
    
    .state('app.register', {
      url:    "/register",
      cache: false,
      views: {
              'menuContent' :{
                templateUrl: "templates/register.html",
                controller: 'RegisterCtrl'
            }
      }
    })
    
    .state('app.account', {
      cache:  false,
      url:    "/account/:first_time",
      views: {
              'menuContent' :{
                templateUrl: "templates/account.html",
                controller: 'AccountCtrl'
            }
      }
    })
    
    .state('app.deposit', {
      cache:  false,
      url:    "/deposit/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/deposit.html",
                controller: 'DepositCtrl'
            }
      }
    })
    
    .state('app.withdraw', {
      cache:  false,
      url:    "/withdraw",
      views: {
              'menuContent' :{
                templateUrl: "templates/withdraw.html",
                controller: 'WithdrawCtrl'
            }
      }
    })
    
    .state('app.xtx_requote', {
      cache:  false,
      url:    "/xtx_requote/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/xtx_requote.html",
                controller: 'XtxRequoteCtrl'
            }
      }
    })

    .state('app.refund', {
      cache:  false,
      url:    "/refund/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/refund.html",
                controller: 'RefundCtrl'
            }
      }
    })

    .state('app.successful', {
      cache:  false,
      //url:    "/successful/:txid/:xtxid/:address/:name/:message/:amount/:type/:currency_name/:currency_symbol",
      url:    "/successful",
      params: {tx : undefined},
      views: {
              'menuContent' :{
                templateUrl: "templates/successful.html",
                controller: 'SuccessfulCtrl'
            }
      }
    })

    .state('app.welcome', {
      cache:  false,
      url:    "/welcome",
      views: {
              'menuContent' :{
                templateUrl: "templates/welcome.html",
                controller: 'WelcomeCtrl'
            }
      }
    })

    .state('app.create_wallet', {
      cache:  false,
      url:    "/create_wallet",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account.html",
                controller: 'CreateAccountCtrl'
            }
      }
    })

    .state('app.create_wallet_seed', {
      cache:  false,
      url:    "/create_wallet_seed",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account_seed.html",
                controller: 'CreateAccountSeedCtrl'
            }
      }
    })

    .state('app.create_wallet_password', {
      cache:  false,
      url:    "/create_wallet_password",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account_password.html",
                controller: 'CreateAccountPwdCtrl'
            }
      }
    })

    .state('app.home', {
      cache:  true,
      url:    "/home",
      views: {
              'menuContent' :{
                templateUrl: "templates/home.html",
                controller: 'HomeCtrl'}}
      , homeClass: 'darky'
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('about:blank');

})

.run(function(Account, DB, $state, $ionicHistory, $ionicPopup, $ionicLoading, T, $rootScope, $ionicPlatform, Wallet, Scanner, $q, BitShares, ENVIRONMENT, $cordovaGlobalization, $translate, $state) {

  console.log(' app.js Init de .RUN !');
  
  $rootScope.homeClass = 'darky'; //darky

  $ionicPlatform.registerBackButtonAction(function (event) {

    if($ionicHistory.currentStateName() == 'app.home')
    {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Exit door',
        template: 'Are you sure you want to Leave?'
      });
     
      confirmPopup.then(function(res) {
        if(res) {
          navigator.app.exitApp();
        } else {
         console.log('You are not sure');
        }
      });   
    }
    else{
      $ionicHistory.goBack();
    }
  }, 100);
  
  $rootScope.$on('$stateChangeSuccess', function (evt, toState) {
    if (toState.homeClass) {
      $rootScope.homeClass = toState.homeClass;
    } else {
      $rootScope.homeClass = '';
    }
  });
  
  $ionicPlatform.ready(function() {
    
    console.log(' app.js Platform Ready!');
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    console.log(' -- -----------------  calling global_init');
    $rootScope.global_init().then(function(account) {
      
      if( account === undefined) {
        $rootScope.goTo('app.welcome');
        return;
      }
      
      console.log(' -- -----------------  global_init response =>' + JSON.stringify(account));  

      Wallet.init().then(function() {
        
        //$state.go('app.xtx_requote', {xtx_id:'13'});
        //$state.go('app.xtransaction_details', {x_id:'10'});
        //$state.go('app.transaction_details', {tx_id:'5394df9b7a4e1a9db60f576ad7e1a079b439a7e4'});
        //$state.go('app.receive_qrcode', {amount:150});
        // $rootScope.goToSuccess({  txid        : undefined
        //                     , xtxid      : undefined
        //                     , address   : 'DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo'
        //                     , name      : undefined
        //                     , message   : 'tomala, por el pete de ayer'
        //                     , amount    : '69.3'
        //                     , type      : 'send' });
        //$state.go('app.import_priv', {private_key:'ESSSSSSSSSTA'});
        //$state.go('app.xtx_requote', {xtx_id:18});
        //$state.go('app.refund', {xtx_id:18});
        //$state.go('app.settings');
        //$state.go('app.contact', {contact:{name: 'peteelpopo', pubkey:'DVS5YYZsZ7g1fSpPxmZcJifWJ2rmiXbUyJpEYSdNsVw738C88yvoy'}}, {inherit:true});
        //$state.go('app.account');
        //$state.go('app.send_btc', {scan_data:{address:'CF2b4MsrfNMG9ZjatUFg7ZVYwE2qNupBMt', amount:0.05123, message:'Starbucks'}}, {inherit:true});
        $rootScope.goTo('app.home');

        //obscure around glue cheese inherit thing subject blade slow unknown solve assum
        
        Wallet.refreshBalance();
      }, function(err) {

      })
      //$rootScope.goTo('app.welcome');
    }, function(error){
      console.log('initPLatform ready error:'+JSON.stringify(error));
      
    });
  });

  //*****************************
  // CERATE or RECOVER WALLET?
  //*****************************
  $rootScope.init                     = { mode : undefined,
                                          seed : ''};
  $rootScope.INIT_MODE_CREATE_WALLET  = 'create_wallet';
  $rootScope.INIT_MODE_RECOVER_WALLET = 'recover_wallet';
  
  $rootScope.setInitMode = function(init_mode){
    $rootScope.init.mode = init_mode;
  }

  $rootScope.isCreateInitMode = function(){
    return $rootScope.INIT_MODE_CREATE_WALLET == $rootScope.init.mode;
  }

  $rootScope.setSeed = function(seed){
    $rootScope.init.seed = seed;
  }

  $rootScope.isEqualSeed = function(seed){
    console.log ('are equal? -> ' + $rootScope.init.seed +'=='+seed);
    return $rootScope.init.seed == seed;
  }
  
  $rootScope.showLoading = function(message){
    $ionicLoading.show({
      template     : '<ion-spinner icon="android"></ion-spinner>&nbsp;&nbsp;&nbsp;' + T.i(message),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $rootScope.hideLoading = function(){
    $ionicLoading.hide();
  }

  $rootScope.unLockWallet= function(){

    $ionicPopup.prompt({
      title            : T.i('g.wallet_locked'),
      subTitle         : T.i('g.input_password'),
      inputPlaceholder : T.i('g.password'),
      inputType        : 'password',
      okType           : 'base-color_bg color_white base-color_border',
    }).then(function(password) {
      if(!password){
        return;
      }
      Wallet.unlock(password).then(function(){
        window.plugins.toast.show( T.i('g.wallet_unlocked'), 'long', 'bottom'); 
      }, function(err){
        $rootScope.showAlert('err.wallet_un_locked_title', err);
      });
    })

  }
  
  $rootScope.showAlert = function(title, message){
    $ionicPopup.alert({
       title    : T.i(title),
       template : T.i(message),
       okType   : 'base-color_bg color_white base-color_border', 
     });
  }

  //*****************************

  $rootScope.global_init = function() {

    $rootScope.wallet = Wallet.data;
    $rootScope.$watch(
        function(){ return Wallet.data },
      function(newVal) {
        $rootScope.wallet = newVal;
      }
    );

    $rootScope.txs = Wallet.txs;
    $rootScope.$watch(
        function(){ return Wallet.txs },
      function(newVal) {
        $rootScope.txs = newVal;
      }
    );
            
    //$rootScope.wallet = Wallet.txs;
    //$rootScope.$watch(
        //function(){ return Wallet.txs },
      //function(newVal) {
        //$rootScope.wallet = newVal;
      //}
    //);

    //*****************
    // INIT DEV/PROD ENVIRONMENT
    //*****************
    BitShares.setTest(ENVIRONMENT.test);
    
    //*****************
    //GET LANGUAGE
    //*****************
    return $cordovaGlobalization.getPreferredLanguage()
    .then(function(lang) {
        console.log('Preferred language => ' + lang.value);
        //TODO: traducir!
        var tmp = lang.value.slice(0,2);
        tmp = 'en';
        $translate.use(tmp);
        moment.locale(tmp);
      },
      function(error) {
        console.log('Unable to get preferred language');
        $translate.use('en');
        moment.locale('en');
    })
    
    //*****************
    //INIT DB
    //*****************
    .then(function() {
      var db_init = 'no'; window.localStorage['db_init'] || 'no';
      DB.init(false, db_init == 'no');
      
      if ( db_init == 'yes') {
        console.log('DB already initialized');
        //return;
      }
      //DB.init();
    })
    .then(function() {
        console.log('DB initialized OK');
        window.localStorage['db_init'] = 'yes';
      },
      function(error) {
        console.log('Unable to initialize DB:' + error);
    })

    
    // *****************
    // First wallet run?
    // *****************
    .then(function() {
      return Account.active();
    })
  }

  $rootScope.refresh_status = 0;

  $rootScope.goBack = function(){
    $ionicHistory.goBack();
  }
  //TODO: hacerlo bien
  $rootScope.goHome = function() {
    $ionicHistory.clearHistory();
    $ionicHistory.nextViewOptions({
      disableAnimate : true,
      disableBack: true
    });
    console.log('clear history and go home!');
    $state.go('app.home');
  }

  $rootScope.signAll = function(to_sign, addys) {
    var proms = [];
    
    addys.forEach(function(addy) {
      proms.push(BitShares.compactSignatureForHash(to_sign, Wallet.data.account.plain_privkey)) 
    });
    return $q.all(proms);
  }

  $rootScope.computeMemo = function(tx) {
    var deferred = $q.defer();

    //HACK: We use our pubkey when transfering to an address
    var pubkey_to_use = tx.destination.is_pubkey ? tx.destination.address_or_pubkey : Wallet.data.account.pubkey;

    BitShares.randomInteger().then(function(rand_int) {

      rand_int = (rand_int>>>0) & 0x7FFFFFFF;

      BitShares.computeMemo(
        Wallet.data.account.pubkey,
        tx.memo.trim(),
        pubkey_to_use,
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
          deferred.reject(err);
        }); 

      }, function(err) {
        console.log('ERR computeMemo #0->' + JSON.stringify(err));
        deferred.reject(err);
      });


    }, function(err) {
      console.log('ERR computeMemo #1->' + JSON.stringify(err));
      deferred.reject(err);
    });

    return deferred.promise;
  }


  $rootScope.goToState = function(state, scan_data){
    if(state == 'app.send' || state == 'app.withdraw' || state == 'app.send_btc') {
      if ( Wallet.data.locked ) {
        $rootScope.alertUnlock();
        return;
      }

      if (state == 'app.send' || state == 'app.send_btc')
        return $state.go(state, {scan_data:scan_data}, {inherit:true});
    }

    $state.go(state);
  }


  $rootScope.goTo = function(param) {
    $state.go(param);
  }

  $rootScope.goToEx = function(state, params) {
    $state.go(state, params);
  }

  $rootScope.goToSuccess = function(param) {
    // /successful/:txid/:xtxid/:address/:name/:message/:amount/:type/:currency_name/:currency_symbol",
    $state.go('app.successful', {tx:param}, {inherit:true});
  }

  $rootScope.$on(Wallet.REFRESH_START, function(event, data) {
    $rootScope.refresh_status = 1;
    console.log('Wallet refresh start');
  });

  $rootScope.$on(Wallet.REFRESH_DONE, function(event, data) {
    $rootScope.refresh_status = 0;
    console.log('Wallet refresh done');
  });

  $rootScope.$on(Wallet.REFRESH_ERROR, function(event, data) {
    $rootScope.refresh_status = -1;
    console.log('Wallet refresh error');
  });

  $rootScope.alertUnlock = function(){
    // if never shown (settings)
    var alertPopup = $ionicPopup.alert({
      title    : T.i('home.wallet_is_locked'),
      template : T.i('home.wallet_is_locked_content'),
      subTitle : '',
      okText   : T.i('g.got_it'),
      okType   : 'base-color_bg color_white base-color_border',
     });
     alertPopup.then(function(res) {
       // save settings not to show anymore.
     });
  }
  

  
  /// transfer/amount/'+$scope.amount+'/asset/
  //  window.open('bts:DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo/transfer/amount/1.1/asset/USD', '_system', 'location=yes');
  //  bitcoin:BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=1.1  | bitcoin://BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=1.1
  //  bts:DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo?amount=1.1    | bts://DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo?amount=1.1

  window.addEventListener('OnPaymentRequest', function(e) {
      if(!e.detail || !e.detail.url)
      {
        console.log('OnPaymentRequest null url.');
        return;
      }
      Scanner.parseScannedData(e.detail.url).then(function(result){

        console.log('SCAN en OnPaymentRequest (' + result.type + ') => ' + JSON.stringify(result));

        if(!result || result.cancelled)
          return;

        // SEND BTC
        if(result.type == 'btc_request') { 
          $state.go('app.send_btc', {scan_data:result}, {inherit:true});
          return;
        }

        // SEND BTS
        if(result.type == 'bts_request') { 
          if( result.asset && result.asset != Wallet.data.asset.name ) {
            window.plugins.toast.show('Switch your asset first', 'long', 'bottom')
          } else { 
            $state.go('app.send', {scan_data:result}, {inherit:true});
          }
          return;
        }

        if(result.type == 'bts_contact') {
          result.pubkey_or_address = result.pubkey || result.address;
          $state.go('app.contact', {contact:result}, {inherit:true});
          return;
        }

      }, function(error){
        console.log(error);
      });
    });
});
