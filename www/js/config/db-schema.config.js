bitwallet_config
.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.2,
    tables: [
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
                {name : 'is_default', type   : 'integer'},
                {name: 'UNIQUE (deriv, label) ', type   : 'ON CONFLICT ABORT'}
            ]
        },
        {
            name: 'account',
            columns: [
                {name : 'id',                 type   : 'integer primary key'}, // pubkey
                {name : 'name',               type   : 'text unique'},
                {name : 'gravatar_id',        type   : 'text'},
                {name : 'registered',         type   : 'integer'},
                {name : 'key',                type   : 'text'},
                {name : 'deriv',              type   : 'integer'}
            ]
        },
        {
            name: 'setting',
            columns: [
                {name : 'name',               type   : 'text primary key'},
                {name : 'value',              type   : 'text'}
            ]
        },
        {
            name: 'user',
            columns: [
                {name : 'id',                 type   : 'text primary key'},
                {name : 'name',               type   : 'text unique'}, 
                {name : 'address',            type   : 'text unique'},
                {name : 'public_data',        type   : 'text'},
                {name : 'source',             type   : 'text'},
                {name : 'created_at',         type   : 'integer'}
            ]
        },
        {
            name: 'memo',
            columns: [
                {name : 'id',                 type   : 'text primary key'},
                {name : 'message',            type   : 'text'}, 
                {name : 'pubkey',             type   : 'text'},
                {name : 'type',               type   : 'integer'}
            ]
        },
        {
            name: 'memo_out',
            columns: [
                {name : 'id',                 type   : 'text primary key'},
                {name : 'message',            type   : 'text'}, 
                {name : 'destination',        type   : 'text'}
            ]
        },

        {
            name: 'operation',
            columns: [
                { name : 'fee'       , type: 'text'},
                { name : 'sign'      , type: 'integer'},

                { name : 'txid'      , type: 'text'},
                { name : 'balance'   , type: 'text'},
                { name : 'block'     , type: 'integer'},
                { name : 'block_id'  , type: 'text'},
                { name : 'op_type'   , type: 'text'},
                { name : 'address'   , type: 'text'},
                { name : 'amount'    , type: 'integer'},
                { name : 'asset_id'  , type: 'integer'},
                { name : 'timestamp' , type: 'integer'},
                { name : 'memo_id'   , type: 'text'}
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
