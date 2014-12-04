// BitWallet

angular.module('bit_wallet', ['ionic', 'ngCordova', 'pascalprecht.translate', 'reconnectingWebSocket', 'bit_wallet.controllers','bit_wallet.services'])

.directive('numberOnlyInput', function () {
    return {
        restrict: 'E',
        template: '<input name="{{inputName}}" ng-model="inputValue" class={{inputClass}} style="display:none;" />',
        scope: {
            inputValue: '=',
            inputName: '='
        },
        link: function (scope) {
            scope.$watch('inputValue', function(newValue,oldValue) {
                var arr = String(newValue).split("");
                if (arr.length === 0) return;
                if (arr.length === 1 && (arr[0] === '.' )) return;
                if (arr.length === 2 && newValue === '.') return;
                if (isNaN(newValue)) {
                    scope.inputValue = oldValue;
                }
            });
        }
    };
})

.run(function(DB, ReconnectingWebSocket, $q, MasterKey, AddressBook, Address, $http, $rootScope, $ionicPlatform, $cordovaLocalNotification, $cordovaBarcodeScanner, $ionicModal, $ionicPopup, $cordovaSplashscreen) {

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

    $rootScope.balance      = 0;
    $rootScope.transactions = [];
    $rootScope.raw_txs      = {};
    $rootScope.my_addresses = {};
    $rootScope.my_book      = {};

    DB.init();
    //Create master key if not exists
    MasterKey.get().then(function(res) {
      if(res === undefined) {

        console.log('creating master key...');

        var hdnode  = bitcoin.HDNode.fromBase58( bitcoin.HDNode.fromSeedBuffer( bitcoin.ECKey.makeRandom().d.toBuffer() ).toString() );
        var privkey = hdnode.privKey;
        var pubkey  = hdnode.pubKey.toBuffer();

        MasterKey.store(hdnode.toString(), -1).then(function() {
          Address.create(
            -1, 
            bitcoin.bts.pub_to_address(pubkey), 
            bitcoin.bts.encode_pubkey(pubkey), 
            privkey.toWIF(), 
            true, 
            'main').then( function() {
              $rootScope.$emit('new-address-created');
            });
        });
      }
    }, function(err) {
      console.error(err);
    });

    $rootScope.loadAddressBook = function() {
      console.log('loadAddressBook IN');
      AddressBook.all().then(function(addys) {
        
        addys.forEach(function(addr) {
          console.log('loadAddressBook ' + addr.address + '->' + addr.name);
          $rootScope.my_book[addr.address] = addr;
        });

        $rootScope.$emit('address-book-changed');
      });
    }

    $rootScope.loadAddressBook();

    $rootScope.loadMyAddresses = function() {
      return Address.all().then(function(addys) {
        
        addys.forEach(function(addr) {
          $rootScope.my_addresses[addr.address] = addr;  
        });
      });
    };

    $rootScope.loadMyAddresses();

    $rootScope.refreshBalance = function(show_toast) {
      console.log('resfreshBalance -> IN');

      MasterKey.get().then(function(master_key) {
        if(master_key === undefined)  {
          console.log('resfreshBalance -> no master key!!!');
          return;
        }

        var addr = bitcoin.HDNode.fromBase58(master_key.key).neutered().toString() + ':' + master_key.deriv;
        var url = 'https://bsw.latincoin.com/api/v1/addrs/' + addr + '/balance';
        
        console.log('voy con url: '+url);

        $http.get(url)
        .success(function(r) {
           var total = 0;
           r.balances.forEach(function(b){
            //TODO: just USD for now
            if(b.asset_id == 22)
              total += b.amount;
           });
           //TODO: get from config
           $rootScope.balance = total/1e4; 
           
           var tx  = {};
           var txs = [];

           var close_tx = function() {
             p = {}; 
             p['fee']  = (tx['w_amount'] - tx['d_amount'])/1e4;
             p['sign'] = 0;
             p['date'] = tx['timestamp']*1000;
             if(tx['i_w']) { 
               p['sign']--;
               p['address'] = tx['to'][0];
               p['amount'] = tx['my_w_amount']/1e4 - p['fee'];
             }
             if(tx['i_d']) { 
               p['sign']++;
               p['address'] = tx['from'][0];
               p['amount'] = tx['my_d_amount']/1e4;
             }
             if(p['sign'] == 0)
             {
               p['addr_name'] = 'Me';
             }

             if(p['addr_name'] != 'Me')
             {
               if( p['address'] in $rootScope.my_book )
                p['addr_name'] = $rootScope.my_book[p['address']].name;
               else
                p['addr_name'] = p['address'];
             }
             p['tx_id'] = tx['txid'];
             txs.push(p);
             tx = {};
           }

           r.operations.forEach(function(o){

             //TODO: only USD
             if(o.asset_id != 22) 
               return;

             if(!(o.txid in $rootScope.raw_txs) )
               $rootScope.raw_txs[o.txid] = [];
             
             $rootScope.raw_txs[o.txid].push(o);

             if( tx['txid'] !== undefined && tx['txid'] != o.txid ) {
                close_tx();
             }

             if( tx['txid'] === undefined ) {
                tx['id']          = o.id;
                tx['txid']        = o.txid;
                tx['from']        = [];
                tx['to']          = [];
                tx['w_amount']    = 0;
                tx['my_w_amount'] = 0;
                tx['d_amount']    = 0;
                tx['my_d_amount'] = 0;
                tx['timestamp']   = o.timestamp;
                tx['i_w']         = false;
                tx['i_d']         = false;
             } 

             if(o.op_type == 'w') { 
                tx['w_amount'] += o.amount
                if(o.address in $rootScope.my_addresses) {
                  tx['my_w_amount'] += o.amount;
                  tx['i_w']          = true;
                } else {
                  //TODO: lookup in the address book
                  tx['from'].push(o.address);
                }
                
             } else {
                tx['d_amount'] += o.amount
                if(o.address in $rootScope.my_addresses) {
                  tx['my_d_amount'] += o.amount
                  tx['i_d']          = true;
                } else {
                  //TODO: lookup in the address book
                  tx['to'].push(o.address)
                }
             }
             
           });

           if( tx['id'] !== undefined) {
             close_tx();
           }
           
           $rootScope.transactions=txs;
           if(show_toast == true)
            window.plugins.toast.show( 'Updated', 'short', 'bottom');
        })
        .error(function(data, status, headers, config) {
           window.plugins.toast.show( 'Unable to refresh', 'long', 'bottom');
        })
        .finally(function() {
           console.log('RefreshBalance: finally...');
           $rootScope.$emit('refresh-done');
        });

      });

    };

    $rootScope.refreshBalance();

    $rootScope.subscribe = function() {
      MasterKey.get().then(function(master_key) {
        var sub = bitcoin.HDNode.fromBase58(master_key.key).neutered().toString() + ':' + master_key.deriv;
        $rootScope.ws.send('sub ' + sub);
      });
    }

    $rootScope.ws = new ReconnectingWebSocket('wss://bswws.latincoin.com/events');

    $rootScope.$on('wallet-changed', function() {
      $rootScope.loadMyAddresses();
      $rootScope.refreshBalance();
      $rootScope.subscribe();
    });

    $rootScope.$on('new-balance', function(data) {
      $rootScope.refreshBalance();
    });

    $rootScope.ws.onopen = function () {
      console.log('ONOPEN -> mando subscribe');
      $rootScope.subscribe();
    };

    $rootScope.ws.onmessage = function (event) {
      clearTimeout($rootScope.tid);
      $rootScope.tid = setTimeout( function() { $rootScope.ws.send('ping'); }, 10000);

      if(event.data.indexOf('nb') == 2) {
        //Refresh balance in 500ms, if we get two notifications (Withdraw from two addresses) just refresh once.
        clearTimeout($rootScope.rid);
        $rootScope.rid = setTimeout( function() { $rootScope.$emit('new-balance', event.data); }, 500);
      } 
    };
    
    // Creo que es al pedo, pero por las dudas cerramos el splash.
    setTimeout(function() {
      $cordovaSplashscreen.hide()
    }, 1000);
    // FullScreen Config
    var showFullScreen = false, showStatusBar = true;
    
    ionic.Platform.fullScreen(showFullScreen, showStatusBar);


  });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider) {


  $translateProvider.useStaticFilesLoader({ prefix: '/static/locale-', suffix: '.json'});

  var lang = "en";
  switch(window.navigator.language) {
    case "zh-CN":
      lang = "zh-CN";
      break;

    case "de": case "de-DE": case "de-de":
      lang ="de";
      break;
    
    case "ru": case "ru-RU": case "ru-ru":
      lang = "ru";
      break;

    case "it": case "it-IT": case "it-it":
      lang = "it";
      break;
  }

  $translateProvider.preferredLanguage(lang);

  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl'
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
    
    .state('app.addresses', {
      url: "/settings/addresses",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.addresses.html",
          controller: 'AddressesCtrl'
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
      //url: "/receive/qrcode/:request",
      url: "/receive/qrcode/:address/:amount",
      views: {
        'menuContent' :{
          templateUrl: "templates/receive.qrcode.html",
          controller: 'ReceiveQrcodeCtrl'
        }
      }
    })
    
    .state('app.send', {
      url: "/send/:address/:amount",
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
          templateUrl: "templates/transaction.html",
          controller: 'TxCtrl'
        }
      }
    })
    
    .state('app.home', {
      url: "/home",
      views: {
        'menuContent' :{
          templateUrl: "templates/home.html",
          controller: 'HomeCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
});
