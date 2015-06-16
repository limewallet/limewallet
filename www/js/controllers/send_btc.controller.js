bitwallet_controllers.controller('SendBTCCtrl', function($scope, $q, T, BitShares, Scanner, $http, $ionicLoading, $ionicNavBarDelegate, $ionicModal, $ionicPopup, $location, $timeout, $rootScope, $stateParams, Wallet, Contact) {

$scope.data = {

  amount        : undefined,
  address       : undefined,
  memo          : undefined,
  valid_quote   : false,
  other_amount  : undefined,
  input_timeout : undefined,
  quoting       : false,
  quote         : undefined,
  quote_timestamp :  0

}

$scope.nanobar = {
  step    : 0.2, 
  current : 0, 
  total   : 60,
  element : undefined,
  stop    : 0
};

$scope.stopNanobar = function() {
  $scope.nanobar.current = 0;
  $scope.nanobar.stop    = 1;
  
  if($scope.nanobar.element) {
    $timeout(function(){
      $scope.nanobar.element.go(0);
    }, 0);
  }

}

$scope.startNanobar = function() {
  if($scope.nanobar.element === undefined)
  {
    var options3 = {
      target: document.getElementById('nanobar_id'),
      id: 'mynano3',
      bg: '#5abb5c'
    };
    $scope.nanobar.element = new Nanobar( options3 );
    $scope.nanobar.current = 0;
  }

  $scope.stopNanobar();  
  $scope.nanobar.stop = 0;
  $timeout($scope.tickNanobar, $scope.nanobar.step*1000);
};

$scope.tickNanobar = function() {

  if ( $scope.nanobar.stop ) { 
    $scope.nanobar.element.go(0);
    return;
  }

  var new_val = 100*$scope.nanobar.current/$scope.nanobar.total;

  $scope.nanobar.current += $scope.nanobar.step;
  $scope.nanobar.element.go(new_val);
  $timeout($scope.tickNanobar, $scope.nanobar.step*1000);

}

$scope.$watch('data.amount', function(newValue, oldValue, scope) {
    if(newValue===oldValue)
      return;

    $scope.getQuote();
});

$scope.getQuote = function() {

  $scope.data.valid_quote  = false;
  $scope.data.other_amount = undefined;

  $timeout.cancel($scope.input_timeout);
  $scope.stopNanobar();

  if(!$scope.data.amount) {
    $scope.data.quoting = false;
    return;
  }

  $scope.data.quoting = true;

  $scope.input_timeout = $timeout(function () {

    var prom = BitShares.getQuote('buy', $scope.data.amount, 'BTC', Wallet.data.asset.name);

    prom.then(function(res){

      $scope.data.other_amount    = Number(res.quote.cl_pay);
      $scope.data.quote           = res;
      $scope.data.quote_timestamp = parseInt((new Date()).getTime());
      $scope.data.valid_quote     = true;
      $scope.data.quoting         = false;

      $scope.startNanobar();

    }, function(err){
      console.log(JSON.stringify(err));
      $scope.data.quoting = false;
    });
  }, 750);

}  

// $scope.$on( '$ionicView.enter', function(){
//   //$scope.startNanobar();
// });

$scope.applyScan = function(scan_data) {
  $scope.data.amount  = scan_data.amount ? Number(scan_data.amount) : undefined;
  $scope.data.memo    = scan_data.message;
  $scope.data.address = scan_data.address;

  if($scope.data.amount) {
    $scope.getQuote();
  }
}

var scan_data = $stateParams.scan_data;
if(scan_data) {
  console.log('SEBND BTC controller: ' + JSON.stringify(scan_data));
  $scope.applyScan(scan_data);
}


});
