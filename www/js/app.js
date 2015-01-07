// BitWallet

angular.module('bit_wallet', ['ionic', 'ngCordova', 'pascalprecht.translate', 'reconnectingWebSocket', 'bit_wallet.controllers','bit_wallet.services'])

// http://jsfiddle.net/DwKZh/763/
// usage: <input numbers-only-input="numbers-only-input" ...
.directive('numbersOnlyInput', function(){
   return {
     require: 'ngModel',
     link: function(scope, element, attrs, modelCtrl) {
       modelCtrl.$parsers.push(function (inputValue) {
          // this next if is necessary for when using ng-required on your input. 
          // In such cases, when a letter is typed first, this parser will be called
          // again, and the 2nd time, the value will be undefined
          if (inputValue == undefined) return ''; 
          
          //var transformedInput = inputValue.replace(/[^0-9+.]/g, ''); 
          console.log('##1 inputValue:'+ inputValue);
          var original_value = inputValue;
          if(inputValue=='.')
          {
            inputValue='0.';
            console.log('##2 inputValue:'+ inputValue);
          }
          var match = String(inputValue).match(/\d+(\.)?(\d+)?/g);
          var transformedInput = '';
          if (match && match.length>0)
          {   
            transformedInput = match.join('');
            console.log('##3 transformedInput:'+ transformedInput);
          }
          if (transformedInput!=original_value) {
            if(transformedInput && transformedInput!==undefined)
            { 
              console.log('##4 transformedInput:'+ transformedInput);
              modelCtrl.$setViewValue(Number(transformedInput));
            }
            else
            { 
              console.log('##5 transformedInput is none or undefined');
              modelCtrl.$setViewValue(0);
            }
            modelCtrl.$render();
          }      
          if(transformedInput && transformedInput!==undefined)
            return Number(transformedInput); 
            
          console.log('##6 le metemo 0 papa');
          modelCtrl.$setViewValue(0);
          modelCtrl.$render();
          return 0;         
       });
     }
   };
})

.directive('oldNumbersOnlyInput', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, modelCtrl) {
            scope.$watch(attrs['ngModel'], function(inputValue, oldValue) {
                console.log('#1: ['+inputValue + '] / ['+ oldValue+']');
                // return;
                if(inputValue==undefined && oldValue && oldValue!=undefined)
                {
                  console.log('#1.1: ['+inputValue + '] / ['+ oldValue+']');
                  modelCtrl.$setViewValue(Number(oldValue));
                  modelCtrl.$render();
                  return Number(oldValue);   
                }
                
                if(inputValue==undefined || inputValue=='' || !inputValue){
                  console.log('#1.2: ['+inputValue + '] / ['+ oldValue+']');
                  modelCtrl.$setViewValue(0);
                  modelCtrl.$render();
                  return 0;  
                }
                var original_value = inputValue;
                if(inputValue=='.')
                 inputValue='0.';
                var match = String(inputValue).match(/^0*\d+(\.)?(\d+)?/g);
                var transformedInput = '';
                if (match && match.length>0)
                {
                   transformedInput = match.join('');
                   console.log('#2: ['+inputValue + '] / ['+ oldValue+'] / [' + transformedInput + ']' );
                }
                if(transformedInput=='' || transformedInput==undefined)
                {  
                  transformedInput=oldValue;
                  console.log('#3: ['+inputValue + '] / ['+ oldValue+'] / [' + transformedInput + ']' );
                }
                //if (transformedInput!=original_value) {
                  modelCtrl.$setViewValue(Number(transformedInput));
                  modelCtrl.$render();
                  console.log('#4: setting scope value' );
                //} 
                console.log('#5: '+transformedInput );                
                return Number(transformedInput);         
                // var arr = String(newValue).split("");
                // if (arr.length === 0) 
                // {
                  // scope.inputValue = 0;
                  // return;
                // }
                // if (arr.length === 1 && (arr[0] === '.' )) return;
                // if (arr.length === 2 && newValue === '.') return;
                // if (isNaN(newValue)) {
                    // scope.inputValue = oldValue;
                // }
            });
        }
    };
})

