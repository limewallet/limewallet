bitwallet_controllers
.controller('BackupCtrl', function(DB_CONFIG, T, $translate, MasterKey, Address, AddressBook, $scope, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaSocialSharing, $cordovaClipboard, BitShares, $q, $ionicNavBarDelegate) {
  
  $scope.backup = {};
  
  $scope.doCopyWallet = function() {
    $cordovaClipboard
      .copy($scope.backup.wallet_master)
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
      .share($scope.backup.wallet_master)
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
    
    var ewallet_address = [];
    $timeout(function() {

      var ewallet = {version:DB_CONFIG.version}
      
      var my_master_key = [];
      var p = MasterKey.get()
      .then(function(master_key) {
        //CryptoJS.AES.encrypt(master_key.key, backupForm.backupPassword.value).toString();
        my_master_key = master_key;
        return master_key;
      })
      .then(function(master_key){
        return BitShares.encryptString(master_key.key, backupForm.backupPassword.value);
      })
      .then(function(encryptedData){
          my_master_key.key = encryptedData; 
          ewallet['master_key'] = my_master_key;
      })
      .then(function(){
        return Address.all();
      })
      .then(function(addys) {
        var proms2 = [];
        angular.forEach(addys, function(addy) {
          var p2 = BitShares.encryptString(addy.privkey, backupForm.backupPassword.value).then(
            function(encryptedData){
              addy['privkey'] = encryptedData;
              ewallet_address.push(addy);
            }); 
          proms2.push(p2);
        });
        
        /*for(var i=0; i<addys.length; i++) {
          //addys[i].privkey = CryptoJS.AES.encrypt(addys[i].privkey, backupForm.backupPassword.value).toString();
          var addy = addys[i];
          console.log('--backup address:'+addy.label + ' - ' + addy.address);
          var p2 = BitShares.encryptString(addy.privkey, backupForm.backupPassword.value).then(
            function(encryptedData){
              addy.privkey = encryptedData;
              console.log('--backup address inside promise:'+addy.label + ' - ' + addy.address + ' - ' + encryptedData);
              ewallet_address.push(addy);
            }); 
          proms2.push(p2);
        }*/
        return $q.all(proms2);
        
      })
      .then(function() {
        ewallet['address'] = ewallet_address;
        return AddressBook.all();
      })
      .then(function(contacts){
        ewallet['address_book'] = contacts;
      })
      .finally(function() {
        //TODO: check for complete ewallet
        if('master_key' in ewallet && 'address' in ewallet && 'address_book' in ewallet) {
          $scope.backup.wallet_master = JSON.stringify(ewallet,  null, '\t');
          //console.log($scope.backup.wallet_master);
          $scope.backup.wallet = $scope.backup.wallet_master;
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
    //$location.path('/home');
    $location.path('/settings');
  });
  
  $ionicModal.fromTemplateUrl('settings.backup.show.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
});
