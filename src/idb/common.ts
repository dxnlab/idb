type RequestBuilder = (...args:any[])=>EventTarget
type RequestHandlers = {[event:string]:Function|null};
type RequestHandlerBuilder = (...args:any[])=>RequestHandlers;

export function appendRequestHandlers(request:any, handlers?:RequestHandlers) {
  if(handlers) {
    Object.entries(handlers)
      .filter(([event, handler])=>event && handler && typeof handler === 'function')
      .forEach(([event, handler])=>{
        /^on.+/i.test(event) 
          ? request[event.toLowerCase()] = handler
          : request.addEventListener(event, handler);
      });
  }
  return request;
}

export function promiseRequest<R>(request:any):Promise<R> {
  const basis = new Promise<R>((resolve, reject) => {
    request.onsuccess = (ev:any)=>resolve((ev.target?.result ?? request.result) as R);
    request.onerror = (ev:any)=>{
      console.error('promise request error:', ev, request);
      reject(ev.target?.error ?? ev.error ?? request.error)
    };
  });
  
  return basis;
}

export function promisedRequest<R>(builder:RequestBuilder, handlerBuilder?:RequestHandlerBuilder) {
  return (...args:any[]):Promise<R>=>{
    const req = builder(...args);
    if(handlerBuilder) {
      const handlers = handlerBuilder(...args);
      appendRequestHandlers(req, handlers);
    }
    return  Object.defineProperty(promiseRequest<R>(req), 'request', { value: req });
  }
}

export function range<T extends IDBValidKey>(min:T|null|undefined=undefined, max:T|null|undefined=undefined, minOpen:boolean=false, maxOpen:boolean=false):IDBKeyRange {
  switch (true) {
    // min & max set
    case min!=undefined && max!=undefined:
      return min == max 
        ? IDBKeyRange.only(min) 
        : IDBKeyRange.bound(min, max, minOpen, maxOpen);
    // min set
    case min!=undefined && max==undefined:
      return IDBKeyRange.lowerBound(min, minOpen);
    // max set
    case min==undefined && max!=undefined:
      return IDBKeyRange.upperBound(max, maxOpen);
    // min & max lost
    case min==undefined && max==undefined:
      throw new Error('Invalid range: both min and max are undefined');
  }
}



export class Queriable<T extends IDBObjectStore|IDBIndex> {


  constructor(protected basis:T){}

  /** bind request */
  public get keyPath():string|string[] { 
    return (this.basis as any).keyPath; 
  }
  public get keyPathes():string[] { 
    const path = this.keyPath;
    return Array.isArray(path) ? path : [path];
  }
  public get name() { return (this.basis as any).name; }
  protected async binds<T>(fnname:string, ...args:any[]) {
    // @ts-ignore
    return await promiseRequest<T>(this.basis[fnname](...args));
  }

  // IDB<Target>.count
  public async count(query?:IDBValidKey|IDBKeyRange) {
    return await promiseRequest<number>(this.basis.count(query));
  }

  public async get(key:IDBValidKey) {
    return await promiseRequest(this.basis.get(key));
  }


  // IDB<Target>.getKey
  public async getKey(key:IDBValidKey) {
    return await promiseRequest<IDBValidKey>(this.basis.getKey(key));
  }

  // IDB<Target>.getAll
  public async getAll(query?:IDBValidKey|IDBKeyRange, count?:number) {
    return await promiseRequest(this.basis.getAll(query, count));
  }

  // IDB<Target>.getAllKeys
  public async getAllKeys(query?:IDBValidKey|IDBKeyRange, count?:number) {
    return await promiseRequest<IDBValidKey>(this.basis.getAllKeys(query, count));
  }

  // !Disclaimer
  // IDB<Target>.getAllRecords
  public async getAllRecords(option?:object) {
    return await promiseRequest(this.basis.getAllRecords(option));
  }

  protected async *_cursorGenerator(requestor:'openCursor'|'openKeyCursor', { query, direction }) {
    const request = this.basis?.[requestor](query, direction);
    let { promise, resolve, reject } = Promise.withResolvers();
    let done = false;

    request.onsuccess = ({target})=>{
      const cursor = target.result;
      if(cursor) {
        resolve(cursor);
      } else {
        done = true;
      }
    }
    request.onerror = reject;

    while(!done) {
      const cursor = await promise;
      if(cursor) {
        yield cursor;
      }
      // fillup next
      ({ promise, resolve, reject } = Promise.withResolvers());
    }
  }

  public async *cursorGenerator(query, direction) {
    yield* this._cursorGenerator('openCursor', { query, direction });
  }

  public async *keyCursorGenerator(query, direction) {
    yield* this._cursorGenerator('openKeyCursor', { query, direction });
  }

  /** 
   * IDB<Target>.openCursor
   * !caution: MUST continue or advance the yielded cursor
   **/
  public async *openCursor(handler:(cursor:IDBCursorWithValue)=>any, {onError, query, direction}:{
      onError?:Function,
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
    }={}) {
    const request = this.basis.openCursor(query, direction);
    request.onsuccess = ({target})=>handler(target.result);
    if(typeof onError === 'function') {
      request.onerror = onError;
    }
  }

  // IDB<Target>.openKeyCursor
  public async *openKeyCursor(handler:(cursor:IDBCursor)=>any, {onError, query, direction}:{
    onError?:Function,
    query?:IDBValidKey|IDBKeyRange,
    direction?:IDBCursorDirection,
  }={}) {
    const request = this.basis.openKeyCursor(query, direction);
    request.onsuccess = ({target})=>handler(target.result);
    if(typeof onError === 'function') {
      request.onerror = onError;
    }
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

  private async *generator(requestCursor:'openCursor'|'openKeyCursor', retrieval:Function, {query, direction, having}:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}) {
      for await (const cursor of this._cursorGenerator(requestCursor, { query, direction })) {
        const ret = retrieval(cursor);
        if(having && !having(ret)) {
          continue;
        }
        yield ret;
        cursor.continue();
      }
  }

  protected async *groupGenerator({ query, direction, having }:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(cursor:IDBCursorWithValue)=>boolean,
    }={}) {
    
    let prev;
    let itmes = [];
    for await (const cursor of this._cursorGenerator('openCursor', { query, direction })) {
      // skipping loop
      if(having && !having(cursor)) { continue; }

      const { key, value } = cursor;

      if(prev == key) {
        items.push(value);
      } else {
        yield [prev, [...items]];
        // clear after yield
        prev = key;
        items = [value];
      }
      // keep running
      cursor.continue();
    }
    // finalizing
    yield [prev, items];
  }

  public async *openGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursorWithValue> {
      yield* this.generator('openCursor', (c)=>c, param);
  }

  public async *valueGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursorWithValue> {
    yield* this.generator('openCursor', ({value})=>value, param);
  }

  public async *keyGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursor> {
    yield *this.generator('openKeyCursor', ({key})=>key, param);
  }
}