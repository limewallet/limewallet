angular.module('bit_wallet.controllers', ['bit_wallet.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

})

.controller('BackupCtrl', function(DB_CONFIG, MasterKey, Address, AddressBook, $scope, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaSocialSharing, $cordovaClipboard) {
  
  $scope.backup = {};
  
  $scope.doCopyWallet= function() {
    $cordovaClipboard
      .copy($scope.backup.wallet)
      .then(function () {
        // success
        window.plugins.toast.show( 'Encrypted wallet copied to clipboard', 'long', 'bottom')
      }, function () {
        
      });
  }
  
  $scope.doShareWallet= function() {
      $cordovaSocialSharing
      .share($scope.backup.wallet)
      .then(function(result) {

      }, function(err) {
        window.plugins.toast.show( 'Unable to share encrypted wallet', 'long', 'bottom')
      });
  }
  
  $scope.validatePasswords = function(backup) {

    if(backupForm.backupPassword.value.length == 0) {
      $ionicPopup.alert({
        title: 'Invalid password',
        template: 'Please enter a password'
      }).then(function(res) {

      });
      return;
    }

    if(backupForm.backupPassword.value != backupForm.backupRetypePassword.value)
    {
      var alertPopup = $ionicPopup.alert({
        title: 'Password does not match the confirm password',
        template: 'Type both passwords again'
      });
      alertPopup.then(function(res) {
        //console.log('Thank you for not eating my delicious ice cream cone');
      });
      return;
    }
    
    var alertPopup = $ionicPopup.alert({
        title: 'Backup Wallet',
        template: 'In progress...  <i class="ion-loading-a" data-pack="default" data-tags="spinner, waiting, refresh, animation" data-animation="true"></i>',
        buttons: [],
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
          alertPopup.close();
          $scope.modal.show();
        } else {

          alertPopup.close();
          $ionicPopup.alert({
            title: 'Backup errpr',
            template: 'There was an error trying to backup the wallet'
          }).then(function(res) {

          });
          return;
        }
      }); 

    }, 500);  
  }
  
  $scope.$on('modal.hidden', function(restore) {
    //$state.go('app.home');
    $location.path('/home');
  });
  
  $ionicModal.fromTemplateUrl('settings.backup.show.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  
})

.controller('RestoreCtrl', function($q, $scope, MasterKey, Address, AddressBook, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaClipboard) {
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
    // console.log('mytextarea_container:'+mytextarea_container.css('height'));
    // console.log('new_h:' + new_h);
    // console.log('myform.offsetHeight:'+ myform.prop('offsetHeight'));
    // console.log('divider:'+angular.element( document.querySelector('.item-divider') ).prop('offsetHeight'));
    
  }
  
  $scope.pasteWallet = function(element){
    
    /*restoreForm.restore_wallet.focus();*/
    $cordovaClipboard
      .paste()
      .then(function (result) {
        $scope.restore.wallet = result;
        window.plugins.toast.show( 'Backup pasted', 'short', 'bottom');
      }, function () {
        window.plugins.toast.show( 'An error ocurred while pasting wallet backup', 'long', 'bottom');
      });
  }
  
  $scope.restoreWallet = function(restore){
    if(restoreForm.restore_wallet.value.length == 0) {
      $ionicPopup.alert({
        title: 'Empty backup',
        template: 'Please enter a previously generated backup'
      });
      return;
    }

    $ionicPopup.prompt({
      title            : 'Input password',
      inputType        : 'password',
      inputPlaceholder : 'password',
    }).then(function(password) {

      if(password === undefined)
        return;

      if(password.trim().length == 0) {
        $ionicPopup.alert({
          title: 'Unable to restore',
          template: 'You must enter a valid password'
        });
        return;
      }

      var alertPopup = $ionicPopup.alert({
        title: 'Restoring backup',
        template: 'In progress...  <i class="ion-loading-a" data-pack="default" data-tags="spinner, waiting, refresh, animation" data-animation="true"></i>',
        buttons: [],
      });

      $timeout(function() {
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
          alertPopup.close();
          $ionicPopup.alert({
            title: 'Restore backup error',
            template: 'The backup is invalid'
          });
          return;
        }

        //Input valid, try to restore
        var master_key = ewallet['master_key'];
        master_key.key = CryptoJS.AES.decrypt(master_key.key, password).toString(CryptoJS.enc.Latin1);
        if(master_key.key.length == 0) {
          alertPopup.close();
          $ionicPopup.alert({
            title: 'Restore backup error',
            template: 'Invalid password'
          });
          return;
        }

        MasterKey.store(master_key.key, master_key.deriv)
        .then(function(){
          return Address.deleteAll()
        })
        .then(function() {
          var address = ewallet['address'];
          var prom    = []
          for(var i=0; i<address.length; i++){
            address[i].privkey = CryptoJS.AES.decrypt(address[i].privkey, password).toString(CryptoJS.enc.Latin1);
            var p = Address.create(address[i].deriv, address[i].address, address[i].pubkey, address[i].privkey, address[i].is_default ? true : false, address[i].label);
            prom.push(p);
          }

          return $q.all(prom);
        })
        .then(function() {

          alertPopup.close();
          $ionicPopup.alert({
            title: 'Wallet restored succesfully',
            template: 'The wallet was restored successfuly!'
          })
          .then(function(res) {
            $location.path('/home');
          });

        });

    
      }, 500);  

      console.log('Puso password');
    });
  }
  
})

