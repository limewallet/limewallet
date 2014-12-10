angular.module('bit_wallet.controllers', ['bit_wallet.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.controller('BackupCtrl', function(DB_CONFIG, T, $translate, MasterKey, Address, AddressBook, $scope, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaSocialSharing, $cordovaClipboard) {
  
  $scope.backup = {};
  
  $scope.doCopyWallet = function() {
    $cordovaClipboard
      .copy($scope.backup.wallet)
      .then(function () {
        //success
        window.plugins.toast.show(T.i('backup.copied_to_clipboard'), 'short', 'bottom');
      }, function () {
        //error
        window.plugins.toast.show(T.i('err.unable_to_copy_ew'), 'short', 'bottom');
      });
  }
  
  $scope.doShareWallet= function() {
      $cordovaSocialSharing
      .share($scope.backup.wallet)
      .then(function(result) {

      }, function(err) {
        window.plugins.toast.show( T.i('err.unable_to_share_ew'), 'short', 'bottom')
      });
  }
  
  $scope.validatePasswords = function(backup) {

    if(backupForm.backupPassword.value.length == 0) {
      $ionicPopup.alert({
        title    : T.i('err.invalid_password'),
        template : T.i('err.enter_valid_password')
      });
      return;
    }

    if(backupForm.backupPassword.value != backupForm.backupRetypePassword.value)
    {
      $ionicPopup.alert({
        title    : T.i('err.password_mismatch'),
        template : T.i('err.retype_passwords')
      });
      return;
    }

    var alertPopup = $ionicPopup.alert({
      title    : T.i('backup.backing_up_wallet'),
      template : T.i('g.in_progress') + ' <i class="ion-loading-a" data-pack="default" data-tags="spinner, waiting, refresh, animation" data-animation="true"></i>',
    });

    $timeout(function() {

      var ewallet = {version:DB_CONFIG.version}

      MasterKey.get()
      .then(function(master_key) {
        master_key.key = CryptoJS.AES.encrypt(master_key.key, backupForm.backupPassword.value).toString();
        ewallet['master_key'] = master_key;
        return Address.all();
      })
      .then(function(addys) {
        for(var i=0; i<addys.length; i++) {
          addys[i].privkey = CryptoJS.AES.encrypt(addys[i].privkey, backupForm.backupPassword.value).toString();
        }
        ewallet['address'] = addys;
        return AddressBook.all();
      })
      .then(function(contacts) {
        ewallet['address_book'] = contacts;
      })
      .finally(function() {
        //TODO: check for complete ewallet
        if('master_key' in ewallet && 'address' in ewallet && 'address_book' in ewallet) {
          $scope.backup.wallet = JSON.stringify(ewallet,  null, '\t');
          console.log($scope.backup.wallet);
          alertPopup.close();
          $scope.modal.show();
        } else {
          $ionicPopup.alert({
            title    : T.i('menu.backup_wallet'),
            template : T.i('err.backup_error')
          }).then(function(){
            alertPopup.close();
          });
          return;
        }
      }); 

    }, 500);
  }
  
  $scope.$on('modal.hidden', function(restore) {
    $location.path('/home');
  });
  
  $ionicModal.fromTemplateUrl('settings.backup.show.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  
})

.controller('RestoreCtrl', function($q, T, $rootScope, $translate, $scope, MasterKey, Address, AddressBook, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaClipboard) {
  $scope.restore = {};

  window.addEventListener('native.keyboardhide', keyboardHideHandler);
  function keyboardHideHandler(e){
    e.preventDefault();
    var myform = angular.element( document.querySelector( '.restoreForm' ) );
    myform.css('bottom', "65px");
    $scope.calculateH();
  }
  
  $scope.calculateH = function(){
    var myform = angular.element( document.querySelector( '.restoreForm' ) );
    var mytextarea_container = angular.element( document.querySelector( '.textarea_container' ) );
    var new_h = myform.prop('offsetHeight') - angular.element( document.querySelector( '.item-divider' ) ).prop('offsetHeight') - 20;
    mytextarea_container.css('height', new_h + "px");
  }
  $scope.calculateH();
  
  window.addEventListener('native.keyboardshow', keyboardShowHandler);
  function keyboardShowHandler(e){
    e.preventDefault();
    
    var myform = angular.element( document.querySelector( '.restoreForm' ) );
    myform.css('bottom', e.keyboardHeight + "px");
    console.log('Keyboard height is: ' + e.keyboardHeight);
    var mytextarea_container = angular.element( document.querySelector( '.textarea_container' ) );
    var new_h = myform.prop('offsetHeight') - angular.element( document.querySelector( '.item-divider' ) ).prop('offsetHeight') - 20;
    mytextarea_container.css('height', new_h + "px");
  }
  
  $scope.pasteWallet = function(element) {
    $cordovaClipboard
      .paste()
      .then(function (result) {
        //success
        $scope.restore.wallet = result;
      }, function () {
        //error
        window.plugins.toast.show( T.i('err.unable_to_paste_ew'), 'short', 'bottom');
      });
  }
  
  $scope.restoreWallet = function(restore){

    var ewallet = null;
    try {
      ewallet = JSON.parse(restoreForm.restore_wallet.value);
      var b1 = 'master_key' in ewallet;
      var b2 = 'address' in ewallet;
      var b3 = 'address_book' in ewallet;
      if(!b1 || !b2 || !b3)
        ewallet=null;
    } catch(err) {
      ewallet = null;
    }

    // Si el input no es valido?
    if(ewallet==null)
    {
      $ionicPopup.alert({
        title    : T.i('err.invalid_backup'),
        template : T.i('err.enter_valid_backup')
      });
      return;
    }

    $ionicPopup.prompt({
      title            : T.i('g.input_password'),
      inputPlaceholder : T.i('g.password'),
      inputType        : 'password',
    }).then(function(password) {

      if(password === undefined)
        return;

      if(password.trim().length == 0) {
        $ionicPopup.alert({
          title    : T.i('err.empty_password'),
          template : T.i('err.enter_valid_password')
        });
        return;
      }

      var alertPopup = $ionicPopup.alert({
        title      : T.i('restore.restoring_wallet'),
        template   : T.i('g.in_progress') + ' <i class="ion-loading-a" data-pack="default" data-tags="spinner, waiting, refresh, animation" data-animation="true"></i>',
        buttons: [],
      });

      $timeout(function() {
        //Input valid, try to restore
        var master_key = ewallet['master_key'];
        master_key.key = CryptoJS.AES.decrypt(master_key.key, password).toString(CryptoJS.enc.Latin1);
        var valid = false;
        try {
          bitcoin.HDNode.fromBase58(master_key.key);
          valid = true;
        } catch (err) {

        }

        if(!valid) {
          alertPopup.close();
          $ionicPopup.alert({
            title    : T.i('err.invalid_password'),
            template : T.i('err.enter_valid_password')
          });
          return;
        }

        MasterKey.store(master_key.key, master_key.deriv)
        .then(function(){
          var prom    = [Address.deleteAll()];
          var address = ewallet['address'];

          for(var i=0; i<address.length; i++){
            address[i].privkey = CryptoJS.AES.decrypt(address[i].privkey, password).toString(CryptoJS.enc.Latin1);
            var p = Address.create(address[i].deriv, address[i].address, address[i].pubkey, address[i].privkey, address[i].is_default ? true : false, address[i].label, address[i].created_at);
            prom.push(p);
          }
        
          var address_book = ewallet['address_book'];
          for(var i=0; i<address_book.length; i++){
            var p = AddressBook.add(address_book[i].name, address_book[i].address, address_book[i].is_favorite);
            prom.push(p);
          }

          return $q.all(prom);
        })
        .then(function() {
          $rootScope.$emit('wallet-changed');
          $ionicPopup.alert({
            title: T.i('menu.restore_wallet'),
            template: T.i('restore.successful')
          })
          .then(function(res) {
            alertPopup.close();
            $location.path('/home');
          });
        });
      }, 500);  

    });
  }
  
})

.controller('AccountCtrl', function($translate, T, Address, MasterKey, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard) {

  $scope.data = {addys:[]}

  $scope.loadAddys = function() {
    Address.all().then(function(addys) {
        $scope.data.addys = addys;
    });
  };

  $scope.loadAddys();
    
  $scope.newAddr = function(){
     // A confirm dialog
     var confirmPopup = $ionicPopup.confirm({
       title    : T.i('addys.new_address'),
       template : T.i('addys.are_you_sure'),
     }).then(function(res) {

      if(!res)
        return;

      MasterKey.get().then(function(master_key) {
        master_key.deriv = parseInt(master_key.deriv)+1;

        var hdnode = bitcoin.HDNode.fromBase58(master_key.key);
        var nkey = hdnode.derive(master_key.deriv);
        var privkey = nkey.privKey;
        var pubkey  = nkey.pubKey.toBuffer();

        MasterKey.store(master_key.key, master_key.deriv).then(function() {
          Address.create(master_key.deriv, 
                         bitcoin.bts.pub_to_address(pubkey), 
                         bitcoin.bts.encode_pubkey(pubkey), 
                         privkey.toWIF(), 
                         false, '').then(function(){
            $scope.loadAddys();
            $rootScope.$emit('wallet-changed');
          });
        });
      });
     });
  }
  
  $scope.showActionSheet = function(addr){
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('addys.set_as_default')+'</b>' },
       { text: T.i('addys.set_label') },
       { text: T.i('addys.copy_address') },
       { text: T.i('addys.copy_public_key') }
       ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // Set as default
      if(index==0)
      {
        Address.setDefault(addr.id).then(function() {
          $scope.loadAddys();
        });
      }
      // Set label
      else if(index==1)
      {
        // load current label
        $ionicPopup.prompt({
          title            : T.i('addys.set_label'),
          inputPlaceholder : T.i('g.label'),
          inputType        : 'text',
          cancelText       : T.i('g.cancel')
       }).then(function(label) {
          if(label === undefined)
            return;
          Address.setLabel(addr.id, label).then(function() {
            $scope.loadAddys();
          });
       });
      }
      // Copy to clipboard
      else if(index==2 || index==3)
      {
        $cordovaClipboard
          .copy(index==2 ? addr.address : addr.pubkey)
          .then(function () {
            // success
            window.plugins.toast.show( (index == 2 ? T.i('g.address') : T.i('g.public_key')) + ' ' + T.i('g.copied_to_clipboard'), 'short', 'bottom')
          }, function () {
            // error

          });
      }
      return true;
     }
   });
  }
  
})

