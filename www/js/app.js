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
      url: "/send/:address/:amount/:asset_id/:is_btc",
      cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/send.html",
          controller: 'SendCtrl'
        }
      }
    })
    
    .state('app.transaction_details', {
      url: "/transaction/:tx_id",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/tx.html",
          controller: 'TxCtrl'
        }
      }
    })
    
    .state('app.xtransaction_details', {
      url: "/xtransaction/:x_id",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/xtx.html",
          controller: 'XTxCtrl'
        }
      }
    })

    .state('app.import_priv', {
      url: "/import_priv/:private_key",
      //cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/import_priv.html",
          controller: 'ImportPrivCtrl'
        }
      }
    })
    
    .state('app.register', {
      url:    "/register",
      //cache: false,
      views: {
              'menuContent' :{
                templateUrl: "templates/register.html",
                controller: 'RegisterCtrl'
            }
      }
    })
    
    .state('app.account', {
      //cache:  false,
      url:    "/account/:first_time",
      views: {
              'menuContent' :{
                templateUrl: "templates/account.html",
                controller: 'AccountCtrl'
            }
      }
    })
    
    .state('app.deposit', {
      //cache:  false,,
      url:    "/deposit/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/deposit.html",
                controller: 'DepositCtrl'
            }
      }
    })
    
    .state('app.withdraw', {
      //cache:  false,,
      url:    "/withdraw",
      views: {
              'menuContent' :{
                templateUrl: "templates/withdraw.html",
                controller: 'WithdrawCtrl'
            }
      }
    })
    
    .state('app.xtx_requote', {
      //cache:  false,,
      url:    "/xtx_requote/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/xtx_requote.html",
                controller: 'XtxRequoteCtrl'
            }
      }
    })

    .state('app.refund', {
      //cache:  false,,
      url:    "/refund/:xtx_id",
      views: {
              'menuContent' :{
                templateUrl: "templates/refund.html",
                controller: 'RefundCtrl'
            }
      }
    })

    .state('app.successful', {
      //cache:  false,,
      url:    "/successful/:txid/:xtxid/:address/:name/:message/:amount/:type",
      views: {
              'menuContent' :{
                templateUrl: "templates/successful.html",
                controller: 'SuccessfulCtrl'
            }
      }
    })

    .state('app.welcome', {
      //cache:  false,,
      url:    "/welcome",
      views: {
              'menuContent' :{
                templateUrl: "templates/welcome.html",
                controller: 'WelcomeCtrl'
            }
      }
    })

    .state('app.create_wallet', {
      //cache:  false,,
      url:    "/create_wallet",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account.html",
                controller: 'CreateAccountCtrl'
            }
      }
    })

    .state('app.create_wallet_seed', {
      //cache:  false,,
      url:    "/create_wallet_seed",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account_seed.html",
                controller: 'CreateAccountSeedCtrl'
            }
      }
    })

    .state('app.create_wallet_password', {
      //cache:  false,,
      url:    "/create_wallet_password",
      views: {
              'menuContent' :{
                templateUrl: "templates/create_account_password.html",
                controller: 'CreateAccountPwdCtrl'
            }
      }
    })

    .state('app.home', {
      //cache:  false,
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
        //$rootScope.goTo('app.contacts');
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
        $rootScope.goTo('app.home');
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
      template     : '<ion-spinner icon="android"></ion-spinner>&nbsp;' + T.i(message),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $rootScope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $rootScope.showAlert = function(title, message){
    $ionicPopup.alert({
       title    : T.i(title),
       template : T.i(message),
       okType   : 'button-assertive', 
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

  $rootScope.goTo = function(param) {
    $state.go(param);
  }

  $rootScope.goToEx = function(state, params) {
    $state.go(state, params);
  }

  $rootScope.goToSuccess = function(params) {
    $rootScope.goToEx('app.successful', params);
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
  

  /// transfer/amount/'+$scope.amount+'/asset/
  //  window.open('bts:DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo/transfer/amount/1.1/asset/USD', '_system', 'location=yes');
  //  bitcoin:BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=1.1  | bitcoin://BweMQsJqRdmncwagPiYtANrNbApcRvEV77?amount=1.1
  //  bts:DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo?amount=1.1    | bts://DVSNKLe7F5E7msNG5RnbdWZ7HDeHoxVrUMZo?amount=1.1
  $rootScope.resolveURI = function(data){

    if( !data.cancelled ) {

        if(data.privkey !== undefined)
        {
          $state.go('app.import_priv', {private_key:data.privkey});
          return;
        }
        
        var promises = [];
        //Pubkey scanned
        if(data.pubkey !== undefined) {
          var p = BitShares.btsPubToAddress(data.pubkey)
          .then(function(addy){
            data.address = addy;
          })
          promises.push(p);
        }
        
        $q.all(promises).then(function() {
          $state.go('app.send', {address:data.address, amount:data.amount, asset_id:data.asset_id, is_btc:data.is_btc});
        })
      }
  }

  window.addEventListener('OnPaymentRequest', function(e) {
      if(!e.detail || !e.detail.url)
      {
        console.log('OnPaymentRequest null url.');
        return;
      }
      Scanner.parseUrl(e.detail.url).then(function(data){
        // address/:amount/:asset_id/:is_btc
        // $state.go('app.send', {address:data.address, amount:data.amount, asset_id:data.asset_id, is_btc:data.is_btc});
        $rootScope.resolveURI(data);
      }, function(error){
        console.log(error);
      });
    });
});