.controller('AddressesCtrl', function(Address, MasterKey, $scope, $rootScope, $http, $timeout, $ionicActionSheet, $ionicPopup, $cordovaClipboard) {

  $scope.data = {addys:[]}

  $scope.loadAddys = function() {
    Address.all().then(function(addys) {
        $scope.data.addys = addys;
    });
  };

  $scope.loadAddys();
  
  //setTimeout( $scope.loadAddys, 1000);
    
  $scope.newAddr = function(){
    // A confirm dialog
     var confirmPopup = $ionicPopup.confirm({
       title: 'New address',
       template: 'Are you sure you want to add a new address?'
     });
     confirmPopup.then(function(res) {
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
       { text: '<b>Set as default</b>' },
       { text: 'Set label' },
       { text: 'Copy Address' },
       { text: 'Copy Public Key' }
       ],
     cancelText: 'Cancel',
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
          title: 'Set address label',
          inputType: 'text',
          inputPlaceholder: 'put label here',
          cancelText: 'Cancel',
          okText: 'Set label' // String (default: 'OK'). The text of the OK button.
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
            window.plugins.toast.show( (index == 2 ? 'Address' : 'Public key') + ' copied to clipboard', 'long', 'bottom')
          }, function () {
            // error
            //show(message, duration, position)
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
          // scope.$watch('ngSrc', function() {
              // //element.addClass('spinner-hide');
              // console.log('watch');
              // $ionicLoading.hide();
          // });
        }
    };
})

.controller('ReceiveQrcodeCtrl', function($scope, $cordovaClipboard, $cordovaSocialSharing, Address, $stateParams, $http, $ionicNavBarDelegate, $location, $ionicLoading, $timeout, $ionicModal, $ionicPopup) {
  
  $scope.address = $stateParams.address;
  $scope.amount = $stateParams.amount;
  $scope.request = 'bts:'+$scope.address+'/transfer/amount/'+$scope.amount+'/asset/USD';
  $scope.imgurl = 'http://chart.apis.google.com/chart?cht=qr&chs=300x300&chl='+encodeURIComponent($scope.request)+'&chld=H|0'

  console.log('request -> ' + $scope.request);
  console.log('imgurl -> ' + $scope.imgurl);

  $scope.showLoading = function(){
    $ionicLoading.show({
        content: '<i class="icon ion-looping"></i> Loading', //'Generating QRCode!',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 10
    }); 
  }
  $scope.hideLoading = function(){
    $ionicLoading.hide();
  }
  
  $scope.showLoading();
  /*$timeout(function(){
      $ionicLoading.hide();
    },5000);   */
  
  $scope.doShareRecvPayment = function(){
    $cordovaSocialSharing
    .share(null, null, null, $scope.request)
    .then(function(result) {

    }, function(err) {
      window.plugins.toast.show( 'Unable to share payment request', 'long', 'bottom')
    });
  }
  
  $scope.doCopyRecvPayment = function(){
    $cordovaClipboard
      .copy($scope.request)
      .then(function () {
        // success
        window.plugins.toast.show( 'Payment request copied to clipboard', 'long', 'bottom')
      }, function () {
        // error
        //show(message, duration, position)
      });
  }

  $scope.goHome = function() {
    $location.path('/home');
  };
  
})

