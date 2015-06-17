bitwallet_controllers
.controller('BackupCtrl', function(DB_CONFIG, T, $translate, Account, $scope, $http, $timeout, $location, $state, $ionicPopup, $ionicModal, $cordovaSocialSharing, $cordovaClipboard, BitShares, $q, $ionicNavBarDelegate) {
  
  $scope.backup = {};
  
  // Disable and enable form handlers
  $scope.data   = {from_in_progress:false};

  $scope.formInProgress = function(){
    $scope.data.from_in_progress = true;
  }

  $scope.formDone = function(){
    $scope.data.from_in_progress = false; 
  }

  $scope.doCopyWallet = function() {
    // Disable Form
    // $scope.formInProgress();
    $cordovaClipboard
      .copy($scope.backup.wallet_master)
      .then(function () {
        // Enable form
        // $scope.formDone();
        window.plugins.toast.show(T.i('backup.copied_to_clipboard'), 'short', 'bottom');
      }, function () {
        // Enable form
        // $scope.formDone();
        window.plugins.toast.show(T.i('err.unable_to_copy_ew'), 'short', 'bottom');
      });
  }
  
  $scope.doShareWallet= function() {
    // Disable Form
    // $scope.formInProgress();
    
    $cordovaSocialSharing
    .share($scope.backup.wallet_master)
    .then(function(result) {
      // Enable form
      // $scope.formDone();
    }, function(err) {
      // Enable form
      // $scope.formDone();
      window.plugins.toast.show( T.i('err.unable_to_share_ew'), 'short', 'bottom');
    })
  }
  
  $scope.validatePasswords = function(backup) {

    $scope.formInProgress();
    if(backupForm.backupPassword.value.length == 0) {
      $scope.formDone();
      $ionicPopup.alert({
        title    : T.i('err.invalid_password'),
        template : T.i('err.enter_valid_password')
      });

      return;
    }

    if(backupForm.backupPassword.value != backupForm.backupRetypePassword.value)
    {
      $scope.formDone();
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
      
      var my_master_key = {key:'', deriv:0};
      var p = Account.get()
      .then(function(account) {
        //CryptoJS.AES.encrypt(master_key.key, backupForm.backupPassword.value).toString();
        my_master_key.key = account.key;
        my_master_key.deriv = account.deriv;
        return account;
      })
      .then(function(account){
        return BitShares.encryptString(account.key, backupForm.backupPassword.value);
      })
      .then(function(encryptedData){
          my_master_key.key = encryptedData; 
          ewallet['master_key'] = my_master_key;
      })
      .then(function(){
        // HACKO
        return []; //Address.all();
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
        return $q.all(proms2);
      })
      .then(function() {
        ewallet['address'] = ewallet_address;
      })
      .finally(function() {
        //TODO: check for complete ewallet
        if('master_key' in ewallet && 'address' in ewallet) {
          $scope.backup.wallet_master = JSON.stringify(ewallet,  null, '\t');
          //console.log($scope.backup.wallet_master);
          $scope.backup.wallet = $scope.backup.wallet_master;
          alertPopup.close();
          $scope.modal.show();
        } else {
          $ionicPopup.alert({
            title    : T.i('g.backup_wallet'),
            template : T.i('err.backup_error')
          }).then(function(){
            alertPopup.close();
          });
        }
        $scope.formDone();
      }); 

    }, 500);
  }
  
  $scope.$on('modal.hidden', function(restore) {
    //$location.path('/home');
    $location.path('/settings');
    $scope.formDone();
  });
  
  $ionicModal.fromTemplateUrl('settings.backup.show.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
});