.run(function(DB, BitShares, $cordovaGlobalization, $translate, ReconnectingWebSocket, $q, MasterKey, AddressBook, Address, Asset, $http, $rootScope, $ionicPlatform, $cordovaLocalNotification, $ionicModal, $ionicPopup, $cordovaSplashscreen, T, $cordovaDevice ) {

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
    
    $rootScope.initPlatform = function(){
      //$rootScope.platform = 'android';
      //if(device !== undefined && device.platform !== undefined)
        //$rootScope.platform = device.platform;
      console.log(' -- Platform: '+ $rootScope.platform);
    }

    $rootScope.loadAssets = function() {
      return Asset.all().then(function(assets) {
        assets.forEach(function(asset) {
          $rootScope.assets[asset.id]  = asset;
          $rootScope.balance[asset.id] = 0;

          if(asset.is_default != 0)
            $rootScope.asset_id = asset.id;

          console.log('loaded asset: '+ asset.id);
        });
        $rootScope.asset = $rootScope.assets[$rootScope.asset_id];
        console.log('Assets loaded');
      });
    };

    $rootScope.loadAddressBook = function() {
      return AddressBook.all().then(function(addys) {
        
        addys.forEach(function(addr) {
          console.log('loadAddressBook ' + addr.address + '->' + addr.name);
          $rootScope.my_book[addr.address] = addr;
        });

        console.log('AddressBook loaded');
        $rootScope.$emit('address-book-changed');
      });
    }

    $rootScope.loadMyAddresses = function() {
      return Address.all().then(function(addys) {
        addys.forEach(function(addr) {
          $rootScope.my_addresses[addr.address] = addr;  
        });
        console.log('MyAddresses loaded');
      });
    };

    $rootScope.assetChanged = function(asset_id){
      $rootScope.transactions          = [];
      $rootScope.current_balance       = 0;
      $rootScope.balance               = {};
      $rootScope.asset_id              = asset_id;
      $rootScope.asset                 = $rootScope.assets[asset_id];
      $rootScope.refreshBalance(true);
    }
    
    $rootScope.refreshBalance = function(show_toast) {
      console.log('resfreshBalance -> IN');

      MasterKey.get().then(function(master_key) {
        if(master_key === undefined)  {
          console.log('resfreshBalance -> no master key!!!');
          return;
        }


        BitShares.extendedPublicFromPrivate(master_key.key).then(function(extendedPublicKey){

          var addr = extendedPublicKey + ':' + master_key.deriv;
          var url = 'https://bsw.latincoin.com/api/v1/addrs/' + addr + '/balance/' + $rootScope.asset_id;
          
          console.log('voy con url: '+url + ' para asset:'+$rootScope.asset_id);
          console.log($rootScope.assets[$rootScope.asset_id]);
          var precision = $rootScope.assets[$rootScope.asset_id].precision;

          $http.get(url)
          .success(function(r) {
            r.balances.forEach(function(b){
              $rootScope.balance[b.asset_id] = b.amount/precision;//1e4; 
              if(b.asset_id==$rootScope.asset_id)
              {
                $rootScope.current_balance = $rootScope.balance[b.asset_id];
                console.log(' balance for asset:'+b.asset_id)
              }
            });
             
             var tx  = {};
             var txs = [];

             var close_tx = function() {
                
              var assets = Object.keys(tx['assets']);
              for(var i=0; i<assets.length; i++) {
                 p = {}; 
                 p['fee']  = (tx['assets'][assets[i]]['w_amount'] - tx['assets'][assets[i]]['d_amount'])/precision;
                 p['sign'] = 0;
                 p['date'] = tx['assets'][assets[i]]['timestamp']*1000;
                 if(tx['assets'][assets[i]]['i_w']) { 
                   p['sign']--;
                   p['address'] = tx['assets'][assets[i]]['to'][0];
                   p['amount'] = tx['assets'][assets[i]]['my_w_amount']/precision - p['fee'];
                 }
                 if(tx['assets'][assets[i]]['i_d']) { 
                   p['sign']++;
                   p['address'] = tx['assets'][assets[i]]['from'][0];
                   p['amount'] = tx['assets'][assets[i]]['my_d_amount']/precision;
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
               }
               tx = {};
             }

             r.operations.forEach(function(o){

               //TODO: only USD
               //if(o.asset_id != 22) 
               //  return;

               //console.log('vamos con op -> ' + o.id);

               //Esto es para mostrar en el detalle de "renglon"
               if(!(o.txid in $rootScope.raw_txs) )
                 $rootScope.raw_txs[o.txid] = [];
               
               $rootScope.raw_txs[o.txid].push(o);

               
               if( tx['txid'] !== undefined && tx['txid'] != o.txid ) {
                  //console.log('mando a cerrar');
                  close_tx();
               }

               if( tx['txid'] === undefined || ( tx['assets'] !== undefined && !(o.asset_id in tx['assets']) )  ) {

                  //console.log('abro');
                  
                  tx['txid']        = o.txid;
                  tx['assets']      = {};
                  tx['assets'][o.asset_id] = {
                    'id'          : o.id,
                    'from'        : [],
                    'to'          : [],
                    'w_amount'    : 0,
                    'my_w_amount' : 0,
                    'd_amount'    : 0,
                    'my_d_amount' : 0,
                    'timestamp'   : o.timestamp,
                    'i_w'         : false,
                    'i_d'         : false,
                  }
               } 

               if(o.op_type == 'w') { 
                  tx['assets'][o.asset_id]['w_amount'] += o.amount
                  if(o.address in $rootScope.my_addresses) {
                    tx['assets'][o.asset_id]['my_w_amount'] += o.amount;
                    tx['assets'][o.asset_id]['i_w']          = true;
                  } else {
                    //TODO: lookup in the address book
                    tx['assets'][o.asset_id]['from'].push(o.address);
                  }
                  
               } else {
                  tx['assets'][o.asset_id]['d_amount'] += o.amount
                  if(o.address in $rootScope.my_addresses) {
                    tx['assets'][o.asset_id]['my_d_amount'] += o.amount
                    tx['assets'][o.asset_id]['i_d']          = true;
                  } else {
                    //TODO: lookup in the address book
                    tx['assets'][o.asset_id]['to'].push(o.address)
                  }
               }
               
             });

             //console.log('salgo del loop con ' + tx['txid']);

             if( tx['txid'] !== undefined) {
               //console.log('mando a cerrar');
               close_tx();
             }

             //console.log('voy a poner txs ' + txs);
             
             $rootScope.transactions=txs;
             if(show_toast == true)
              window.plugins.toast.show( T.i('g.updated'), 'short', 'bottom');
          })
          .error(function(data, status, headers, config) {
             window.plugins.toast.show( T.i('g.unable_to_refresh'), 'long', 'bottom');
          })
          .finally(function() {
             console.log('RefreshBalance: finally...');
             $rootScope.$emit('refresh-done');


              // Creo que NO es al pedo, pero por las dudas cerramos el splash.
              $cordovaSplashscreen.hide();
              
              // FullScreen Config
              var showFullScreen = false, showStatusBar = true;
              ionic.Platform.fullScreen(showFullScreen, showStatusBar);
          });

        });

      });
    };


    $rootScope.connectToEvents = function() {
      $rootScope.ws = new ReconnectingWebSocket('wss://bswws.latincoin.com/events');

      $rootScope.ws.onopen = function () {
        console.log('ONOPEN -> mando subscribe');
        $rootScope.subscribe();
      };

      $rootScope.ws.onmessage = function (event) {
        clearTimeout($rootScope.tid);
        $rootScope.tid = setTimeout( function() { $rootScope.ws.send('ping'); }, 10000);

        if(event.data.indexOf('nb') == 2) {
          //Refresh balance in 100ms, if we get two notifications (Withdraw from two addresses) just refresh once.
          clearTimeout($rootScope.rid);
          $rootScope.rid = setTimeout( function() { $rootScope.$emit('new-balance', event.data); }, 100);
        } 
      };
    }

    $rootScope.subscribe = function() {
      MasterKey.get().then(function(master_key) {
        BitShares.extendedPublicFromPrivate(master_key.key)
          .then(function(extendedPublicKey){
            var sub = extendedPublicKey + ':' + master_key.deriv;
            $rootScope.ws.send('sub ' + sub);
          })
      });
    }

    $rootScope.$on('wallet-changed', function() {

      $rootScope.loadMyAddresses();
      $rootScope.assetChanged();
      $rootScope.subscribe();
    });

    $rootScope.$on('new-balance', function(data) {
      $rootScope.refreshBalance();
    });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider) {

  $translateProvider.useStaticFilesLoader({ prefix: 'static/locale-', suffix: '.json'});

  $stateProvider
    .state('app', {
      url: "/app",
      abstract: true,
      templateUrl: "templates/menu.html",
      controller: 'AppCtrl',
      resolve : {
        'InitDone' : function(BitShares, $ionicPlatform, $cordovaGlobalization, $translate, DB, MasterKey, Address, $rootScope) {

          $rootScope.global_init = function() {

            //HACK: tocar aca hasta que funcione el plugin de device
            $rootScope.platform         = 'Android'; 
            $rootScope.current_balance  = 0;
            $rootScope.asset_id         = 22;
            $rootScope.balance          = {};
            $rootScope.transactions     = [];
            $rootScope.raw_txs          = {};
            $rootScope.my_addresses     = {};
            $rootScope.my_book          = {};
            $rootScope.assets           = {};
            $rootScope.asset            = {};
            
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
            //GET PLATFORM
            //*****************
            .then(function(){
              $rootScope.initPlatform();
            })
            //*****************
            //INIT DB
            //*****************
            .then(function() {
               return DB.init();
            })
            .then(function(lang) {
                console.log('DB initialized OK');
              },
              function(error) {
                console.log('Unable to get initialize DB');
            })
            
            //*****************
            //Load or Create Master key
            //*****************
            .then(function() {
              return MasterKey.get();
            })
            .then(function(master_key) {
              if(master_key !== undefined) {
                console.log('master key present');
                return;
              }
              console.log('creating master key...');

              BitShares.createMasterKey().then(function(mpriv){
                //console.log(' mpriv:'+mpriv);
                BitShares.extractDataFromKey(mpriv).then(function(keyData){
                  //console.log(' keyData.address:'+keyData.address);
                  MasterKey.store(mpriv, -1).then(function() {
                    Address.create(
                      -1, 
                      keyData.address, 
                      keyData.pubkey, 
                      keyData.privkey, 
                      true, 
                      'main');
                  });
                });
              });
             
            },
            function(error) {
              console.log('Unable to initialize master-key' + error);
            })
            
            //*****************
            //Load Assets
            //*****************
            .then(function() {
              return $rootScope.loadAssets();
            })
            
            //****************
            //Load AddressBook
            //****************
            .then(function() {
              return $rootScope.loadAddressBook();
            })
            
            //****************
            //Load MyAddress
            //****************
            .then(function() {
              return $rootScope.loadMyAddresses();
            })
            
            //****************
            //Connect to events
            //****************
            .then(function() {
              $rootScope.connectToEvents();
            })
            
            //****************
            //Refresh Balance
            //****************
            .then(function() {
              $rootScope.refreshBalance();
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
    
    .state('app.account', {
      url: "/settings/account",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.account.html",
          controller: 'AccountCtrl'
        }
      }
    })
    
    .state('app.assets', {
      url: "/settings/assets",
      views: {
        'menuContent' :{
          templateUrl: "templates/settings.assets.html",
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
          templateUrl: "templates/transaction.html",
          controller: 'TxCtrl'
        }
      }
    })

    .state('app.address_book', {
      url: "/address_book",
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