.controller('ReceiveCtrl', function($scope, Address, $http, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $state) {
  
  $scope.transaction = {amount:''};
  $scope.addNumber = function(number){
    $scope.transaction.amount = $scope.transaction.amount.concat(number);
  }
  
  $scope.addDot = function(){
    if ($scope.transaction.amount.indexOf('.')!=-1)
      return;
    $scope.transaction.amount  = $scope.transaction.amount.concat('.');
  }
  
  $scope.delInput = function(){
    $scope.transaction.amount = $scope.transaction.amount.substring(0, $scope.transaction.amount.length-1);
    return;
  }
  
  $scope.doGenerateQRCodeRecvPayment = function(){
    if(receiveForm.transactionAmount.value=='')
    {
      var alertPopup = $ionicPopup.alert({
         title: 'Invalid amount <i class="fa fa-warning float_right"></i>',
         template: 'The amount entered is invalid',
         okType: 'button-assertive', 
       });
       alertPopup.then(function(res) {
         
       });
       return;
    }
    
    Address.getDefault().then(function(address) {
      var amount = receiveForm.transactionAmount.value;
      console.log('daaaale:'+amount);
      //$location.path('/receive/qrcode/'+address.address+'/'+amount);
      $state.go('app.receive_qrcode', {address:address.address, amount:amount});
    });
  }
    
  $scope.goBack = function() {
    console.log('trying to go back');
    $ionicNavBarDelegate.back();
  };
})

