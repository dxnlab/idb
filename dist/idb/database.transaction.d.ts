/**
 * proxy wrapping IDBTransaction
 *  - set it to be promise (abort on error, reject on abort; resolve at complete)
 *  - direct StoreProxy getters by store name
 *  - reserve any other names
 */
import type { May } from '../types';
export default function (builder: () => May<IDBTransaction>): (runner: Function, args?: any[], binded?: any) => Promise<any>;
