bitwallet_controllers
.controller('ImportPrivCtrl', function($scope, T, $ionicLoading, $ionicModal, $ionicPopup, $stateParams, $ionicSideMenuDelegate) {
  
  $scope.$on( '$ionicView.enter', function(){
    $scope.viewRendered();
  }); 
  
  $scope.data  = {
      amount    : 20.5, 
      priv_key  : 'NOT_AVAILABLE', 
      asset     : $scope.wallet.asset.symbol
    };
  
  $scope.$on( '$ionicView.enter', function(){
    $ionicSideMenuDelegate.canDragContent(false);
  });

  $scope.$on( '$ionicView.leave', function(){
    $ionicSideMenuDelegate.canDragContent(true);
  });



});
