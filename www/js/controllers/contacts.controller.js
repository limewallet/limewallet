bitwallet_controllers
.controller('ContactsCtrl', function(Contact, $scope, $state, Wallet, T, $ionicPopup, $ionicActionSheet, $rootScope, $ionicNavBarDelegate, $stateParams){
  
  $scope.data = {
    contacts : [ 
    // {   name              : 'pepe',     
    //     pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS'}
    // , { name              : 'dengra',     
    //     pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS'}
    // , { name              : 'serafin.alberto',     
    //     pubkey_or_address : 'DVS8axM9VHqo1iTFHmKrh4VjzsYhATdwTKbdoRyoYsKDcME2x5VkM'}
  ]};
  
  Contact.locals().then(function(res){
    $scope.data.contacts = res;
  });
  
  $scope.addNew = function(){
    console.log(' -------- Contacts->addNew');
    $state.go('app.contact', {contact:{}}, {inherit:true});
    console.log(' -------- Contacts->addNew READY!');
  }

  $scope.contactOptions = function(contact){
    
// ver/edit
// delete
// share
  var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>'+T.i('contacts.edit')+'</b>' },
       { text: T.i('contacts.share')},
       { text: '<span class="assertive">'+T.i('g.remove') + '</span>'}],
     //destructiveText: T.i('g.remove'),
     //cancelText: T.i('g.cancel'),
     titleText: T.i('contacts.options'),
     // cancel: function() {
     //      console.log(' ** CONTACTS ** -> cancel action');
     //    },
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
        });
      }
      return true;
     }
   });
  }
});


