angular.module('bit_wallet.config', [])

.constant('ENVIRONMENT', {
  test: true
})

.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.1,
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
            name: 'asset',
            columns: [
                {name : 'id',               type   : 'integer primary key'},
                {name : 'symbol',           type   : 'text unique'},
                {name : 'fullname',         type   : 'text'},
                {name : 'is_default',       type   : 'integer default 0'},
                {name : 'is_enabled',       type   : 'integer'},
                {name : 'precision',        type   : 'integer'},
                {name : 'symbol_ui_class',  type   : 'text'},
                {name : 'symbol_ui_text',   type   : 'text'}
            ],
            rows:[
              {id: 24,  symbol: 'USD',  fullname: 'United States Dollar', precision: 10000 ,    is_default: 1 , symbol_ui_class : 'fa fa-dollar', symbol_ui_text : ''},
              {id: 27,  symbol: 'GOLD', fullname: 'Gold' ,                precision: 1000000,   is_default: 0 , symbol_ui_class : '', symbol_ui_text : 'GC'},
              {id: 28,  symbol: 'CNY',  fullname: 'Chinese Yuan' ,        precision: 10000,     is_default: 0 , symbol_ui_class : 'fa fa-cny', symbol_ui_text : ''},
              {id: 25,  symbol: 'BTC',  fullname: 'Bitcoin' ,             precision: 100000000, is_default: 0 , symbol_ui_class : 'fa fa-btc', symbol_ui_text : ''}
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
        }
    ],
});

