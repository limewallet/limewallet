bitwallet_config
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
