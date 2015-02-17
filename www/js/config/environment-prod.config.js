bitwallet_config
.constant('ENVIRONMENT', {
  test          : false,
  timeout       : 10000,
  default_asset : 22,
  assets : [
    {id: 22,  symbol: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_class : 'fa fa-dollar', symbol_ui_text : ''},
    {id: 7,   symbol: 'GOLD', fullname: 'Gold' ,                precision: 1000000,   symbol_ui_class : '', symbol_ui_text : 'ozt'},
    {id: 14,  symbol: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_class : 'fa fa-cny', symbol_ui_text : ''},
    {id: 4,   symbol: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_class : 'fa fa-btc', symbol_ui_text : ''}
  ],
  apiurl : function(path) {
    var url = 'https://bsw.latincoin.com/api/v2';
    return url + path;
  },
  wsurl : 'wss://bswws.latincoin.com/events',
  apiPubkey : 'DVS6BaM6BKs9gBBEhZqmQj9KjAV8A8f23yeJXhnbWa4VpqEtyXHMq'
});

