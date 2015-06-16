bitwallet_controllers
.controller('ContactsCtrl', function(Contact, $scope, $timeout, $state, Wallet, T, $ionicPopup, $ionicActionSheet, $rootScope, $cordovaSocialSharing, $stateParams){
  
  $scope.data = {
    contacts : [ 
    // {   name              : 'pepe',     
    //     pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS'}
    // , { name              : 'dengra',     
    //     pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS'}
    // , { name              : 'serafin.alberto',     
    //     pubkey_or_address : 'DVS8axM9VHqo1iTFHmKrh4VjzsYhATdwTKbdoRyoYsKDcME2x5VkM'}
  ]};
  
  $scope.$on( '$ionicView.enter', function(){
    console.log(' -- CONTACTS loading...');
    $scope.loadContacts();
    console.log(' -- CONTACTS loaded!');
  });
  
  $scope.loadContacts = function(){
    Contact.locals().then(function(res){
      $scope.data.contacts = res;
      $timeout(function () { jdenticon(); }, 200);
    });
  }

  $scope.addNew = function(){
    $state.go('app.contact', {contact:{}}, {inherit:true});
  }

  $scope.contactOptions = function(contact){
    
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<b>'+T.i('contacts.edit')+'</b>' },
        { text: T.i('contacts.share')},
        { text: '<span class="assertive">'+T.i('g.remove') + '</span>'}],
      cancelText: T.i('g.cancel'),
      titleText: T.i('contacts.options'),
      buttonClicked: function(index) {
        // Edit
        if(index==0)
        {
          $state.go('app.contact', {contact:contact}, {inherit:true});
          console.log(' ** CONTACTS ** -> view-edit');
        }
        // Share
        else if(index==1)
        {
          console.log(' ** CONTACTS ** -> share');
          $scope.shareContact(contact);
        }
        //Remove
        else if(index==2)
        {
          console.log(' ** CONTACTS ** -> remove'); 
          
          var confirmPopup = $ionicPopup.confirm({
            title    : T.i('contacts.remove_title'),
            template : T.i('contacts.remove_sure', {'name':contact.name}),
          }).then(function(res) {
            if(!res)
              return;
            Contact.remove(contact.id).then(function(){
              window.plugins.toast.show(T.i('contacts.removed_ok'), 'long', 'bottom');
              $scope.loadContacts();
            }, function(err){
              $scope.showAlert('err.contact_removing',err);              
            })  
          });
        }
        return true;
      }
    });
  }

  $scope.shareContact = function(contact){
    var pubkey_or_address = contact.pubkey || contact.address;
    var contact_uri = 'bts://'+contact.name+':'+pubkey_or_address;
    $cordovaSocialSharing
    //.share(null, null, null, contact_uri)
    .share(contact.name, null, document.getElementById('contact_canvas_'+contact.id).toDataURL(), contact_uri)
    .then(function(result) {
      // success

    }, function(err) {
      // error
      window.plugins.toast.show( T.i('err.unable_to_share_contact'), 'long', 'bottom')
    });
  }

});


