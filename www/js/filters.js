var bitwallet_filters = angular.module('bit_wallet.filters', ['bit_wallet.config']);

var moments       = ['0_today', '1_this_week', '2_this_month'];
var current_year  = moment().year().toString();
bitwallet_filters.filter('moment_separator', function(T) {
  return function(box_label) {
  //console.log(box_label);
    var m_box_label = box_label.toString();
    if(moments.indexOf(m_box_label)>-1)
      return T.i('home.'+m_box_label);
    var my_moment = moment(m_box_label, 'YYYY-MM');
    return ((m_box_label.indexOf(current_year)>-1)?my_moment.format('MMMM'):my_moment.format('MMMM YYYY'));
  }
});


bitwallet_filters.filter('from_now', function(T) {
  return function(tx) {
    if(tx===undefined)
      return '';
    return moment(tx.TS).fromNow();
  }
});

bitwallet_filters.filter('xtx_status', function(T) {
  return function(xtx) {
    if(xtx===undefined)
      return '';
    var simple_translation  = T.i('xchg.'+xtx.status);
    var full_t              = 'xchg.'+xtx.status+'_full';
    var full_translation    = T.i(full_t);
    if(simple_translation!=full_translation && full_translation!=full_t)
    {
      return simple_translation + ' (' + full_translation + ')';
    }
    return simple_translation;
  }
});

bitwallet_filters.filter('capitalize', function() {
  return function (input, format) {
      if (!input) {
        return input;
      }
      format = format || 'first';
      if (format === 'first') {
        // Capitalize the first letter of a sentence
        return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
      } else {
        var words = input.split(' ');
        var result = [];
        words.forEach(function(word) {
          if (word.length === 2 && format === 'team') {
            // Uppercase team abbreviations like FC, CD, SD
            result.push(word.toUpperCase());
          } else {
            result.push(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
          }
        });
        return result.join(' ');
      }
    };
});
  
bitwallet_filters.filter('xtx_action', function(BitShares, $filter, T) {
  return function(xtx) {
    if(xtx===undefined)
      return 'xtx is undefined';
    var to_translate = xtx.tx_type;
    if(to_translate=='withdraw')
      to_translate = 'withdrew';
    return T.i('g.'+to_translate);
  }
});

bitwallet_filters.filter('is_uncompleted_xtx', function(BitShares, $filter) {
  return function(xtx) {
    if (!BitShares.isXtx(xtx))
      return false;
    return !BitShares.isXtxCompleted(xtx);
  }
});

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