.controller('SendCtrl', function($scope, $q, Scanner, Address, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams) {
  
  $scope.transaction = {message:'Generating Transaction', amount:$stateParams.amount, address:$stateParams.address};
  sendForm.transactionAmount.value = $stateParams.amount;

  console.log('STATE PARAMS ' + $stateParams.amount + ',' + $stateParams.address);

  $scope.scanQR = function() {
    Scanner.scan()
    .then(function(result) {

      //Back button
      if( result.cancelled ) {
        //HACK for android
        if( device.platform == "Android" ) {
          $ionicModal.fromTemplate('').show().then(function() {
            $ionicPopup.alert({ title: 'QR Scan Cancelled', });
          });
        } else {
          $ionicPopup.alert({ title: 'QR Scan Cancelled', });
        }
        return;
      }

      $scope.transaction.address = result.address;
      if(result.amount !== undefined)
      {
        //HACK: 
        $scope.transaction.amount = result.amount;
        sendForm.transactionAmount.value = result.amount;
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
    //console.log(sendForm.transactionAmount.value);
    // A confirm dialog
    var amount = parseInt(parseFloat($scope.transaction.amount)*1e4);
    console.log($scope.transaction.amount + ' => ' + amount);
    if (amount <= 0 )
    {
       var alertPopup = $ionicPopup.alert({
         title: 'Invalid amount <i class="fa fa-warning float_right"></i>',
         template: 'Please input a valid amount',
         okType: 'button-assertive', 
       });
       alertPopup.then(function(res) {
         
       });
       return;
    }
    
    if(!bitcoin.bts.is_valid_address(sendForm.transactionAddress.value))
    {
      var alertPopup = $ionicPopup.alert({
         title: 'Invalid address <i class="fa fa-warning float_right"></i>',
         template: 'Please input a valid address',
         okType: 'button-assertive', 
       });
       alertPopup.then(function(res) {
         
       });
       return;
    }
    
    var confirmPopup = $ionicPopup.confirm({
      title: 'Payment confirmation',
      template: 'Are you sure you want to send $' + $scope.transaction.amount + ' to ' + sendForm.transactionAddress.value + '?'
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
               title: 'Unable to send <i class="fa fa-warning float_right"></i>',
               template: r.error,
               okType: 'button-assertive', 
            })
            .then(function() {
              $scope.sending_modal.hide();
            });
            return;
          }

          $scope.transaction.message = 'Signing Transaction';
          
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
            $scope.transaction.message = 'Sending Transaction';

            url = 'https://bsw.latincoin.com/api/v1/txs/send';
            $http.post(url, r.tx)
            .success(function(r) {
              $scope.sending_modal.hide();
              $location.path('/home');
              window.plugins.toast.show( 'Transaction Sent', 'long', 'bottom')
              $rootScope.transactions.unshift({sign:-1, address:sendForm.transactionAddress.value, addr_name:sendForm.transactionAddress.value, amount:amount/1e4, state:'P'});
              
            })
            .error(function(data, status, headers, config) {
               console.log('error...: '+status);
                var alertPopup = $ionicPopup.alert({
                   title: 'Unable to send <i class="fa fa-warning float_right"></i>',
                   template: 'Server error',
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
                   title: 'Unable to send <i class="fa fa-warning float_right"></i>',
                   template: 'Server error',
                   okType: 'button-assertive', 
                })
                .then(function() {
                  $scope.sending_modal.hide();
                });
        })
        .finally(function() {
           console.log('finally...');
        });


        //$scope.tx_step_index = 1;
        //$scope.doTxSteps();
       } 
        else {
         console.log('You are not sure');
       }
    });
    
  };
  
  $scope.showPopup = function() {
      var myPopup = $ionicPopup.show({
        hardwareBackButtonClose: false,
        backdropClickToClose: false,
        template: '',
        title: 'Payment sent',
        subTitle: 'The payment was sent successfully!',
        scope: $scope,
        buttons: [
          {
            text: 'Ok',
            type: 'button-positive',
          },
        ]
      });
      myPopup.then(function(res) {
        $location.path('/home');
      });
    };
  
  $scope.tx_step_index = 0;
  $scope.doTxSteps = function() {
    //$timeout(function() {
      //if($scope.tx_step_index==4)
      //{
        //$scope.sending_modal.hide();
        //$scope.showPopup();
        //return;
      //}
      //$scope.tx_step_index = $scope.tx_step_index + 1;
      //$scope.doTxSteps();
    //}, 2000);
  }
  
  // Load the modal from the given template URL
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

.controller('HomeCtrl', function(Scanner, AddressBook, $ionicActionSheet, $scope, $state, $http, $ionicModal, $rootScope, $ionicPopup, $timeout, $location, $cordovaBarcodeScanner) {
  
  $scope.scanQR = function() {
    Scanner.scan()
    .then(function(result) {

      //Back button
      if( result.cancelled ) {
        //HACK for android
        if( device.platform == "Android" ) {
          $ionicModal.fromTemplate('').show().then(function() {
            $ionicPopup.alert({ title: 'QR Scan Cancelled', });
          });
        } else {
          $ionicPopup.alert({ title: 'QR Scan Cancelled', });
        }
        return;
      }

      $state.go('app.send', {address:result.address, amount:result.amount});

    }, function(error) {
      window.plugins.toast.show(error, 'long', 'bottom')
    });
  }


  $rootScope.$on('refresh-done', function(event, data) {
    $scope.$broadcast('scroll.refreshComplete');
  });

  $rootScope.$on('address-book-changed', function(event, data) {
    console.log('ppppp add changed');
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

  $scope.showActionSheet = function(tx){

   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Add to address book</b>' },
       { text: 'View details' },
       ],
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
      // Set as default
      if(index==0)
      {
        // load current label
        $ionicPopup.prompt({
          title: 'Save to address book',
          inputType: 'text',
          inputPlaceholder: 'address name',
          cancelText: 'Cancel',
          okText: 'Save'
       }).then(function(name) {
          
          if(name === undefined)
            return;

          AddressBook.add(tx.address, name).then(function() {
            $rootScope.loadAddressBook();
            window.plugins.toast.show(  'Address saved successfully', 'short', 'bottom');
          });
       });

      }
      // Transaction details
      else if(index==1)
      {
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
