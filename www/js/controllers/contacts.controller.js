bitwallet_controllers
.controller('ContactsCtrl', function($scope, $state, Wallet, T, $ionicHistory, $ionicPopup, $ionicActionSheet, $rootScope, $ionicNavBarDelegate, $stateParams){
  
  $scope.data = {contacts : [ {name:'pepe', address:'addy1'}
                           , {name:'dengra', address:'addy2'}
                           , {name:'aristides', address:'addy3'} ]};
  
  
  $scope.showActionSheet = function(addr){
    var fav_text = 'book.add_to_fav';
    if(addr.is_favorite)
      fav_text = 'book.remove_from_fav';

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