.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
          element.on('load', function() {
            scope.hideLoading();
          });
        }
    };
})

.controller('ReceiveQrcodeCtrl', function($scope, T, $cordovaClipboard, $cordovaSocialSharing, Address, $stateParams, $http, $ionicNavBarDelegate, $location, $ionicLoading, $timeout, $ionicModal, $ionicPopup) {
  
  $scope.address = $stateParams.address;
  $scope.amount  = $stateParams.amount;
  $scope.request = 'bts:'+$scope.address+'/transfer/amount/'+$scope.amount+'/asset/USD';
  $scope.imgurl  = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.request)+'&chld=H|0'

  console.log('request -> ' + $scope.request);
  console.log('imgurl -> ' + $scope.imgurl);

  $scope.showLoading = function(){
    $ionicLoading.show({
      template     : '<i class="icon ion-looping"></i> ' + T.i('g.loading'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200,
      showDelay    : 10
    }); 
  }

  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.showLoading();
  
  $scope.doShareRecvPayment = function(){
    $cordovaSocialSharing
    .share(null, null, null, $scope.request)
    .then(function(result) {
      // success

    }, function(err) {
      // error
      window.plugins.toast.show( T.i('err.unable_to_share_req'), 'long', 'bottom')
    });
  }
  
  $scope.doCopyRecvPayment = function(){
    $cordovaClipboard
      .copy($scope.request)
      .then(function () {
        // success
        window.plugins.toast.show( T.i('receive.copied_to_clipboard'), 'long', 'bottom')
      }, function () {
        // error
        window.plugins.toast.show( T.i('err.unable_to_copy_req'), 'long', 'bottom')
      });
  }

  $scope.goHome = function() {
    $location.path('/home');
  };
  
})

