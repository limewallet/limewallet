bitwallet_controllers
.controller('SuccessfulCtrl', function($scope, Wallet, $rootScope, T, $stateParams, $timeout){
  
  $scope.data = { 
    title       : "title",
    amount      : 0,
    sub_title   : '', // "Recipient"
    sub_data    : '', // "recipient?",
    sub_title2  : '', // "Memo",
    sub_data2   : '', // "memo?",
    oper_id     : 0,
    xtx_id      : 0
  }
  
  // stateParams -> :txid/:xtxid/:address/:name/:message/:amount/:type                

  var tx = $stateParams.tx;
  if(tx && tx.amount) {
  
    $scope.data.title       = T.i('g.'+tx.type);
    $scope.data.amount      = tx.amount;
    
    $scope.data.sub_title   = T.i('g.recipient');
    $scope.data.sub_data    = tx.name || tx.address;

    if (tx.message){
      $scope.data.sub_title2  = T.i('g.memo');
      $scope.data.sub_data2   = tx.message;
    }

    $scope.data.currency_symbol = tx.currency_symbol || Wallet.data.asset.symbol_ui_text;
    $scope.data.currency_name   = tx.currency_name   || Wallet.data.asset.name;

    $timeout(function () { $scope.goHome(); }, 3000);
  }
  else{
    $scope.goHome();
  }
  
});


