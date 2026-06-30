type RequestBuilder = (...args: any[]) => EventTarget;
type RequestHandlers = {
    [event: string]: Function | null;
};
type RequestHandlerBuilder = (...args: any[]) => RequestHandlers;
export declare function appendRequestHandlers(request: any, handlers?: RequestHandlers): any;
export declare function promiseRequest<R>(request: any): Promise<R>;
export declare function promisedRequest<R>(builder: RequestBuilder, handlerBuilder?: RequestHandlerBuilder): (...args: any[]) => Promise<R>;
export declare class Queriable<T extends IDBObjectStore | IDBIndex> {
    protected basis: T;
    constructor(basis: T);
    /** bind request */
    get keyPath(): any;
    get name(): any;
    protected binds(fnname: string, ...args: any[]): Promise<unknown>;
    count(query?: IDBValidKey | IDBKeyRange): Promise<unknown>;
    get(key: IDBValidKey): Promise<unknown>;
    getKey(key: IDBValidKey): Promise<unknown>;
    getAll(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<unknown>;
    getAllKeys(query?: IDBValidKey | IDBKeyRange, count?: number): Promise<unknown>;
    getAllRecords(option?: object): Promise<unknown>;
    openCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<unknown>;
    openKeyCursor(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): Promise<unknown>;
    /**
     * open query generator
     * @param query
     * @param direction
     *
     * for await (const cursor of target.openGenerator()) {
     *   // DO with cursor
     * }
     */
    openGenerator(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): AsyncGenerator<{}, void, unknown>;
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
    valueGenerator(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): AsyncGenerator<any, void, unknown>;
    /**
     * open query generator, with keys only
     * @param query
     * @param direction
     *
     * for await (const key of target.keyGenerator()) {
     *   // DO with keys
     * }
     */
    keyGenerator(query?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): AsyncGenerator<any, void, unknown>;
}
export {};
