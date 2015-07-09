bitwallet_controllers
.controller('ContactCtrl', function($scope, $q, $state, Scanner, BitShares, Contact, T, $ionicPopup, $timeout, $stateParams){
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = {
    contact           : {name:'', pubkey_or_address:'', avatar_hash:''},
    watch_name        : undefined,
    title             : ''
  };

  var contact = $stateParams.contact;
  if(contact && contact.name) {
    $scope.data.contact = contact;
  }

  if(contact && contact.id) {
    $scope.data.title = T.i('contacts.edit_contact');
  } else {  
    $scope.data.title = T.i('contacts.add_contact');
  }

  var tmp = '';
  if(contact && contact.name)
    tmp = contact.name; 

  BitShares.sha256(tmp).then(function(hash){
    $scope.data.contact.avatar_hash = hash;
    $timeout(function () { jdenticon(); }, 200);
  }, function(err){
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


  $scope.getAddress = function (pubkey_or_address) {

    var deferred = $q.defer();

    BitShares.isValidPubkey(pubkey_or_address).then(function(res) {
      BitShares.btsPubToAddress(pubkey_or_address).then(function(addy) {
        deferred.resolve({pubkey:pubkey_or_address, address:addy});
      }, function(err) {
        deferred.reject(err);
      });
    }, function(err) {
      BitShares.btsIsValidAddress(pubkey_or_address).then(function(res) {
        deferred.resolve({address:pubkey_or_address});
      }, function(err) {
        deferred.reject();
      });
    });

    return deferred.promise;
  }

  $scope.scanQR = function() {

    Scanner.scan().then(function(result) {
      
      if(!result || result.cancelled)
        return;

      // SEND BTS
      if(result.type == 'bts_request' || 
         result.type == 'bts_address' || 
         result.type == 'bts_pubkey'  || 
         result.type == 'bts_contact') {

         $scope.data.contact.name              = result.name;
         $scope.data.contact.pubkey_or_address = result.pubkey || result.address;
      }

    }, function(error) {
      $scope.showAlert('contacts.scan_contact', error);
    });
  }

  $scope.save = function(){
    var deferred = $q.defer();
    if(!$scope.data.contact.name)
    {
      $scope.showAlert('err.contact_name_empty', 'err.contact_name_empty_msg');
      deferred.reject();
      return deferred.promise;
    }

    if(!BitShares.isValidBTSName($scope.data.contact.name).valid) {
      $scope.showAlert('err.invalid_name', 'register.valid_name_chars');
      deferred.reject();
      return deferred.promise;
    }

    if(!$scope.data.contact.pubkey_or_address)
    {
      $scope.showAlert('err.contact_addr_pk_empty', 'err.contact_addr_pk_empty_msg');
      deferred.reject();
      return deferred.promise;
    }

    //proms = { 
      //'address' : $scope.data.contact.address?BitShares.btsIsValidAddress($scope.data.contact.address):undefined,
      //'pubkey'  : $scope.data.contact.pubkey?BitShares.btsIsValidPubkey($scope.data.contact.pubkey):undefined
    //}

    $scope.getAddress($scope.data.contact.pubkey_or_address).then(function(res) {
      //
      //if($scope.data.contact.address && !res.address){
        //$scope.showAlert('err.invalid_address', 'err.enter_valid_address');
        //return;
      //}
      //if($scope.data.contact.pubkey && !res.pubkey){
        //$scope.showAlert('err.invalid_pubkey', 'err.enter_valid_pubkey');
        //return;
      //}

      console.log(' ----- save or update contact.avatar_hash:'+$scope.data.contact.avatar_hash);
      var db_prom = undefined;
      if(!$scope.data.contact.id)
      {
        console.log(' ----- contact.ADD');
        db_prom = Contact.add($scope.data.contact.name, res.address, res.pubkey, $scope.data.contact.avatar_hash, Contact.LOCAL);
      }
      else
      {
        console.log(' ----- contact.UPDATE');
        db_prom = Contact.update($scope.data.contact.id, $scope.data.contact.name, res.address, res.pubkey, $scope.data.contact.avatar_hash, Contact.LOCAL);
      } 
      db_prom.then(function(res){
        window.plugins.toast.show(T.i('contacts.saved_ok'), 'long', 'bottom');
        deferred.resolve();
        $scope.goBack();

      }, function(err){
        console.log('xxx=>'+JSON.stringify(err));
        $scope.showAlert('err.contact_saving','err.contact_saving_msg');
        deferred.reject();
      })     
    }, function(err){
      $scope.showAlert('err.contact_validating', 'err.invalid_pubkey_or_address');
      deferred.reject();
    })

    return deferred.promise;
  }
});


