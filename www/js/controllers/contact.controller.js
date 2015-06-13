bitwallet_controllers
.controller('ContactCtrl', function($scope, $q, $state, BitShares, Contact, T, $ionicPopup, $timeout, $stateParams){
  
  $scope.data = {
    from_in_progress  : true,
    contact           : {name:'', address:'', pubkey:'', avatar_hash:''},
    watch_name        : undefined,
    title             : ''
  };

  var contact = $stateParams.contact;
  if(contact && contact.name) {
    $scope.data.contact = contact;
  }
  if(contact && contact.id)
  {
    $scope.data.title = T.i('contacts.edit_contact');
  }
  else
  {  
    $scope.data.title = T.i('contacts.add_contact');
  }
  BitShares.sha256(contact.name).then(function(hash){
    $scope.data.contact.avatar_hash = hash;
    $timeout(function () { jdenticon(); }, 200);
    $scope.data.from_in_progress=false;
  }, function(err){
    $scope.data.from_in_progress=false;
  });

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
  })

  $scope.save = function(){
    $scope.data.from_in_progress=true;
    console.log(' -------------- llamaron a Contact.$scope.saveOrUpdate() ');
    if(!$scope.data.contact.name)
    {
      $scope.data.from_in_progress=false;
      $scope.showAlert('err.contact_name_empty', 'err.contact_name_empty_msg');
      return;
    }

    if(!$scope.data.contact.address && !$scope.data.contact.pubkey)
    {
      $scope.data.from_in_progress=false;
      $scope.showAlert('err.contact_addr_pk_empty', 'err.contact_addr_pk_empty_msg');
      return;
    }

    proms = { 
      'address' : $scope.data.contact.address?BitShares.btsIsValidAddress($scope.data.contact.address):undefined,
      'pubkey'  : $scope.data.contact.pubkey?BitShares.btsIsValidPubkey($scope.data.contact.pubkey):undefined
    }

    $q.all(proms).then(function(res) {
      if($scope.data.contact.address && !res.address){
        $scope.showAlert('err.invalid_address', 'err.enter_valid_address');
        $scope.data.from_in_progress=false;
        return;
      }
      if($scope.data.contact.pubkey && !res.pubkey){
        $scope.showAlert('err.invalid_pubkey', 'err.enter_valid_pubkey');
        $scope.data.from_in_progress=false;
        return;
      }

      console.log(' ----- save or update contact.avatar_hash:'+$scope.data.contact.avatar_hash);
      var db_prom = undefined;
      if(!$scope.data.contact.id)
      {
        console.log(' ----- contact.ADD');
        db_prom = Contact.add($scope.data.contact.name, $scope.data.contact.address, $scope.data.contact.pubkey, $scope.data.contact.avatar_hash, Contact.LOCAL);
      }
      else
      {
        console.log(' ----- contact.UPDATE');
        db_prom = Contact.update($scope.data.contact.id, $scope.data.contact.name, $scope.data.contact.address, $scope.data.contact.pubkey, $scope.data.contact.avatar_hash, Contact.LOCAL);
      } 
      db_prom.then(function(res){
        window.plugins.toast.show(T.i('contacts.saved_ok'), 'long', 'bottom');
        $scope.data.from_in_progress=false;
        $scope.goBack();
      }, function(err){
        $scope.data.from_in_progress=false;
        $scope.showAlert('err.contact_saving','err.contact_saving_msg');
      })     
    }, function(err){
      $scope.data.from_in_progress=false;
      $scope.showAlert('err.contact_validating', err);
      return;
    })
  }
});