.controller('ReceiveCtrl', function($scope, T, Address, $http, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $state) {
  
  $scope.doGenerateQRCodeRecvPayment = function(){

    var amount = parseInt(parseFloat(receiveForm.transactionAmount.value)*1e4);
    if( isNaN(amount) || amount <= 0 ) {
      $ionicPopup.alert({
        title    : T.i('err.invalid_amount')+' <i class="fa fa-warning float_right"></i>',
        template : T.i('err.enter_valid_amount'),
        okType   : 'button-assertive',
      });
      return;
    }

    Address.getDefault().then(function(address) {
      var amount = receiveForm.transactionAmount.value;
      $state.go('app.receive_qrcode', {address:address.address, amount:amount});
    });

  }
    
  $scope.goBack = function() {
    console.log('trying to go back');
    $ionicNavBarDelegate.back();
  };
})

.controller('ImportPrivCtrl', function($scope, T, $q, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams) {
  
  $scope.showLoading = function(){
    $ionicLoading.show({
      template      : '<i class="icon ion-looping"></i> ' + T.i('import_priv.loading_balance'),
      animation    : 'fade-in',
      showBackdrop : true,
      maxWidth     : 200
      //showDelay    : 0
    }); 
  }

  $scope.showLoading();
  
  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.getImportedKeyBalance = function(addr){
    var url = 'https://bsw.latincoin.com/api/v1/addrs/' + addr + '/balance';
    $http.get(url)
    .success(function(r) {
      var total = 0;
      if(r.error=== undefined)
      {
        r.balances.forEach(function(b){
          //TODO: just USD for now
          if(b.asset_id == 22)
            total += b.amount;
          });
      }
      else
      {
        $timeout(function () {
          /* Commented for testing purposes. */
          $location.path('/home');
          window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        }, 500);
      }
      $scope.imported_pk.amount = total/1e4;
    })
    .error(function(data, status, headers, config) {
      $timeout(function () {
          $location.path('/home');
          window.plugins.toast.show( T.i('err.unable_pw_balance'), 'long', 'bottom');
        }, 500);
    })
    .finally(function() {
      $rootScope.$emit('refresh-done');
      $scope.hideLoading();
    });
  }
  
  $scope.goBack = function() {
    console.log('trying to go back SendCtrl');
    $ionicNavBarDelegate.back();
  };
  
  $scope.sweepBalance = function(){
    
    var fee=250;
    var amount = parseInt(parseFloat($scope.imported_pk.amount)*1e4);
    console.log($scope.imported_pk.amount + ' => ' + amount);
    if ( isNaN(amount) || amount <= 0 ) {
       $ionicPopup.alert({
         title    : T.i('err.empty_paper_wallet') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.paper_no_balance'),
         okType   : 'button-assertive', 
       });
       return;
    }
    amount = amount - fee;
    
    Address.getDefault().then(function(my_default_address) {
      
      $scope.sweeping_modal.show();
      var from  = [{'address':$scope.imported_pk.address}];
      var tx_req = {
        "asset" : 22,
        "fee"   : fee,
        "from"  : from,
        "to"    : [{
            "address" : my_default_address.address,
            "amount"  : amount
        }]
      }

      console.log('voy a llamar a new en sweeping');

      var url = 'https://bsw.latincoin.com/api/v1/txs/new';
      $http.post(url, tx_req)
      .success(function(r) {
        if(r.error !== undefined) {
          console.log('There where errors ' + r.error);
          var alertPopup = $ionicPopup.alert({
             title: T.i('err.unable_to_create_tx') + ' <i class="fa fa-warning float_right"></i>',
             template: r.error,
             okType: 'button-assertive', 
          })
          .then(function() {
            $scope.sweeping_modal.hide();
          });
          return;
        }

        $scope.sweeping.message = 'send.signing_transaction';
        
        console.log(r.tx);
        console.log(r.to_sign);
        console.log(r.required_signatures);

        r.tx.signatures = [];

        //HACK: expose Buffer
        Buffer = bitcoin.ECKey.curve.n.toBuffer().constructor;
        var to_sign = new Buffer(r.to_sign, 'hex')
         
        var priv = bitcoin.ECKey.fromWIF($scope.imported_pk.priv_key); // Si ya viene en format Wif
        var signature = bitcoin.ecdsa.sign(bitcoin.ECKey.curve, to_sign, priv.d);
        var i = bitcoin.ecdsa.calcPubKeyRecoveryParam(bitcoin.ECKey.curve, priv.d.constructor.fromBuffer(to_sign), signature, priv.pub.Q);
        var compact = signature.toCompact(i, priv.pub.compressed).toString('hex');
        console.log(compact);
        r.tx.signatures.push(compact);

        console.log('firmado .. mandando'); 
        $scope.sweeping.message = 'send.sending_transaction';

        url = 'https://bsw.latincoin.com/api/v1/txs/send';
        $http.post(url, r.tx)
        .success(function(r) {
          $scope.sweeping_modal.hide();
          $location.path('/home');
          window.plugins.toast.show( T.i('import_priv.transaction_sent'), 'long', 'bottom')
          //$rootScope.transactions.unshift({sign:-1, address:imported_address, addr_name:'Paper Wallet', amount:amount/1e4, state:'P', date: new Date().getTime()});
        })
        .error(function(data, status, headers, config) {
           console.log('error...: '+status);
            var alertPopup = $ionicPopup.alert({
               title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
               template: T.i('err.server_error'),
               okType: 'button-assertive', 
            })
            .then(function() {
              $scope.sweeping_modal.hide();
            });
        })
        .finally(function() {
           console.log('finally...');
        });

      })
      .error(function(data, status, headers, config) {
         console.log('error...: '+status);
           var alertPopup = $ionicPopup.alert({
              title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
              template: T.i('err.server_error'),
              okType: 'button-assertive', 
           })
          .then(function() {
            $scope.sweeping_modal.hide();
          });
      })
      .finally(function() {
         console.log('finally...');
      });
      
    });
  }
  
  // Load sweeping modal
  $ionicModal.fromTemplateUrl('sweeping-modal.html', function($ionicModal) {
      $scope.sweeping_modal = $ionicModal;
  }, {
      // Use our scope for the scope of the modal to keep it simple
      scope: $scope,
      // The animation we want to use for the modal entrance
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
  });
  
  /* Initialization */
  // ToDo: Resolver $scope.imported_pk.address
  
  $scope.imported_pk = {amount:{}, priv_key:'NOT_AVAILABLE', address:'NOT_AVAILABLE'};
  $scope.sweeping = {message:'send.generating_transaction'};
  
  $scope.imported_pk.priv_key = $stateParams.private_key;
  $scope.imported_pk.address = bitcoin.bts.wif_to_address($scope.imported_pk.priv_key);

  console.log('llamandi a getImportedKeyBalance');
  $timeout( function() { 
    $scope.getImportedKeyBalance($scope.imported_pk.address);
  }, 1000);
})

