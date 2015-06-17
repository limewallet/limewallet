bitwallet_controllers.controller('SettingsCtrl', function($q, DB, BitShares, $scope, Wallet, Setting, $rootScope, Account, $ionicModal, $timeout, T, $cordovaClipboard, $ionicPopup) {
  
  $scope.data = { 
    assets : [],
    selected_asset    : {},
    hide_balance      : false,
    password          : {old:'', new:'', confirm:''} 
  };
  
  $scope.loadViewData = function() {
    // Load assets
    Object.keys(Wallet.data.assets).forEach(function(aid){
      var asset = Wallet.data.assets[aid];
      $scope.data.assets.push({value:asset.id, label:asset.symbol});
      if(Wallet.data.asset.id == asset.id)
        $scope.data.selected_asset = $scope.data.assets[$scope.data.assets.length-1];
    });

    $scope.data.hide_balance = Wallet.data.ui.balance.allow_hide;
  }

  $scope.$watch('data.selected_asset', function(newValue, oldValue, scope) {
    if(!$scope || newValue===oldValue)
      return;

    Setting.set(Setting.DEFAULT_ASSET, newValue.value);
    Wallet.switchAsset(newValue.value);
  });
  
  $scope.$watch('data.hide_balance', function(newValue, oldValue, scope) {
    if(!$scope || newValue===oldValue)
      return;

    Setting.set(Setting.UI_HIDE_BALANCE, newValue)
    Wallet.setAllowHideBalance(newValue);
  });
  
  $scope.loadViewData();
  
  $scope.restoreWallet = function() {
    $scope.showAlert('Hay que hacer','ESTO');
  }
  
  $scope.backupWallet = function() {

    if(Wallet.isLocked()) {
      $scope.showAlert('err.bkp_wallet_locked', 'err.bkp_wallet_locked_msg');      
      return;
    }

    $scope.openModal();
  }

  $scope.$on('modal.hidden', function(restore) {
    //$scope.formDone();
  });
  
  $ionicModal.fromTemplateUrl('templates/settings.backup.seed.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    console.log(' ---- modal loaded!');
    $scope.modal = modal;
  });

  $scope.openModal = function() {
    $scope.modal.show();
  };
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  
  $scope.copySeed = function(){
    $cordovaClipboard
      .copy(Wallet.data.seed.plain_value)
      .then(function () {
        window.plugins.toast.show(T.i('g.seed_copied'), 'short', 'bottom');
      }, function () {
        window.plugins.toast.show(T.i('err.seed_copied'), 'short', 'bottom');
      });
  }

  $scope.computeCypherData = function(data, new_password) {

    var deferred = $q.defer();

    if(!new_password) {

      console.log('COMO NO TIENE PASS va de UNA');
      console.log('--> ' + JSON.stringify(data));

      deferred.resolve(data);
      return deferred.promise;
    }
    
    Setting.get(Setting.SALT).then(function(salt) {

      //Si, esta encryptado
      BitShares.derivePassword(new_password, salt.value).then(function(dpass) {

        Wallet.lockData(data, dpass.key).then(function(cdata) {
          deferred.resolve(cdata);
        }, function(err) {
          deferred.reject(err);
          console.log('computeCypherData #0: ' + JSON.stringify(err));
        });

      }, function(err) {
        deferred.reject(err);
        console.log('computeCypherData #1: ' + JSON.stringify(err));
      });

    }, function(err) {
      deferred.reject(err);
      console.log('computeCypherData #2: ' + JSON.stringify(err));
    });


    return deferred.promise;
  }

  $scope.getPlainData = function(current_password) {

    var deferred = $q.defer();

    Wallet.loadDB().then(function(data) {

      //No, No esta encryptado
      if(!Wallet.data.password_required) {
        deferred.resolve(data);
        return deferred.promise;
      }

      Setting.get(Setting.SALT).then(function(salt) {
  
        //Si, esta encryptado
        BitShares.derivePassword(current_password, salt.value).then(function(dpass) {

          Wallet.unlockData(data, dpass.key).then(function() {

            data.seed.value = data.seed.plain_value;
            data.mpk.value  = data.mpk.plain_value;

            for(var i=0; i<data.accounts.length;i++){
              data.accounts[i].memo_mpk    = data.accounts[i].plain_memo_mpk;
              data.accounts[i].account_mpk = data.accounts[i].plain_account_mpk;
              data.accounts[i].privkey     = data.accounts[i].plain_privkey;
              data.accounts[i].skip32_key  = data.accounts[i].plain_skip32_key;
            }

            deferred.resolve(data);
          }, function(err) {
            deferred.reject(err);
            console.log('getPlainData #0: ' + JSON.stringify(err));
          });

        }, function(err) {
          deferred.reject(err);
          console.log('getPlainData #1: ' + JSON.stringify(err));
        });

      }, function(err) {
        deferred.reject(err);
        console.log('getPlainData #2: ' + JSON.stringify(err));
      });

    }, function(err) {
      deferred.reject(err);
      console.log('getPlainData #3: ' + JSON.stringify(err));
    });

    return deferred.promise;
  }

  $scope.password = function(){
    
    $scope.data.password = {old:'', new:'', confirm:''};

    var title     = T.i('g.set_password');
    var sub_title = T.i('settings.set_password_subtitle');
    var template  = '<input type="password" placeholder="'+T.i('settings.new_password')+'" ng-model="data.password.new"><br/><input type="password" placeholder="'+T.i('g.confirm_password')+'" ng-model="data.password.confirm">';

    if ( Wallet.data.password_required ) {
      template  = '<input type="password" placeholder="'+T.i('settings.old_password')+'" ng-model="data.password.old"><br/>' + template;
      title     = T.i('g.change_password');
      sub_title = T.i('settings.change_password_subtitle');
    }

    var myPopup = $ionicPopup.show({
        template  : template,        
        title     : title,
        subTitle  : sub_title,
        scope     : $scope,
        buttons: [
          { text: T.i('g.cancel') },
          {
            text: '<b>'+T.i('g.ok')+'</b>',
            type: 'button-positive',
            onTap: function(e) {

              if(Wallet.data.password_required && !$scope.data.password.old) {
                $scope.showAlert(T.i('settings.change_password_title'), T.i('settings.must_enter_old'));
                e.preventDefault();
                return;
              }

              if(!Wallet.data.password_required && (!$scope.data.password.new || !$scope.data.password.confirm)) {
                $scope.showAlert(T.i('settings.change_password_title'), T.i('settings.must_enter_both'));
                e.preventDefault();
                return;
              }

              if($scope.data.password.new != $scope.data.password.confirm) {
                $scope.showAlert(T.i('settings.change_password_title'), T.i('settings.dont_match'));
                e.preventDefault();
                return;
              }
              
              return { 
                 old      : $scope.data.password.old,
                 new_     : $scope.data.password.new,
                 confirm  : $scope.data.password.confirm
              };

            }
          }
        ]
    });
    
    myPopup.then(function(res) {

      if(!res) {
        console.log('Mmm ... seems to be null');
        return;
      }

      $scope.showLoading(T.i('settings.changing_password'));

      $scope.getPlainData(res.old).then(function(data) {

        $scope.computeCypherData(data, res.new_).then(function(cdata) {

          console.log('VOY A IRAR TX DB.transsnanan!! ' + JSON.stringify(cdata));

          var sql_cmd    = [];
          var sql_params = [];

          var seed_cmd  = Setting._set(Setting.SEED, JSON.stringify({'value':cdata.seed.value, 'encrypted':cdata.locked}) );
          var mpk_cmd   = Setting._set(Setting.MPK,  JSON.stringify({'value':cdata.mpk.value, 'encrypted':cdata.locked}) );

          sql_cmd.push(seed_cmd.sql);
          sql_params.push(seed_cmd.params);
          
          sql_cmd.push(mpk_cmd.sql);
          sql_params.push(mpk_cmd.params);

          for(var i=0; i<cdata.accounts.length; i++) {
            var account_cmd = Account._update(cdata.accounts[i]);              
            sql_cmd.push(account_cmd.sql);
            sql_params.push(account_cmd.params);
          }

          DB.queryMany(sql_cmd, sql_params).then(function() {
            
            Wallet.load().then(function() {

              if (res.new_) {
                prom = Wallet.lock();
              }

              Wallet.refreshBalance();
              $scope.hideLoading();
              window.plugins.toast.show( T.i('settings.password_change_ok'), 'long', 'bottom');

            }, function(err) {
              console.log('ERROR TERMINO DB TXS ' + JSON.stringify(err));
              $scope.hideLoading();
            });

          }, function(err) {
            console.log('ERROR TERMINO DB TXS ' + JSON.stringify(err));
            $scope.hideLoading();
          });


        }, function(err) {
          console.log('myPopup #0: ' + JSON.stringify(err));
          $scope.hideLoading();
          //TODO: alert?
        });

      }, function(err) {
        console.log('myPopup #0: ' + JSON.stringify(err));
        $scope.hideLoading();
        //TODO: alert?
      });

      //console.log('Tapped!', res);
    });

  }

});
