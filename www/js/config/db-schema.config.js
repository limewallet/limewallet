bitwallet_config
.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.2,
    tables: [
        {
            name: 'account',
            columns: [
                { name : 'id',                 type  : 'integer primary key'},
                { name : 'name',               type  : 'text unique'},
                { name : 'number',             type  : 'integer'},
                { name : 'active',             type  : 'integer'},
                { name : 'registered',         type  : 'integer'},
                { name : 'access_key',         type  : 'text'},
                { name : 'secret_key',         type  : 'text'},
                { name : 'created_at',         type  : 'integer'}
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
                { name : 'id',                type  : 'text primary key'},
                { name : 'name',              type  : 'text unique'}, 
                { name : 'pub_key',           type  : 'text unique'},
                { name : 'address',           type  : 'text unique'},
                { name : 'public_data',       type  : 'text'},
                { name : 'source',            type  : 'text'},
                { name : 'created_at',        type  : 'integer'}
            ]
        },
        {
            name: 'memo',
            columns: [
                { name : 'id',                type  : 'text primary key'},
                { name : 'message',           type  : 'text'}, 
                { name : 'pubkey',            type  : 'text'},
            ]
        },
        {
            name: 'operation',
            columns: [
                { name : 'block_id'  , type: 'text'},
                { name : 'timestamp' , type: 'integer'},
                { name : 'memo_hash' , type: 'text'}
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
                {name : 'x_id',                   type   : 'integer primary key'},
                {name : 'x_asset_id',             type   : 'integer'},
                {name : 'status',                 type   : 'text'}, 
                {name : 'quoted_at',              type   : 'integer'},
                {name : 'created_at',             type   : 'integer'},
                {name : 'cl_pay_curr',            type   : 'text'},
                {name : 'cl_pay_addr',            type   : 'text'},
                {name : 'cl_pay_tx',              type   : 'text unique'},
                {name : 'canceled',               type   : 'integer'},      
                {name : 'rate',                   type   : 'text'},
                {name : 'cl_pay',                 type   : 'text'},
                {name : 'balance',                type   : 'text'},
                {name : 'expired',                type   : 'integer'},
                {name : 'cl_recv',                type   : 'text'},             
                {name : 'cl_recv_tx',             type   : 'text unique'},      
                {name : 'cl_recv_addr',           type   : 'text'},             
                {name : 'cl_recv_curr',           type   : 'text'},              
                {name : 'tx_type',                type   : 'text'},
                {name : 'updated_at',             type   : 'integer'}
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
