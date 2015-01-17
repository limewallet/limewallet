angular.module('bit_wallet.config', [])

.constant('ENVIRONMENT', {
  test: true,
  timeout : 10000,
  assets : function() {
    if( !this.test ) {
      return [
        {id: 22,  symbol: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_class : 'fa fa-dollar', symbol_ui_text : ''},
        {id: 7,   symbol: 'GOLD', fullname: 'Gold' ,                precision: 1000000,   symbol_ui_class : '', symbol_ui_text : 'ozt'},
        {id: 14,  symbol: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_class : 'fa fa-cny', symbol_ui_text : ''},
        {id: 4,   symbol: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_class : 'fa fa-btc', symbol_ui_text : ''}
      ]
    } else {
     return [
        {id: 24,  symbol: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    symbol_ui_class : 'fa fa-dollar', symbol_ui_text : ''},
        {id: 27,  symbol: 'GOLD', fullname: 'Gold' ,                precision: 1000000,   symbol_ui_class : '', symbol_ui_text : 'ozt'},
        {id: 28,  symbol: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     symbol_ui_class : 'fa fa-cny', symbol_ui_text : ''},
        {id: 25,  symbol: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, symbol_ui_class : 'fa fa-btc', symbol_ui_text : ''}
      ]
    }
  },
  apiurl : function(path) {
    var url = this.test ? 'https://bsw-test.latincoin.com/api/v1' : 'https://bsw.latincoin.com/api/v1';
    return url + path;
  },
  wsurl : function() {
    return this.test ? 'http://bswws-test.latincoin.com/events' : 'https://bswws.latincoin.com/events';
  }
})

.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.2,
    tables: [
        {
            name: 'master_key',
            columns: [
                {name : 'id',     type   : 'integer primary key'},
                {name : 'key',    type   : 'text'},
                {name : 'deriv',  type   : 'integer'}
            ]
        },
        {
            name: 'address',
            columns: [
                {name : 'id',         type   : 'integer primary key'},
                {name : 'deriv',      type   : 'integer'},
                {name : 'address',    type   : 'text'},
                {name : 'label',      type   : 'text'},
                {name : 'pubkey',     type   : 'text'},
                {name : 'privkey',    type   : 'text'},
                {name : 'created_at', type   : 'integer'},
                {name : 'is_default', type   : 'integer'}
            ]
        },
        {
            name: 'address_book',
            columns: [
                {name : 'id',          type   : 'integer primary key'},
                {name : 'address',     type   : 'text unique'},
                {name : 'name',        type   : 'text'},
                {name : 'is_favorite', type   : 'integer'},
            ]
        },
        {
            name: 'account',
            columns: [
                {name : 'id',                 type   : 'integer primary key'},
                {name : 'name',               type   : 'text unique'},
                {name : 'token',              type   : 'text'},
                {name : 'gravatar_id',        type   : 'text'},
            ]
        },
        {
            name: 'setting',
            columns: [
                {name : 'name',               type   : 'text primary key'},
                {name : 'value',              type   : 'text'}
            ]
        }
    ],
});

