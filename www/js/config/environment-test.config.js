bitwallet_config
.constant('ENVIRONMENT', {
  test          : true,
  timeout       : 10000,
  default_asset : 24,
  assets : [
    {id: 24,  symbol: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_class : 'fa fa-dollar', symbol_ui_text : ''},
    {id: 27,  symbol: 'GOLD', fullname: 'Gold' ,                precision: 1000000,   symbol_ui_class : '', symbol_ui_text : 'ozt'},
    {id: 28,  symbol: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_class : 'fa fa-cny', symbol_ui_text : ''},
    {id: 25,  symbol: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_class : 'fa fa-btc', symbol_ui_text : ''}
  ],
  apiurl : function(path) {
    var url = 'https://bsw-test.latincoin.com/api/v2';
    return url + path;
  },
  wsurl : 'ws://bswws-test.latincoin.com/events',
  apiPubkey : 'DVS6BaM6BKs9gBBEhZqmQj9KjAV8A8f23yeJXhnbWa4VpqEtyXHMq'
});
//DVS8m6y6QXLPbSZmKVmKJvvbjXVZX9vL2Mk38vHLSxKkLwjBxPwqz
//DVS63cpRrsNQiusNfvh6BU2cx4Anb77J4S5PP42PitfCAxRjuodux
