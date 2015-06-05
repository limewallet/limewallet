bitwallet_controllers
.controller('ContactsCtrl', function($scope, $state, Wallet, T, $ionicPopup, $ionicActionSheet, $rootScope, $ionicNavBarDelegate, $stateParams, $ionicPopover){
  
  $scope.data = {contacts : [ {   name              : 'pepe',     
                                  pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS', 
                                  source            : 'local'}
                              , { name              : 'dengra',     
                                  pubkey_or_address : 'DVS54jEBqoWGYAc5uJFCPXv4BjAyuW9F67BZjiL9YKv9swrhBGRSS', 
                                  source            : 'global'}
                              , { name              : 'serafin.alberto',     
                                  pubkey_or_address : 'DVS8axM9VHqo1iTFHmKrh4VjzsYhATdwTKbdoRyoYsKDcME2x5VkM', 
                                  source            : 'local'}]};
  
  
  $ionicPopover.fromTemplateUrl('templates/contacts_popover.html', {
    scope: $scope
  }).then(function(popover) {
    $scope.popover = popover;
  });

  

  $scope.openPopover = function($event) {
    document.body.classList.remove('platform-ios');
    document.body.classList.remove('platform-android');
    document.body.classList.add('platform-ionic');
    $scope.popover.show($event);
  };
  $scope.closePopover = function() {
    $scope.popover.hide();
  };


  $scope.showActionSheet = function(addr){
    var fav_text = 'book.add_to_fav';
    if(addr.is_favorite)
      fav_text = 'book.remove_from_fav';

// ver/edit
// delete
// share

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
          Wallet.loadAddressBook().then(function(){
           $rootScope.$emit('address-book-changed');
         });
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
              Wallet.loadAddressBook().then(function(){
                $rootScope.$emit('address-book-changed');
              });
            });
         });
      }
      return true;
     }
   });
  }
});


