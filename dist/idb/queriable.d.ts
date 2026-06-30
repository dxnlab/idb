export declare class Queriable<T> {
    protected basis: T;
    constructor(basis: T);
    /** bind request */
    protected binds(name: string, ...args: any[]): Promise<unknown>;
    get keyPath(): any;
    get name(): any;
    get count(): (query?: IDBKeyRange) => Promise<number>;
    get get(): (key: IDBValidKey) => Promise<any>;
    get getKey(): (key: IDBValidKey) => Promise<any>;
    get getAll(): (query?: any, count?: number) => Promise<any[]>;
    get getAllKeys(): (query?: any, count?: number) => Promise<any[]>;
    get getAllRecords(): (option?: object) => Promise<any[]>;
    get openCursor(): (query?: object, direction?: IDBCursorDirection) => Promise<IDBCursorWithValue>;
    get openKeyCursor(): (query?: object, direction?: IDBCursorDirection) => Promise<IDBCursor>;
    /**
     * open query generator
     * @param query
     * @param direction
     *
     * for await (const cursor of target.openGenerator()) {
     *   // DO with cursor
     * }
     */
    openGenerator(query?: object, direction?: IDBCursorDirection): AsyncGenerator<IDBCursorWithValue>;
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
    valueGenerator(query?: object, direction?: IDBCursorDirection): AsyncGenerator;
    /**
     * open query generator, with keys only
     * @param query
     * @param direction
     *
     * for await (const key of target.keyGenerator()) {
     *   // DO with keys
     * }
     */
    keyGenerator(query?: object, direction?: IDBCursorDirection): AsyncGenerator<IDBValidKey>;
}