.controller('SendCtrl', function($scope, $q, T, AddressBook, Scanner, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams) {
  
  $scope.data = {address_book:[]};
  var amount = 0;
  if (!angular.isUndefined($stateParams.amount))
    amount = $stateParams.amount;
    
  var address = '';
  if (!angular.isUndefined($stateParams.address))
    address = $stateParams.address;
    
  $scope.transaction = {message:'send.generating_transaction', amount:amount, address:address};
  sendForm.transactionAmount.value = amount;
  sendForm.transactionAddress.value = address;

  //console.log('STATE PARAMS ' + $stateParams.amount + ',' + $stateParams.address);

  $scope.showAddressBook = function(){
    $scope.address_book_modal.show();
  }
  
  $scope.loadAddressBook = function() {
    AddressBook.all().then(function(addr_book) {
        $scope.data.address_book = addr_book;
    });
  };

  $scope.loadAddressBook();
  
  $scope.selectContact = function(contact){
    $scope.address_book_modal.hide();
    sendForm.transactionAddress.value = contact.address;
    $scope.transaction.address = contact.address;
  }
  
  $scope.scanQR = function() {
    Scanner.scan()
    .then(function(result) {
      if( !result.cancelled ) {

        //Pubkey scanned
        if(result.pubkey !== undefined) {
          $scope.transaction.address = bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(result.pubkey));
          console.log($scope.transaction.address);
          return;
        }
        
        //Wif scanned ... think
        //if(result.privkey !== undefined) {
          //$scope.transaction.address = bitcoin.bts.wif_to_address(result.privkey);
          //console.log($scope.transaction.address);
          //return;
        //}

        $scope.transaction.address = result.address;
        if(result.amount !== undefined)
        {
          //HACK: 
          $scope.transaction.amount = result.amount;
          sendForm.transactionAmount.value = result.amount;
        }
      }

    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }
  
  $scope.goBack = function() {
    console.log('trying to go back SendCtrl');
    $ionicNavBarDelegate.back();
  };
  
  $scope.validateSend = function(transaction) {

    var amount = parseInt(parseFloat($scope.transaction.amount)*1e4);
    console.log($scope.transaction.amount + ' => ' + amount);
    if ( isNaN(amount) || amount <= 0 ) {
       $ionicPopup.alert({
         title    : T.i('err.invalid_amount') + ' <i class="fa fa-warning float_right"></i>',
         template : T.i('err.enter_valid_amount'),
         okType   : 'button-assertive', 
       });
       return;
    }
    
    if(!bitcoin.bts.is_valid_address(sendForm.transactionAddress.value)) {
      $ionicPopup.alert({
        title    : T.i('err.invalid_address') + ' <i class="fa fa-warning float_right"></i>',
        template : T.i('err.enter_valid_address'),
        okType   : 'button-assertive',
      });
      return;
    }
    
    var confirmPopup = $ionicPopup.confirm({
      title    : T.i('send.payment_confirm'),
      template : T.i('send.are_you_sure',{symbol:'$',amount:$scope.transaction.amount,address:sendForm.transactionAddress.value})
    });

    confirmPopup.then(function(res) {
      if(res) {
        $scope.sending_modal.show();

        var from  = [];
        var addys = Object.keys($rootScope.my_addresses);
        for(var i=0; i<addys.length; i++) {
          from.push({"address":addys[i]});
        }
      
        var tx_req = {
          "asset" : 22,
          "fee"   : 250,
          "from"  : from,
          "to"    : [{
              "address" : sendForm.transactionAddress.value,
              "amount"  : amount
          }]
        }

        var url = 'https://bsw.latincoin.com/api/v1/txs/new';
        $http.post(url, tx_req)
        .success(function(r) {
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

          //HACK: expose Buffer
          Buffer = bitcoin.ECKey.curve.n.toBuffer().constructor;
          var to_sign = new Buffer(r.to_sign, 'hex')
           
          var prom = [];
          angular.forEach(r.required_signatures, function(req_addy) {
            var p = Address.by_address(req_addy).then(function(addy) {
              console.log(addy.address);
              var priv = bitcoin.ECKey.fromWIF(addy.privkey);
              var signature = bitcoin.ecdsa.sign(bitcoin.ECKey.curve, to_sign, priv.d);
              var i = bitcoin.ecdsa.calcPubKeyRecoveryParam(bitcoin.ECKey.curve, priv.d.constructor.fromBuffer(to_sign), signature, priv.pub.Q);
              var compact = signature.toCompact(i, priv.pub.compressed).toString('hex');
              console.log(compact);
              r.tx.signatures.push(compact);
            });
            prom.push(p);
          });

          $q.all(prom).then(function() {
            console.log('firmado .. mandando'); 
            $scope.transaction.message = 'send.sending_transaction';

            url = 'https://bsw.latincoin.com/api/v1/txs/send';
            $http.post(url, r.tx)
            .success(function(r) {
              $scope.sending_modal.hide();
              $location.path('/home');
              window.plugins.toast.show( T.i('send.transaction_sent'), 'long', 'bottom')
              $rootScope.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/1e4, state:'P', date: new Date().getTime()});
              
            })
            .error(function(data, status, headers, config) {
               console.log('error...: '+status);
                var alertPopup = $ionicPopup.alert({
                   title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                   template: T.i('err.server_error'),
                   okType: 'button-assertive', 
                })
                .then(function() {
                  $scope.sending_modal.hide();
                });
            })
            .finally(function() {
               console.log('finally...');
            });

             
          });

        })
        .error(function(data, status, headers, config) {
           console.log('error...: '+status);
             var alertPopup = $ionicPopup.alert({
                title: T.i('err.unable_to_send_tx') + ' <i class="fa fa-warning float_right"></i>',
                template: T.i('err.server_error'),
                okType: 'button-assertive', 
             })
            .then(function() {
              $scope.sending_modal.hide();
            });
        })
        .finally(function() {
           console.log('finally...');
        });

       } 
        else {
         console.log('You are not sure');
       }
    });
    
  };
  
  // Load Address book modal
  $ionicModal.fromTemplateUrl('address-book-modal.html', function($ionicModal) {
      $scope.address_book_modal = $ionicModal;
  }, {
      // Use our scope for the scope of the modal to keep it simple
      scope: $scope,
      // The animation we want to use for the modal entrance
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
  });
  
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
})

