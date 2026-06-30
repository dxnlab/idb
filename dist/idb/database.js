import { promisedRequest } from "./common";
import wrapTransaction from './database.transaction';
import idbMigration from './database.migration';
export const factory = globalThis.indexedDB;
/** --- IDBFactory ---
 *
 */
// - [x] IDBFactory.databases()
export async function showDatabases() {
    return await factory.databases();
}
// - [ ] IDBFactory.cmp()
export function cmp(first, second) {
    return factory.cmp(first, second);
}
function _buildHandlers(option) {
    return option ? {
        onUpgradeNeeded: idbMigration(option),
        onBlocked: option?.blocked ? (ev) => option.blocked(ev.target.result) : null,
    } : {};
}
// - [x] IDBFactory.open
export const connect = promisedRequest(
// builder
(database, option) => factory.open(database, option?.version), 
// handles
(_, option) => _buildHandlers(option));
// - [x] IDBFactory.deleteDatabase
export const drop = promisedRequest((database) => factory.deleteDatabase(database));
// - [x] IDBDatabase.close
export async function disconnect(db) {
    return new Promise((resolve, reject) => {
        let _closed = false;
        const closure = () => {
            if (!_closed) {
                _closed = true;
                resolve(true);
            }
        };
        try {
            db.addEventListener('close', closure);
            db.close();
            // timeout to close
            setTimeout(closure, 1e2);
        }
        catch (ex) {
            console.error(ex);
            reject(ex);
        }
    });
}
// - [x] IDBDatabase.transaction (wrapper)
export function transaction(db, { stores, mode, option }) {
    return wrapTransaction(async () => (await db).transaction(stores, mode, option));
}
/** --- IDBDatabase:migrations ---
 *
 */
export default {
    factory,
    showDatabases,
    cmp,
    connect,
    drop,
    disconnect,
    transaction,
};
