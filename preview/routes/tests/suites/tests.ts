/**
 * Async Unit Testing class
 */
export class AssertFail extends Error {
  constructor(message?:string) {
    super(message);
  }
}

const uniqueid = ()=>(Date.now()*(.1+Math.random())).toString(16);

export async function assert(condition:unknown, message?:string) {
  let assertion;
  let asserted = false;
  while(!asserted) {
    if(typeof condition === 'function') {
      condition = condition;
    } else if(condition instanceof Promise) {
      condition = await condition;
    } else {
      asserted = true;
      assertion = condition;
    }
  }

  if(!assertion) {
    throw new AssertFail(message);
  }
}

class TestNode extends EventTarget {

  private _id:string;
  protected children?:Array<TestNode>;
  protected result?:unknown;
  protected error?:Error;

  constructor(private readonly test:Function) {
    super();
    this._id = uniqueid();
  }

  public get id(){ return this._id }

  protected get hasChildren() {
    return Array.isArray(this.children) && 0<this.children.length;
  }


  then(...after:TestNode[]) {
    this.children = (this.children || []).concat(after);
  }

  emit(event:string, data:object={}) {
    const e = Object.assign(new CustomEvent(event), {
      ...data,
      ...this.toMessage,
      timestamp: Date.now(),
    });
    this.dispatchEvent(e);
  }

  toMessage() {
    return {
      id: this.id,
      result: this.result,
      error: this.error,
    };
  }


  public async run(...args:any[]) {
    try {
      this.emit('start');
      this.result = await this.test.apply(this, args);
      this.emit('pass');
      if(this.hasChildren) {
        await Promise.all(
          this.children!.map(async (nx)=>await nx.run(this.result))
        );
      } else {
        this.emit('clear');
      }
    } catch(ex) {
      this.error = ex as Error;
      this.emit('fail');
      throw ex;
    } finally {
      this.emit('complete');
    }
  }
}

/**
 * test(async ()=>{}).then(
 *    test(async ()=>{ }).then(
 *      test(async ()=>{ }),
 *      test(async ()=>{ }),
 *      test(async ()=>{ }),
 *    ),
 *    test(async ()=>{ }),
 *    test(async ()=>{ })
 *  )
 * 
 * @param fn 
 * @returns 
 */
export function test(fn:Function) {
  return new TestNode(fn);
}

export function worker(self:WindowOrWorkerGlobalScope, root:TestNode) {
  /**
   * root 
   */
  Object.entries({
    
  })
  self.addEventListener('message', ({data})=>{

  })
}