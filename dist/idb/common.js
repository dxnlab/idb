export function appendRequestHandlers(request, handlers) {
    if (handlers) {
        Object.entries(handlers)
            .filter(([event, handler]) => event && handler && typeof handler === 'function')
            .forEach(([event, handler]) => {
            /^on.+/i.test(event)
                ? request[event.toLowerCase()] = handler
                : request.addEventListener(event, handler);
        });
    }
    return request;
}
export function promiseRequest(request) {
    const basis = new Promise((resolve, reject) => {
        request.onsuccess = (ev) => resolve((ev.target?.result ?? request.result));
        request.onerror = (ev) => {
            console.error('promise request error:', ev, request);
            reject(ev.target?.error ?? ev.error ?? request.error);
        };
    });
    return basis;
}
export function promisedRequest(builder, handlerBuilder) {
    return (...args) => {
        const req = builder(...args);
        if (handlerBuilder) {
            const handlers = handlerBuilder(...args);
            appendRequestHandlers(req, handlers);
        }
        return Object.defineProperty(promiseRequest(req), 'request', { value: req });
    };
}
export class Queriable {
    basis;
    constructor(basis) {
        this.basis = basis;
    }
    /** bind request */
    get keyPath() { return this.basis.keyPath; }
    get name() { return this.basis.name; }
    async binds(fnname, ...args) {
        // @ts-ignore
        return await promiseRequest(this.basis[fnname](...args));
    }
    // IDB<Target>.count
    async count(query) {
        return await promiseRequest(this.basis.count(query));
    }
    async get(key) {
        return await promiseRequest(this.basis.get(key));
    }
    // IDB<Target>.getKey
    async getKey(key) {
        return await promiseRequest(this.basis.getKey(key));
    }
    // IDB<Target>.getAll
    async getAll(query, count) {
        return await promiseRequest(this.basis.getAll(query, count));
    }
    // IDB<Target>.getAllKeys
    async getAllKeys(query, count) {
        return await promiseRequest(this.basis.getAllKeys(query, count));
    }
    // !Disclaimer
    // IDB<Target>.getAllRecords
    async getAllRecords(option) {
        return await promiseRequest(this.basis.getAllRecords(option));
    }
    // IDB<Target>.openCursor
    async openCursor(query, direction) {
        return await promiseRequest(this.basis.openCursor(query, direction));
    }
    // IDB<Target>.openKeyCursor
    async openKeyCursor(query, direction) {
        return await promiseRequest(this.basis.openKeyCursor(query, direction));
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
        for await (const c of this.openGenerator(query, direction)) {
            yield c.value;
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
