bitwallet_config
.constant('DB_CONFIG', {
    name    : 'wallet.db',
    version : 13,
    upgrades: {
      '12-13' : [
        'ALTER TABLE memo ADD COLUMN name text default null',
        'ALTER TABLE memo ADD COLUMN to_pubkey default null',
        'ALTER TABLE memo ADD COLUMN decrypt_error integer default 0',
        'DELETE FROM memo',
        "INSERT or REPLACE into setting (name, value) values ('schema_version',13)",
        "CREATE INDEX inx_memo_address on memo (address)",
        "CREATE INDEX inx_memo_pubkey on memo (pubkey)",
        "CREATE INDEX inx_operation_txid on operation (txid)",
        "CREATE INDEX inx_operation_memo_hash on operation (memo_hash)",
        "CREATE INDEX inx_operation_address on operation (address)",
        "CREATE INDEX inx_exchange_transaction_cl_pay_tx on exchange_transaction (cl_pay_tx)",
        "CREATE INDEX inx_exchange_transaction_cl_recv_tx on exchange_transaction (cl_recv_tx)",
        "CREATE INDEX inx_exchange_transaction_extra_data on exchange_transaction (extra_data)"
      ]
    },
    tables  : [
        {
            name    : 'account',
            columns : [
                { name : 'id',                type  : 'integer primary key'},
                { name : 'name',              type  : 'text unique not null'},
                { name : 'address',           type  : 'text unique not null'},
                { name : 'pubkey',            type  : 'text unique not null'},
                { name : 'privkey',           type  : 'text unique not null'},

                { name : 'number',            type  : 'integer unique not null'},
                { name : 'account_mpk',       type  : 'text unique not null'},
                { name : 'memo_mpk',          type  : 'text unique not null'},
                { name : 'skip32_key',        type  : 'text unique not null'},
                { name : 'encrypted',         type  : 'integer not null'},

                { name : 'active',            type  : 'integer default 1'},
                { name : 'avatar_hash',       type  : 'text'},
                { name : 'public_data',       type  : 'text'},
                { name : 'registered',        type  : 'integer default 0'}, // -1:no, 1:yes, 0:unknown
                { name : 'access_key',        type  : 'text unique not null'},
                { name : 'secret_key',        type  : 'text unique not null'},
                { name : 'created_at',        type  : 'datetime default CURRENT_TIMESTAMP'}
            ],
            indexes : []
        },
        {
            name    : 'setting',
            columns : [
                { name : 'name',              type   : 'text primary key'},
                { name : 'value',             type   : 'text'}
            ],
            indexes : []
        },
        {
            name    : 'contact',
            columns : [
                { name : 'id',                type  : 'integer primary key'},
                { name : 'name',              type  : 'text unique not null'}, 
                { name : 'address',           type  : 'text unique'},
                { name : 'pubkey',            type  : 'text unique'},
                { name : 'source',            type  : 'text not null'},
                { name : 'avatar_hash',       type  : 'text'},
                { name : 'created_at',        type  : 'datetime default CURRENT_TIMESTAMP'},
                { name : 'backup',            type  : 'integer default 0'}
            ],
            indexes : []
        },
        {
            name    : 'memo',
            columns : [
                { name : 'id',                  type  : 'text primary key'},
                { name : 'account',             type  : 'integer not null'}, 
                { name : 'encrypted',           type  : 'integer default 1'}, 
                { name : 'memo',                type  : 'text'}, 
                { name : 'one_time_key',        type  : 'text'}, 
                { name : 'message',             type  : 'text'}, 
                { name : 'name',                type  : 'text default null'}, //v13
                { name : 'decrypt_error',       type  : 'integer default 0'}, //v13
                { name : 'pubkey',              type  : 'text'},
                { name : 'to_pubkey',           type  : 'text default null'}, //v13
                { name : 'in_out',              type  : 'integer not null'},
                { name : 'slate',               type  : 'integer'},
                { name : 'address',             type  : 'text'}
            ],
            indexes : ['address','pubkey']
        },
        {
            name    : 'operation',
            columns : [
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
                { name : 'slate'     , type: 'integer'}
            ],
            indexes : ['txid','memo_hash','address']
        },
        {
            name    : 'exchange_transaction',
            columns : [
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
                { name : 'book',                   type   : 'text'},
                { name : 'quoted_at',              type   : 'integer'},
                { name : 'updated_at',             type   : 'integer'},
                { name : 'status',                 type   : 'text'},
                { name : 'extra_data',             type   : 'text'},
                { name : 'cl_cmd',                 type   : 'text'},
                { name : 'created_at',             type   : 'integer'}
            ],
            indexes : ['cl_pay_tx','cl_recv_tx','extra_data']
        },
        {
            name    : 'balance',
            columns : [
                {name : 'id',                     type   : 'string primary key'},
                {name : 'address',                type   : 'string'},
                {name : 'amount',                 type   : 'integer'},
                {name : 'asset_id',               type   : 'integer'},
            ],
            indexes : []
        }
    ],
});
