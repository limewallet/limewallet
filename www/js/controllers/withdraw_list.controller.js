bitwallet_controllers
.controller('WithdrawListCtrl', function($scope, $state, Wallet, T, $ionicHistory, $ionicPopup, $ionicActionSheet, AddressBook, $rootScope, $ionicNavBarDelegate, $stateParams){
  
  $scope.data = {txs : [], refresh_status:0};
  $scope.loadViewData = function() {
    var txs = [
        { status:'WP',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 2,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'PC',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 1,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'CC',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 6.2,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'SC',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 8,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'OK',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 2.33,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'EX',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 5,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'CA',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 2.333,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''},
        { status:'FW',  cl_pay:'',  cl_pay_curr: '',  cl_pay_addr: '',  cl_recv: 1.5,  cl_recv_curr: 'BTC', cl_recv_addr: '', cl_recv_tx: '', rate: '',
          quoted_at: '2015-01-31 12:00',  confirmations: '',  balance: '',  id: ''}
        ];
    
    // WAITING_CLIENT_PAYMENT  = 'WP'
    // PAID_BY_CLIENT          = 'PC'
    // CLIENT_TX_CONFIRMED     = 'CC'
    // SENT_TO_CLIENT          = 'SC'
    // COMPLETED               = 'OK'
    // EXPIRED                 = 'EX'
    // CANCELED                = 'CA'
    // FORWARDED               = 'FW'
    // id           = Column(Integer, primary_key=True, autoincrement=True)
    // account      = Column(String(60))
    // cl_pay       = Column(Numeric('16,8'), nullable=False)
    // cl_pay_curr  = Column(String(5), nullable=False)
    // cl_pay_addr  = Column(String(50), nullable=False)
    // cl_recv      = Column(Numeric('16,8'), nullable=False)
    // cl_recv_curr = Column(String(5), nullable=False)
    // cl_recv_addr = Column(String(50), nullable=False)
    // cl_recv_tx   = Column(String(64))
    // cl_index_key = Column(Integer, nullable=False)
    // rate         = Column(Numeric('16,8'), nullable=False)
    // quoted_at    = Column(DateTime, nullable=False)

    // status       = Column(String(2), default='WP',nullable=False)
    // confirmations= Column(Integer, default=0)
    // balance      = Column(Numeric('16,8'), default=Decimal('0'))
  
    $scope.data.txs = txs;
  }
  
  $scope.loadViewData();
  
  $scope.doRefresh = function(){
    $scope.data.refresh_status = 1;
    $timeout(
      function(){
        $scope.data.refresh_status = 0;
        $scope.$broadcast('scroll.refreshComplete');
      }, 1000);
  }
  
  $scope.newWithdraw = function(){
    $state.go('app.withdraw');
  }
});


