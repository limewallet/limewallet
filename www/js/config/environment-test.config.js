bitwallet_config
.constant('ENVIRONMENT', {
  test          : true,
  timeout       : 10000,
  default_asset : 24,
  assets : [
    {id: 24,  name: 'bitUSD',  symbol: 'USD',  unit: 'USD',  x_symbol: 'bitUSD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_class : 'fa fa-dollar', symbol_ui_text : '$'},
    {id: 27,  name: 'bitGOLD', symbol: 'GOLD', unit: 'OZT',  x_symbol: 'bitGOLD', fullname: 'Gold' ,                precision: 1000000,   symbol_ui_class : '', symbol_ui_text : 'ozt'},
    {id: 28,  name: 'bitCNY',  symbol: 'CNY',  unit: 'CNY',  x_symbol: 'bitCNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_class : 'fa fa-cny', symbol_ui_text : '¥'},
    {id: 25,  name: 'bitBTC',  symbol: 'BTC',  unit: 'BTC',  x_symbol: 'bitBTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_class : 'fa fa-btc', symbol_ui_text : '€'}
  ],
  apiurl : function(path) {
    //var url = 'http://bsw-test.latincoin.com/api/v2';
    var url = 'http://54.187.196.240/api/v2';
    //var url = 'http://192.168.42.42:8100/api/v2';
    return url + path;
  },
  //wsurl : 'ws://bswws-test.latincoin.com/events',
  wsurl : 'ws://54.187.196.240/events',
  //
  apiPubkey : 'DVS6BaM6BKs9gBBEhZqmQj9KjAV8A8f23yeJXhnbWa4VpqEtyXHMq'
});
//DVS8m6y6QXLPbSZmKVmKJvvbjXVZX9vL2Mk38vHLSxKkLwjBxPwqz
//DVS63cpRrsNQiusNfvh6BU2cx4Anb77J4S5PP42PitfCAxRjuodux
