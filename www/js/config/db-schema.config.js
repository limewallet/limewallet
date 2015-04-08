bitwallet_config
.constant('DB_CONFIG', {
    name: 'wallet.db',
    version : 1.2,
    tables: [
        // {
        //     name: 'master_key',
        //     columns: [
        //         {name : 'id',     type   : 'integer primary key'},
        //         {name : 'key',    type   : 'text'},
        //         {name : 'deriv',  type   : 'integer'}
        //     ]
        // },
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
            name: 'address_book',
            columns: [
                {name : 'id',          type   : 'integer primary key'},
                {name : 'address',     type   : 'text unique'},
                {name : 'name',        type   : 'text'},
                {name : 'is_favorite', type   : 'integer'}
            ]
        },
        {
            name: 'account',
            columns: [
                {name : 'id',                 type   : 'integer primary key'},
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
            name: 'operation',
            columns: [
                {name : 'id',                 type   : 'integer primary key'},
                {name : 'asset_id',           type   : 'integer'},
                {name : 'amount',             type   : 'text'},
                {name : 'other',              type   : 'text'},
                {name : 'date',               type   : 'integer'},
                {name : 'op_type',            type   : 'text'},
                {name : 'sign',               type   : 'integer'},
                {name : 'address',            type   : 'text'},
                {name : 'block',              type   : 'integer'},
                {name : 'block_id',           type   : 'text'},
                {name : 'tx_id',              type   : 'text'},
                {name : 'fee',                type   : 'text'},
                {name : 'addr_name',          type   : 'text'}
            ]
        },
        {
            name: 'raw_operation',
            columns: [
                {name : 'id',                 type   : 'integer primary key'},
                {name : 'asset_id',           type   : 'integer'},
                {name : 'amount',             type   : 'text'},
                {name : 'other',              type   : 'text'},
                {name : 'timestamp',          type   : 'integer'},
                {name : 'op_type',            type   : 'text'},
                {name : 'block',              type   : 'integer'},
                {name : 'txid',               type   : 'text'}
            ]
        },
        {
            name: 'exchange_transaction',
            columns: [
                {name : 'x_id',                   type   : 'integer primary key'},          // 34,
                {name : 'x_asset_id',             type   : 'integer'}, 
                {name : 'status',                 type   : 'text'}, 
                {name : 'quoted_at',              type   : 'integer'},
                {name : 'created_at',             type   : 'integer'},
                {name : 'cl_pay_curr',            type   : 'text'},             // 'BTC',
                {name : 'cl_pay_addr',            type   : 'text'},             // 'CEX53ETEcNhAbXsGr2sHYmNAHB5smBAtqT',
                {name : 'cl_pay_tx',              type   : 'text unique'},      // 'bfcce6d3b9c126200c2a32c79d8b5a89d2bf2bd4',
                {name : 'canceled',               type   : 'integer'},          // 0,
                {name : 'rate',                   type   : 'text'},             // '224.18991218',
                {name : 'cl_pay',                 type   : 'text'},             // '0.02230252',
                {name : 'balance',                type   : 'text'},             // '0.03230252',
                {name : 'expired',                type   : 'integer'},          // 0,
                {name : 'cl_recv',                type   : 'text'},             // '5.00000000',
                {name : 'cl_recv_tx',             type   : 'text unique'},      // 'bfcce6d3b9c126200c2a32c79d8b5a89d2bf2bd4',
                {name : 'cl_recv_addr',           type   : 'text'},             // 'DVS6KBKUMcWXvgY7c9sYqHv4p47baAn6NBPR',
                {name : 'cl_recv_curr',           type   : 'text'},              // 'USD'
                {name : 'tx_type',                type   : 'text'},
                {name : 'updated_at',             type   : 'integer'},
                {name : 'operation_tx_id',        type   : 'text'}
          ]
        },
        {
            name: 'balance',
            columns: [
                {name : 'asset_id',               type   : 'integer primary key'},
                {name : 'amount',                 type   : 'float'},
                {name : 'updated_at',             type   : 'integer'},
                {name : 'raw_amount',             type   : 'integer'}
          ]
        }
    ],
});
