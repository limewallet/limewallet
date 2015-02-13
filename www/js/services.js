var bitwallet_services = angular.module('bit_wallet.services', ['bit_wallet.config']);

//i18n Helper
bitwallet_services.factory('T', function($translate) {
    var self = this;
    
    self.i = function(txt, obj) {
      return $translate.instant(txt, obj);
      };

    return self;
})

