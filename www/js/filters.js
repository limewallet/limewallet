var bitwallet_filters = angular.module('bit_wallet.filters', ['bit_wallet.config']);

bitwallet_filters.filter('draw_op_amount', function(BitShares, $filter) {
  return function(op, precision) {
    return $filter('number')(parseFloat(op.amount)/precision, 2);
  }
});

bitwallet_filters.filter('tx_icon', function(BitShares, $filter) {
  return function(tx) {
    if(BitShares.isDeposit(tx.ui_type))
      return 'icon ion-ios-plus-outline';
    if(BitShares.isWithdraw(tx.ui_type)) 
      return 'icon ion-ios-minus-outline';
    if(BitShares.isBtcPay(tx.ui_type))
      return 'icon ion-social-bitcoin-outline';
    if(tx.ui_type=='sent')
      return 'icon ion-ios-upload-outline';
    if(tx.ui_type=='received')
      return 'icon ion-ios-download-outline';
    if(tx.ui_type=='self')
      return 'icon ion-ios-refresh-outline';
    return '';
  }
});


bitwallet_filters.filter('draw_tx_amount', function(BitShares, $filter) {
  return function(tx) {
    if(BitShares.isDeposit(tx.ui_type))
      return $filter('number')(tx.cl_recv, 2);
    if(BitShares.isWithdraw(tx.ui_type) || BitShares.isBtcPay(tx.ui_type))
      return $filter('number')(tx.cl_pay, 2);
    
    return $filter('number')(tx.amount, 2);
  }
});

bitwallet_filters.filter('draw_pending_tx', function(BitShares, $filter) {
  return function(tx) {
    if(BitShares.isDeposit(tx.ui_type))
      return $filter('number')(tx.cl_pay, 4) + '&nbsp;' + tx.cl_pay_curr ;
    if(BitShares.isWithdraw(tx.ui_type) || BitShares.isBtcPay(tx.ui_type))
      return $filter('number')(tx.cl_recv, 4) + '&nbsp;' + tx.cl_recv_curr ;
    
    return '';
  }
});

// angular.module('phonecatFilters', []).filter('checkmark', function() {
  // return function(input) {
    // return input ? '\u2713' : '\u2718';
  // };
// });