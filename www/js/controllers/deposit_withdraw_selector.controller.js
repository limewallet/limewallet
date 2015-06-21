bitwallet_controllers
.controller('DWSelectorCtrl', function($scope, $state, T, $ionicPopup, $rootScope,$stateParams){
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data = {
    title : '',
    type  : ''
  };
  
  $scope.$on( '$ionicView.enter', function(){
  });
  
  $scope.data.action = $stateParams.action;
  if($stateParams.action == 'deposit') {
    $scope.data.title = T.i('deposit_withdraw_selector.deposit_title');
  }
  else
  {
    $scope.data.title = T.i('deposit_withdraw_selector.withdraw_title');
  }

});