.controller('AddressBookCtrl', function($scope, T, $ionicPopup, $ionicActionSheet, AddressBook, $rootScope, $ionicNavBarDelegate, $stateParams){

  $scope.data = {addys:[]}

  $scope.loadAddys = function() {
    AddressBook.all().then(function(addys) {
        $scope.data.addys = addys;
    });
  };

  $scope.loadAddys();

  $scope.showActionSheet = function(addr){
    var fav_text = 'book.add_to_fav';
    if(addr.is_favorite)
      fav_text = 'book.remove_from_fav';

   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i(fav_text)+'</b>' },
       { text: T.i('g.remove') },
       ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // Set as favorite
      if(index==0)
      {
        var fav = addr.is_favorite ? 0 : 1;
        console.log('mandamos: ' + addr.id + '->' + fav);
        AddressBook.setFavorite(addr.id, fav).then(function() {
          $scope.loadAddys();
        });
      }
      // Remove from address book
      else if(index==1)
      {
          // load current label
         var confirmPopup = $ionicPopup.confirm({
           title    : T.i('book.remove_from_ab'),
           template : T.i('book.remove_sure', {'name':addr.name}),
         }).then(function(res) {
          if(!res)
            return;
            AddressBook.remove(addr.id).then(function() {
              $scope.loadAddys();
            });
         });
      }
      return true;
     }
   });
  }

})

