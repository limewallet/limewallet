// BitWallet

var bitwallet_module = angular.module('bit_wallet', ['ionic', 'ngCordova', 'pascalprecht.translate', 'reconnectingWebSocket', 'bit_wallet.controllers','bit_wallet.services', 'bit_wallet.filters', 'bit_wallet.config']);

bitwallet_module
.run(function(DB, $state, $ionicHistory, $rootScope, $ionicPlatform, Wallet) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

  });

  $rootScope.refresh_status = 0;

  $rootScope.goHome = function() {
    $ionicHistory.clearHistory();
    $ionicHistory.nextViewOptions({
      disableAnimate : true,
    });
    console.log('clear history and go home!');
    $state.go('app.home');
  }

  $rootScope.$on(Wallet.REFRESH_START, function(event, data) {
    $rootScope.refresh_status = 1;
    console.log('Wallet refrsh start');
  });

  $rootScope.$on(Wallet.REFRESH_DONE, function(event, data) {
    $rootScope.refresh_status = 0;
    console.log('Wallet refrsh done');
  });

  $rootScope.$on(Wallet.REFRESH_ERROR, function(event, data) {
    $rootScope.refresh_status = -1;
    console.log('Wallet refrsh error');
  });

  
  $rootScope.goTo = function(param) {
    $state.go(param);
  }

})

.config(function($ionicConfigProvider, $stateProvider, $urlRouterProvider, $translateProvider, ENVIRONMENT) {
  
  $ionicConfigProvider.views.maxCache(0);
  //$ionicConfigProvider.navBar.alignTitle('left');
  $translateProvider.useStaticFilesLoader({ prefix: 'static/locale-', suffix: '.json'});

  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl',
      resolve : {
        'InitDone' : function(T, Wallet, BitShares, $ionicPlatform, $cordovaSplashscreen, $cordovaGlobalization, $translate, DB, $rootScope) {

          $rootScope.global_init = function() {
            $rootScope.master_key_new   = false;
            $rootScope.wallet           = Wallet.data;
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
            $cordovaGlobalization.getPreferredLanguage()
            .then(function(lang) {
                console.log('Preferred language => ' + lang.value);
                $translate.use(lang.value.slice(0,2));
              },
              function(error) {
                console.log('Unable to get preferred language');
                $translate.use('en');
            })
            
            //*****************
            //INIT DB
            //*****************
            .then(function() {
               return DB.init();
            })
            .then(function() {
                console.log('DB initialized OK');
              },
              function(error) {
                console.log('Unable to initialize DB:' + error);
            })
            
            //*****************
            // Wallet init
            //*****************
            .then(function() {
              return Wallet.init();
            })
            .then(function() {
              console.log('Wallet initialized OK');
            },
            function(error) {
              console.log('Unable to initialize Wallet:' + error);
            })
            
            //****************
            //Refresh Balance
            //****************
            .then(function() {
              console.log(' -- app.js call Wallet.refreshBalance()');
              Wallet.refreshBalance().then(function() {
                window.plugins.toast.show( T.i('g.updated'), 'short', 'bottom');
              }, function(err) {
                window.plugins.toast.show( T.i('g.unable_to_refresh'), 'long', 'bottom');
              });

              // Creo que NO es al pedo, pero por las dudas cerramos el splash.
              $cordovaSplashscreen.hide();
                
              // FullScreen Config
              var showFullScreen = false, showStatusBar = true;
              ionic.Platform.fullScreen(showFullScreen, showStatusBar);
            });
          }

          $ionicPlatform.ready(function(){
            $rootScope.global_init();
          }); //platformReady
        } //InitDone
      } //resolve
    })

    .state('app.backup', {
      url: "/settings/backup",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.backup.html",
          controller: 'BackupCtrl'
        }
      }
    })
    
    .state('app.restore', {
      url: "/settings/restore",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.restore.html",
          controller: 'RestoreCtrl'
        }
      }
    })
    
    .state('app.settings', {
      url: "/settings",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.html",
          controller: 'SettingsCtrl'
        }
      }
    })
    
    .state('app.assets', {
      url: "/assets",
      views: {
        'menuContent' :{
          templateUrl: "templates/assets.html",
          controller: 'AssetsCtrl'
        }
      }
    })
    
    .state('app.receive', {
      url: "/receive",
      views: {
        'menuContent' :{
          templateUrl: "templates/receive.html",
          controller: 'ReceiveCtrl'
        }
      }
    })
    
    .state('app.receive_qrcode', {
      url: "/receive/qrcode/:address/:amount",
      views: {
        'menuContent' :{
          templateUrl: "templates/receive.qrcode.html",
          controller: 'ReceiveQrcodeCtrl'
        }
      }
    })
    
    .state('app.send', {
      url: "/send/:address/:amount/:asset_id",
      views: {
        'menuContent' :{
          templateUrl: "templates/send.html",
          controller: 'SendCtrl'
        }
      }
    })
    
    .state('app.transaction_details', {
      url: "/transaction/:tx_id",
      views: {
        'menuContent' :{
          templateUrl: "templates/tx.html",
          controller: 'TxCtrl'
        }
      }
    })
    
    .state('app.xtransaction_details', {
      url: "/xtransaction/:x_id",
      views: {
        'menuContent' :{
          templateUrl: "templates/xtx.html",
          controller: 'XTxCtrl'
        }
      }
    })

    .state('app.address_book', {
      url: "/address_book",
      cache: false,
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.addressbook.html",
          controller: 'AddressBookCtrl'
        }
      }
    })
    
    .state('app.import_priv', {
      url: "/import_priv/:private_key",
      views: {
        'menuContent' :{
          templateUrl: "templates/import_priv.html",
          controller: 'ImportPrivCtrl'
        }
      }
    })
    
    .state('app.register', {
      cache:  false,
      url:    "/register",
      views: {
              'menuContent' :{
                templateUrl: "templates/register.html",
                //templateUrl: "index.html",
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
                //templateUrl: "index.html",
                controller: 'AccountCtrl'
            }
      }
    })
    
    .state('app.deposit', {
      cache:  false,
      url:    "/deposit",
      views: {
              'menuContent' :{
                templateUrl: "templates/deposit.html",
                //templateUrl: "index.html",
                controller: 'DepositCtrl'
            }
      }
    })
    
    .state('app.deposit_list', {
      cache:  false,
      url:    "/deposit_list",
      views: {
              'menuContent' :{
                templateUrl: "templates/deposit_list.html",
                //templateUrl: "index.html",
                controller: 'DepositListCtrl'
            }
      }
    })
    
    .state('app.withdraw', {
      cache:  false,
      url:    "/withdraw",
      views: {
              'menuContent' :{
                templateUrl: "templates/withdraw.html",
                //templateUrl: "index.html",
                controller: 'WithdrawCtrl'
            }
      }
    })
    
    .state('app.withdraw_list', {
      cache:  false,
      url:    "/withdraw_list",
      views: {
              'menuContent' :{
                templateUrl: "templates/withdraw_list.html",
                //templateUrl: "index.html",
                controller: 'WithdrawListCtrl'
            }
      }
    })
    
    .state('app.home', {
      cache:  false,
      url:    "/home",
      views: {
              'menuContent' :{
                templateUrl: "templates/home.html",
                //templateUrl: "index.html",
                controller: 'HomeCtrl'
            }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
