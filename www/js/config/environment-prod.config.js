bitwallet_config
.constant('ENVIRONMENT', {
  test          : false,
  timeout       : 10000,
  default_asset : 22,
  assets : [
    {id: 22,  name: 'bitUSD',  symbol: 'USD',  unit: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_text : '$'},
    {id:  7,  name: 'bitGOLD', symbol: 'GOLD', unit: 'OZ',   fullname: 'Gold' ,                precision: 1000000,   symbol_ui_text : 'oz'},
    {id: 14,  name: 'bitCNY',  symbol: 'CNY',  unit: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_text : '¥'},
    {id:  4,  name: 'bitBTC',  symbol: 'BTC',  unit: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_text : '€'}
  ],
  apiurl : function(path) {
    var url = 'https://api.limewallet.io/api/v2';
    return url + path;
  },
  wsurl     : 'wss://ws.limewallet.io/events',
  apiPubkey : 'BTS6wneV7EdW9zWC3wtey9ptMpNCEZzc1MSiYwMof9ug4CC1SCSqB'
});

