
export class AssertFail extends DOMException {
  constructor(message?:string) { super(message, 'AssertFail') }
}
export class TimeoutFail extends DOMException { 
  constructor(message?:string) { super(message, 'FailByTimedout') }
}

export enum LogSeverity {
  INFO = 'info',
  DEBUG = 'debug',
  WARN = 'warning',
  ERR = 'error',
};

export enum TestStatus  {
  PASS= 'PASS',
  FAIL= 'FAIL',
  IN_PROGRESS= 'IN PROGRESS',
  STOPPED = 'STOPPED',
  UNKNOWN= 'UNKNOWN',
};

export enum TestEvents {
  //
  START= 'start',
  // resolved pass
  PASS= 'pass',
  // exception throwed or assertion failed
  FAIL= 'fail',
  // rejected by timeout
  TIMEOUT= 'timeout',
  // explicit canceled 
  CANCELED= 'canceled',
  // finally
  DONE= 'done'

}

class EventEmitter extends EventTarget {
  protected emit(eventName:string, params:any) {
    const ev = Object.assign(new CustomEvent(eventName), {
      ...params,
    });
    this.dispatchEvent(ev);
  }
}


class Asserts extends EventEmitter {
  constructor(){ super() }

  protected async determine(determinant:Function|Promise<any>|boolean) {
    if(typeof determinant === 'function') {
      determinant = await determinant();
    } 
    // should await?
    return await determinant;
  }

  public async assert(
    condition:Function|Promise<any>|boolean, 
    message?:string) {
      const det = await this.determine(condition);
      if(await this.determine(condition)) {
        throw new AssertFail(`[Assertion] ${det}: ${message}`);
      }
      return true;
  }

  public async assertEqual(expected:any, actual:any, message?:string) {
    return this.assert(async ()=>await this.determine(expected) == await this.determine(actual), message);
  }

  public async assertInstanceof(actual:any, cls:any, message?:string) {
    return this.assert(async ()=>await this.determine(actual) instanceof cls, message);
  }

  public async assertThrows(runner:Function, throws:any[], message?:string) {
    return this.assert(async ()=>{
      try {
        await this.determine(runner);
        // none expected pass
        return false;
      } catch(ex) {
        const catched = throws.find((t)=>ex instanceof t);
        // found the exception
        if(catched) { return catched; } 
        else { throw ex; }
      }
    }, message);
  }

}

export type UnitTestOption = {
  title?:string,
  description:string,
  before?:Function,
  after?:Function,
  timeout?:number,
  skipIf?:Function,
};

export class UnitTest extends Asserts {
  protected runtime_id:string;
  protected progress?:Promise<any>;
  protected result?:any;
  protected error?:any;
  protected elapsed?:{
    start: number,
    done?: number,
    stopped?: number,
  }

  constructor(
    protected readonly testFn:Function,
    protected readonly options?:UnitTestOption
  ) { 
    super();
    this.runtime_id = (Date.now()+Math.random()).toString(16);
  }

  public get id() { return this.runtime_id }

  public get status() {
    // when progress set
    if(this.elapsed?.done) {
      if(this.error) { return TestStatus.FAIL; } 
      else if(this.result) { return TestStatus.PASS; }
    } 
    else if(this.elapsed?.stopped) {
      return TestStatus.STOPPED;
    }
    else if(this.elapsed?.start) {
      return TestStatus.IN_PROGRESS
    }
    // defaults
    return TestStatus.UNKNOWN;
  }

  public get resolved() { return this.status === TestStatus.PASS ? this.result : undefined; }
  public get rejected() { return this.status === TestStatus.FAIL ? this.error : undefined; }
  public get elapsedTime() { return this.elapsed }

  protected async progressWorker(...args:any[]):Promise<any> {
    return new Promise(async (resolve, reject)=>{
      let params = args;
      try {
        if(this.options?.before) {
          params = await this.options!.before!.apply(this, params) || args;
        }
        let rs = await this.testFn.apply(this, params);
        if(this.options?.after) {
          const afterParams = Array.isArray(rs) ? rs : (rs!=null ? [rs] : args);
          rs = await this.options!.after!.apply(this, afterParams);
        }
        resolve(rs);
      } catch(ex) {
        reject(ex);
      }
    });
  }

  protected emit(eventName:string, params:any) {
    const ev = Object.assign(new CustomEvent(eventName), {
      ...params,
      id: this.id,
    });
    this.dispatchEvent(ev);
  }

