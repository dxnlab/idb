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

  // IDB<Target>.openCursor
  public async openCursor(query?:IDBValidKey|IDBKeyRange, direction?:IDBCursorDirection) {
    return await promiseRequest<IDBCursorWithValue>(this.basis.openCursor(query, direction));
  }

  // IDB<Target>.openKeyCursor
  public async openKeyCursor(query?:IDBValidKey|IDBKeyRange, direction?:IDBCursorDirection) {
    return await promiseRequest<IDBCursor>(this.basis.openKeyCursor(query, direction));

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

  protected async *generator(requestCursor:Function, retrieval:Function, {query, direction, having}:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}) {
    const cursor = await requestCursor(query, direction);
    while(cursor) {
      const ret = retrieval(cursor);
      if(!having || having(ret)) {
        yield ret;
      }
    }
  }

  public async *openGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursorWithValue> {
    return this.generator(this.openCursor, (cursor:IDBCursorWithValue)=>cursor, param);
  }

  public async *valueGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursorWithValue> {
    return this.generator(this.openCursor, ({value}:IDBCursorWithValue)=>value, param);
  }

  public async *keyGenerator(param:{
      query?:IDBValidKey|IDBKeyRange,
      direction?:IDBCursorDirection,
      having?:(it:any)=>boolean,
    }={}):AsyncGenerator<IDBCursor> {
    return this.generator(this.openKeyCursor, ({key}:IDBCursor)=>key, param);
  }

}