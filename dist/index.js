import { showDatabases, cmp, connect, disconnect, drop, transaction, } from "./idb/database";
const databaseKey = 'idb';
const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`AssertionFail: ${message}`);
    }
};
export function idb(database, option) {
    return (cls, context) => {
        //
        assert(context?.kind === 'class', `class decorator`);
        // mixin static
        const singleDBKey = `_${databaseKey}$` + (Date.now() + Math.random()).toString(36);
        const connector = () => {
            if (!cls[singleDBKey]) {
                cls[singleDBKey] = connect(database, option);
            }
            return cls[singleDBKey];
        };
        const disconnector = () => {
            if (cls[singleDBKey]) {
                disconnect(cls[singleDBKey]);
                delete cls[singleDBKey];
            }
        };
        Object.defineProperties(cls, {
            // list database info
            showDatabases: { value: showDatabases },
            // cmp
            cmp: { value: cmp },
            // connect database singletone getter 
            [databaseKey]: {
                // gets Promise<IDBDatabase>
                get() { return cls.connect(); },
                set(_) { cls.disconnect(); },
                enumerable: true,
            },
            // connect concurrent singletone
            connect: { value: connector },
            // disconnect concurrent singletone
            disconnect: { value: disconnector },
            transaction: { value: transaction },
            drop: { value: drop, },
        });
    };
}
const trxAvailableKinds = ['method', 'getter', 'setter', 'accessor'];
export function trx(stores, mode, option) {
    return function (runner, context) {
        assert(trxAvailableKinds.includes(context.kind), `transaction should be one of; ${trxAvailableKinds.join(',')} but ${context.kind}`);
        return async function (...args) {
            const cls = this.constructor;
            // transaction wrapper callable
            const withinTrx = cls.transaction(stores, mode, option);
            // run the transaction
            return await withinTrx(runner, args, this);
        };
    };
}
export function reads(...args) {
    const stores = args.filter((v) => typeof v === 'string');
    const option = args.find((v) => typeof v !== 'string') || undefined;
    return trx(stores, 'readonly', option);
}
export function writes(...args) {
    const stores = args.filter((v) => typeof v === 'string');
    const option = args.find((v) => typeof v !== 'string') || undefined;
    return trx(stores, 'readwrite', option);
}
