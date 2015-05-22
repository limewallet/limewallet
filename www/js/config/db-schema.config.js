bitwallet_config
.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.2,
    tables: [
        {
            name: 'account',
            columns: [
                { name : 'id',                type  : 'integer primary key'},
                { name : 'name',              type  : 'text unique'},
                { name : 'address',           type  : 'text'},
                { name : 'pubkey',            type  : 'text'},
                { name : 'privkey',           type  : 'text'},

                { name : 'number',            type  : 'integer unique'},
                { name : 'account_mpk',       type  : 'text'},
                { name : 'memo_mpk',          type  : 'text'},
                { name : 'memo_index',        type  : 'integer default 0'},
                { name : 'encrypted',         type  : 'integer'},

                { name : 'active',            type  : 'integer default 1'},
                { name : 'public_data',       type  : 'text'},
                { name : 'registered',        type  : 'integer default 0'}, // -1:no, 1:yes, 0:unknown
                { name : 'access_key',        type  : 'text'},
                { name : 'secret_key',        type  : 'text'},
                { name : 'created_at',        type  : 'datetime default CURRENT_TIMESTAMP'}
            ]
        },
        {
            name: 'setting',
            columns: [
                { name : 'name',              type   : 'text primary key'},
                { name : 'value',             type   : 'text'}
            ]
        },
        {
            name: 'contact',
            columns: [
                { name : 'id',                type  : 'integer primary key'},
                { name : 'name',              type  : 'text unique not null'}, 
                { name : 'is_pubkey',         type  : 'integer not null'},      
                { name : 'address_or_pubkey', type  : 'text unique not null'},
                { name : 'public_data',       type  : 'text'},
                { name : 'source',            type  : 'text'},
                { name : 'created_at',        type  : 'datetime default CURRENT_TIMESTAMP'}
            ]
        },
        {
            name: 'memo',
            columns: [
                { name : 'id',                  type  : 'text primary key'},
                { name : 'account',             type  : 'integer'}, 
                { name : 'encrypted',           type  : 'integer default 1'}, 
                { name : 'memo',                type  : 'text'}, 
                { name : 'one_time_key',        type  : 'text'}, 
                { name : 'message',             type  : 'text'}, 
                { name : 'pubkey',              type  : 'text'}
            ]
        },
        {
            name: 'operation',
            columns: [
                { name : 'block_id'  , type: 'text'},
                { name : 'timestamp' , type: 'integer'},
                { name : 'memo_hash' , type: 'text'},
                { name : 'address'   , type: 'text'},
                { name : 'asset_id'  , type: 'integer'},
                { name : 'fee'       , type: 'integer'},
                { name : 'txid'      , type: 'text'},
                { name : 'amount'    , type: 'integer'},
                { name : 'block'     , type: 'integer'},
                { name : 'type'      , type: 'text'},
            ],
            indexes: ['txid']
        },
        {
            name: 'exchange_transaction',
            columns: [
                { name : 'id',                     type   : 'integer primary key'},
                { name : 'asset_id',               type   : 'integer'},
                { name : 'cl_pay',                 type   : 'text'},
                { name : 'cl_pay_curr',            type   : 'text'},
                { name : 'cl_pay_addr',            type   : 'text'},
                { name : 'cl_pay_tx',              type   : 'text unique'},
                { name : 'cl_recv',                type   : 'text'},             
                { name : 'cl_recv_curr',           type   : 'text'},              
                { name : 'cl_recv_addr',           type   : 'text'},             
                { name : 'cl_recv_tx',             type   : 'text unique'},      
                { name : 'refund_tx',              type   : 'text'},
                { name : 'balance',                type   : 'text'},
                { name : 'rate',                   type   : 'text'},
                { name : 'quoted_at',              type   : 'integer'},
                { name : 'updated_at',             type   : 'integer'},
                { name : 'status',                 type   : 'text'},
                { name : 'extra_data',             type   : 'text'},
                { name : 'cl_cmd',                 type   : 'text'},
                { name : 'created_at',             type   : 'integer'}
            ],
            indexes: ['cl_pay_tx', 'cl_recv_tx']
        },
        {
            name: 'balance',
            columns: [
                {name : 'id',                     type   : 'string primary key'},
                {name : 'address',                type   : 'string'},
                {name : 'amount',                 type   : 'integer'},
                {name : 'asset_id',               type   : 'integer'},
          ]
        }
    ],
});
