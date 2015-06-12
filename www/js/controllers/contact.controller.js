bitwallet_controllers
.controller('ContactCtrl', function($scope, $state, BitShares, T, $ionicPopup, $timeout, $stateParams){
  
  $scope.data = {
    from_in_progress  : true,
    contact           : {},
    watch_name        : undefined,
    title             : ''
  };

  var contact = $stateParams.contact;
  if(contact && contact.name) {
    console.log(' -------- Contact -> ONE param received!');
    $scope.data.title = T.i('contacts.edit_contact');
    //$scope.applyContact(contact);
    $scope.data.contact = contact;
    BitShares.sha256(contact.name).then(function(hash){
      $scope.data.contact.avatar_hash = hash;
      $timeout(function () { jdenticon(); }, 200);
      $scope.from_in_progress=false;
    }, function(err){
      $scope.from_in_progress=false;
    });
  }
  else
  {  
    console.log(' -------- Contact -> NO param received!');
    $scope.data.title = T.i('contacts.add_contact');
    BitShares.sha256('').then(function(hash){
      $scope.data.contact.avatar_hash = hash;
      $timeout(function () { jdenticon(); }, 200);
      $scope.from_in_progress=false;
    }, function(err){
      $scope.from_in_progress=false;
    });
  }

  var name_timeout = undefined;
  $scope.$watch('data.contact.name', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;
    if(name_timeout)
    {
      $timeout.cancel(name_timeout);
      name_timeout = undefined;
    }
    name_timeout = $timeout(function () {
      $scope.data.watch_name  = newValue;
      BitShares.sha256(newValue).then(function(hash){
        $scope.data.contact.avatar_hash = hash;
        $timeout(function () { jdenticon(); }, 200);
      }, function(err){
        console.log('error sha256 account.constroller '+JSON.stringify(err));
      })
    }, 750);
  });

  $scope.saveOrUpdate = function(){

    
    if(!$scope.data.contact.name)
    {
      $scope.showAlert('err.contact_name_empty', 'err.contact_name_empty_msg');
      return;
    }

    if(!$scope.data.contact.address && !$scope.data.contact.pubkey)
    {
      $scope.showAlert('err.contact_addr_pk_empty', 'err.contact_addr_pk_empty_msg');
      return;
    }

    proms = { 
      'address' : $scope.data.contact.address?BitShares.btsIsValidAddress($scope.data.contact.address):undefined,
      'pubkey'  : $scope.data.contact.pubkey?BitShares.btsIsValidPubkey($scope.data.contact.pubkey):undefined
    }

    $q.all(proms).then(function(res) {
      if(!($scope.data.contact.address && res.address)){
        $scope.showAlert('err.invalid_address', 'err.enter_valid_address');
        return;
      }
      if(!($scope.data.contact.pubkey && res.pubkey)){
        $scope.showAlert('err.invalid_pubkey', 'err.enter_valid_pubkey');
        return;
      }

      var db_prom = undefined;
      if(!$scope.data.contact.id)
      {
        db_prom = Contact.add($scope.data.contact.name, $scope.data.contact.address, $scope.data.contact.pubkey, undefined, Contact.LOCAL);
      }
      else
      {
        db_prom = Contact.update($scope.data.contact.id, $scope.data.contact.name, $scope.data.contact.address, $scope.data.contact.pubkey, undefined, Contact.LOCAL);
      } 
      db_prom.then(function(res){
        window.plugins.toast.show(T.i('contact.saved_ok'), 'long', 'bottom');
        $scope.goBack();
      }, function(err){
        $scope.showAlert('err.contact_saving','err.contact_saving_msg');
      })     
    }, function(err){
      $scope.showAlert('err.contact_validating', err);
      return;
    })
    
    
  }
});


