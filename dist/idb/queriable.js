import { promiseRequest } from "./common";
export class Queriable {
    basis;
    constructor(basis) {
        this.basis = basis;
    }
    /** bind request */
    binds(name, ...args) {
        return promiseRequest(this.basis?.[name](...args));
    }
    get keyPath() { return this.basis.keyPath; }
    get name() { return this.basis.name; }
    // IDB<Target>.count
    get count() {
        return (query) => this.binds('count', query);
    }
    // IDB<Target>.get
    get get() {
        return (key) => this.binds('get', key);
    }
    // IDB<Target>.getKey
    get getKey() {
        return (key) => this.binds('getKey', key);
    }
    // IDB<Target>.getAll
    get getAll() {
        return (query, count) => this.binds('getAll', query, count);
    }
    // IDB<Target>.getAllKeys
    get getAllKeys() {
        return (query, count) => this.binds('getAllKeys', query, count);
    }
    // !Disclaimer
    // IDB<Target>.getAllRecords
    get getAllRecords() {
        return (option) => this.binds(typeof this.basis.getAllRecords === 'function' ? 'getAllRecords' : 'getAll', option);
    }
    // IDB<Target>.openCursor
    get openCursor() {
        return (query, direction) => this.binds('openCursor', query, direction);
    }
    // IDB<Target>.openKeyCursor
    get openKeyCursor() {
        return (query, direction) => this.binds('openKeyCursor', query, direction);
    }
    /**
     * open query generator
     * @param query
     * @param direction
     *
     * for await (const cursor of target.openGenerator()) {
     *   // DO with cursor
     * }
     */
    async *openGenerator(query, direction) {
        const cursor = await this.openCursor(query, direction);
        while (cursor) {
            yield cursor;
            cursor.continue();
        }
    }
    /**
     * open query generator, with values only
     * @param query
     * @param direction
     *
     * for await (const value of target.valueGenerator()) {
     *  // DO with value
     * }
     *
     */
    async *valueGenerator(query, direction) {
        const cursor = await this.openCursor(query, direction);
        while (cursor) {
            yield cursor.value;
            cursor.continue();
        }
    }
    /**
     * open query generator, with keys only
     * @param query
     * @param direction
     *
     * for await (const key of target.keyGenerator()) {
     *   // DO with keys
     * }
     */
    async *keyGenerator(query, direction) {
        const cursor = await this.openKeyCursor(query, direction);
        while (cursor) {
            yield cursor.key;
            cursor.continue();
        }
    }
}
