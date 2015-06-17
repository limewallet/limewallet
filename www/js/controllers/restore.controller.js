bitwallet_controllers.controller('RestoreCtrl', function($q, T, Setting, $rootScope, $translate, $scope, Account, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaClipboard, BitShares, $ionicNavBarDelegate, Wallet) {
  
  $scope.restore = {};

  // Disable and enable form handlers
  $scope.data   = {from_in_progress:false};
  
  $scope.formInProgress = function(){
    console.log(' -- formInProgress: Disabled');
    $scope.data.from_in_progress = true;
  }

  $scope.formDone = function(){
    console.log(' -- formDone: Enabled');
    $scope.data.from_in_progress = false; 
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
    
    // Disable form.
    $scope.formInProgress();

    var ewallet = null;
    try {
      ewallet = JSON.parse(restoreForm.restore_wallet.value);
      var b1 = 'master_key' in ewallet;
      var b2 = 'address' in ewallet;
      var b4 = 'version' in ewallet;
      if(!b1 || !b2 || !b4)
        ewallet=null;
    } catch(err) {
      ewallet = null;
    }

    // Si el input no es valido?
    if(ewallet==null)
    {
      // Enable form.
      $scope.formDone();
      
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
      {
        // Enable form.
        $scope.formDone();
        return;
      }

      if(password.trim().length == 0) {
        // Enable form.
        $scope.formDone();

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
        //master_key.key = CryptoJS.AES.decrypt(master_key.key, password).toString(CryptoJS.enc.Latin1);
        BitShares.decryptString(master_key.key, password)
        .then(function(decryptedData){
              master_key.key = decryptedData; 
              return master_key.key;
          }
        )
        .then(function(master_key_value){
          return BitShares.isValidKey(master_key_value)
        })
        .then(function(is_valid_key){
          return Account.storeKey(master_key.key, master_key.deriv);
          }
          ,function(error){
            alertPopup.close();
            $ionicPopup.alert({
              title    : T.i('err.invalid_password'),
              template : T.i('err.enter_valid_password')
            });
            return $q.reject(error);
        })
        .then(function() {
          var prom = [];
          var addys = ewallet['address'];
          angular.forEach(addys, function(addy) {
            var p = BitShares.decryptString(addy.privkey, password).then(
              function(decryptedData){
                if(ewallet.version == 1) {
                  addy.address = 'BTS' + addy.address.substr(4);
                  addy.pubkey  = 'BTS' + addy.pubkey.substr(4);
                }
                return Address.create(addy.deriv, addy.address, addy.pubkey, decryptedData, addy.is_default ? true : false, addy.label, addy.created_at); 
              });
            prom.push(p);
          })
          /*for(var i=0; i<address.length; i++){
            var addy = address[i];
            var p = BitShares.decryptString(addy.privkey, password).then(
              function(decryptedData){
                return Address.create(addy.deriv, addy.address, addy.pubkey, decryptedData, addy.is_default ? true : false, addy.label, addy.created_at); 
              });
            prom.push(p);
          }*/
          
          if(typeof ewallet.default_asset === 'number') {
            //console.log('TomaloNET : ' + ewallet.default_asset);
            var p = Setting.set(Setting.DEFAULT_ASSET, ewallet.default_asset);
            prom.push(p);
          }

          return $q.all(prom);
        })
        .then(function(){
          var p1 = Operation.clear();
          var p2 = ExchangeTransaction.clear();
          return $q.all([p1, p2]);
        })
        .then(function() {
          
          // Check registered account
          setTimeout(function() { $rootScope.global_init(); },0);
          setTimeout(function() {
            var addy = Wallet.getMainAddress();
            Wallet.updateAccountFromNetwork(addy);
          },1500);
          $ionicPopup.alert({
            title: T.i('g.restore_wallet'),
            template: T.i('restore.successful')
          })
          .then(function(res) {
            alertPopup.close();
            //$location.path('/home');
            $location.path('/settings');
          });
        }).finally(function(){
          // Enable form.
          $scope.formDone();
        });
      }, 500);  

    });
  }
});