  protected progressTimer():Promise<any> {
    const timeouts = this.elapsed!.start + (this.options?.timeout ?? 60e3);
    return new Promise((resolve, reject)=>{
      setInterval(()=>{
        const now = Date.now();
        // timeout
        if(timeouts <= now) {
          this.error = new TimeoutFail(`timedout ${this.options!.timeout!} at ${this.elapsed?.start}-${now}`);
          this.emit(TestEvents.TIMEOUT, {timeout: now});
          reject(this.error);
        } 
        // canceled
        else if(this?.elapsed?.stopped) {
          this.emit(TestEvents.CANCELED, {stopped: true, elapsed:this.elapsed });
          resolve(undefined);
        }
      }, 10);
    })
  }

  public start(...args:any[]):Promise<any> {
    // clear now
    this.progress = undefined;
    this.elapsed = { start: Date.now() }
    this.result = undefined;
    this.error = undefined;

    this.emit(TestEvents.START, this.elapsed!);

    // assign progress
    const runner = Promise.race([
      // testFn flows
      this.progressWorker(...args),
      // timeout or force quick
      this.progressTimer(),
    ]);
    runner
      .then((resolved)=>{  
        this.emit(TestEvents.PASS, {pass: resolved});
        this.result = resolved || {};
      })
      .catch((exception)=>{ 
        this.error = exception;
        this.emit(TestEvents.FAIL, {fail: exception});
      })
      .finally(()=>{ 
        this.elapsed!.done = Date.now();
        this.emit(TestEvents.DONE, {
          result: this.result,
          error: this.error,
          elapsed: this.elapsed,
        });
      });
    this.progress = runner;
    return runner;
  }

  public forceStop() {
    if(this.elapsed) { 
      this.elapsed!.stopped = Date.now();
    }
  }

  public toMessage() {
    return ({
      id: this.id,
      title: this.options?.title || '',
      description: this.options?.description || '',
      timeout: this.options?.timeout || undefined,
      status: this.status,
      result: this.result,
      error: this.error,
    });
  }
}


export class TestSuite extends EventEmitter {
  public readonly units:UnitTest[];
  protected cursor?:UnitTest;
  protected _progress?:Promise<any>;
  protected _proceed?:boolean;

  public static unit(testFn:Function, option?:UnitTestOption) {
    return new UnitTest(testFn, option);
  }

  public static units(testFns:Function[], option?:UnitTestOption) {
    return new UnitTest(async (...args:any)=>Promise.all(
      testFns.map(async (t)=>await t(...args))
    ), option);
  }

  constructor(...units:UnitTest[]) {
    super();
    this.units = units;
    const eventBubbles = Object.entries({
      [TestEvents.START]: ({start}:any)=>{
        this.emit(TestEvents.START, { started: start, id: this.cursor!.id });
      },
      [TestEvents.TIMEOUT]: ({timeout}:any)=>{
        this.emit(TestEvents.TIMEOUT, { timedout: timeout, id: this.cursor!.id });
      },
      [TestEvents.PASS]: ({pass}:any)=>{
        this.emit(TestEvents.PASS, { pass, id: this.cursor!.id });
      },
      [TestEvents.FAIL]: ({fail}:any)=>{
        this.emit(TestEvents.FAIL, { fail, id:this.cursor!.id });
      },
      [TestEvents.CANCELED]: ({stopped, elapsed}:any)=>{
        this.emit(TestEvents.CANCELED, { stopped, elapsed, id:this.cursor!.id });
      },
      [TestEvents.DONE]:({result,error,elapsed}:any)=>{
        this.emit(TestEvents.DONE, { result, error, elapsed, id:this.cursor!.id });
      }
    });
    this.units.forEach((unit)=>{
      eventBubbles.forEach(([event, handler])=>{unit.addEventListener(event, handler)});
    });
  }

  public async run(...args:any[]) {
    if(this._proceed) {
      return;
    }
    this._proceed = true;
    //
    let params = args;
    let interval;
    const resetInterval = ()=>{
      if(interval!) {
        clearInterval(interval);
      }
    }

    for(const unit of this.units) {
      resetInterval();
      //
      this.cursor = unit;
      //
      this.cursor.start(...params);
      // wait until cursor to be done
      const runner = new Promise((resolve, reject)=>{
        interval = setInterval(()=>{
          // force quit
          if(!this._proceed) { 
            this.cursor!.forceStop(); 
            reject(TestEvents.CANCELED);
          }
          switch(this.cursor!.status) {
            case TestStatus.PASS:
              return resolve(this.cursor!.resolved);
            case TestStatus.FAIL:
              return reject(TestEvents.FAIL);
            case TestStatus.STOPPED:
              return reject(TestEvents.CANCELED);
            default:
              return;
          }
        }, 1);
      });
      runner.finally(resetInterval);
      // wait for it to be done
      const rs = await runner;
      params = Array.isArray(rs) ? rs : [rs];
    }
  }

  public cancel() {
    this._proceed = false;
  }
}