.controller('TxCtrl', function($scope, $rootScope, $ionicNavBarDelegate, $stateParams){

  $scope.ops = $rootScope.raw_txs[$stateParams.tx_id];
  $scope.getWithdraws = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='w')
        ops.push(op);
    })
    return ops;
  }
  $scope.getDeposits = function(){
    var ops = [];
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        ops.push(op);
    })
    return ops;
  }
  $scope.getFee = function(){
    var fee = 0;
    angular.forEach($scope.ops, function(op){
      if(op.op_type=='d')
        fee=fee-op.amount;
      else
        fee=fee+op.amount;
    })
    return fee/1e4;
  }
  $scope.goBack = function() {
    $ionicNavBarDelegate.back();
  };
})

.controller('HomeCtrl', function(T, Scanner, AddressBook, $ionicSlideBoxDelegate, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, $cordovaBarcodeScanner) {
  
  $scope.scanQR = function() {

    Scanner.scan()
    .then(function(result) {
      if( !result.cancelled ) {

        if(result.privkey !== undefined)
        {
          $state.go('app.import_priv', {private_key:result.privkey});
          return;
        }

        //Pubkey scanned
        if(result.pubkey !== undefined) {
          result.address = bitcoin.bts.pub_to_address(bitcoin.bts.decode_pubkey(result.pubkey));
        }

        $state.go('app.send', {address:result.address, amount:result.amount});
      }
    }, function(error) {
      
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }


  $scope.bitAssetHasChanged = function(index){
    // cambiar asset en lista
  }
  $rootScope.$on('refresh-done', function(event, data) {
    $scope.$broadcast('scroll.refreshComplete');
  });

  $rootScope.$on('address-book-changed', function(event, data) {
    var txs = [];
    angular.copy($rootScope.transactions, txs);
    for(var i=0; i<txs.length; i++) {
       
       if(txs[i]['addr_name'] != 'Me')
       {
         if( txs[i]['address'] in $rootScope.my_book )
          txs[i]['addr_name'] = $rootScope.my_book[txs[i]['address']].name;
         else
          txs[i]['addr_name'] = txs[i]['address'];
       }
       console.log('ADDRNAME => ' + txs[i]['addr_name']);
    }
    
    $rootScope.transactions = txs;
  });

  $scope.showActionSheet = function(tx) {
    var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('home.add_to_book')+'</b>' },
       { text: T.i('home.view_details') },
     ],
     cancelText: T.i('g.cancel'),
     cancel: function() {
          // add cancel code..
     },
     buttonClicked: function(index) {
       // Add to addressbook
       if(index==0) {
         // load current label
         $ionicPopup.prompt({
           title: T.i('home.add_to_book'),
           inputType: 'text',
           inputPlaceholder: T.i('home.address_name'),
           cancelText: T.i('g.cancel'),
           okText: T.i('g.save')
         }).then(function(name) {

           if(name === undefined)
              return;

           AddressBook.add(tx.address, name).then(function() {
             $rootScope.loadAddressBook();
             window.plugins.toast.show( T.i('home.save_successfull'), 'short', 'bottom');
           });

         });
      }
      // View transaction details
      else if(index==1) {
        $state.go('app.transaction_details', {tx_id:tx['tx_id']});
      }
      return true;
     }
   });
  }

  $scope.go = function ( path ) {
    console.log('location:'+path);
    $timeout(function () {
      $location.path(path);
    });
  };

  $scope.doRefresh = function() {
    $rootScope.refreshBalance(true);
  };
  
  $scope.loadMore = function() {
    //$scope.$broadcast('scroll.infiniteScrollComplete');
    return;
  };

  $scope.$on('$stateChangeSuccess', function() {
    //return;
    $scope.loadMore();
  });
  
  $scope.moreDataCanBeLoaded = function() {
    return false;
  };
  
});
