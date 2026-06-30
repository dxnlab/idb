/**
 * proxy wrapping IDBTransaction
 *  - set it to be promise (abort on error, reject on abort; resolve at complete)
 *  - direct StoreProxy getters by store name
 *  - reserve any other names
 */
import StoreProxy from "./store";
async function wrapProxy(builder) {
    const tx = await builder();
    const storeNames = Array.from(tx.objectStoreNames);
    const storeSingulars = {};
    return Object.defineProperties(tx, Object.fromEntries(storeNames.map((name) => [
        name,
        {
            get() {
                if (!storeSingulars?.[name]) {
                    storeSingulars[name] = new StoreProxy(tx, name);
                }
                return storeSingulars[name];
            }
        }
    ])));
}
export default function (builder) {
    // wrap proxy
    return (runner, args = [], binded) => new Promise(async (resolve, reject) => {
        const tx = await wrapProxy(builder);
        let result;
        let error;
        tx.onabort = reject;
        tx.onerror = (ev) => {
            error = error || ev;
            tx.abort();
        };
        tx.oncomplete = () => {
            resolve(result);
        };
        try {
            result = await runner.apply(binded, [tx, ...args]);
            // invoke on complete
            if (tx.mode == 'readonly') {
                resolve(result);
            }
            else {
                tx.commit();
            }
        }
        catch (err) {
            console.error(err);
            error = err;
            tx.abort();
        }
    });
}
