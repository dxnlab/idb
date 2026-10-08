class AssertError extends Error { }

export class TestCaseUnit {
  public title?:string;
  public description?:string;

  protected _statusOK:boolean;
  protected _done:boolean;

  protected _logs:string[];
  protected _errors:unknown[];

  constructor(protected testFn:Function) {
    // this.clear();
    this._statusOK = true;
    this._done = false;
    this._logs = [];
    this._errors = [];
  }
  
  protected clear() {
    this._statusOK = true;
    this._done = false;
    this._logs = [];
    this._errors = [];
  }

  public async run(...args:any[]) {
    this.clear();

    try {
      return await this.testFn.apply(this, args);
    } catch(ex) {
      this._statusOK = false;
      this.error(ex);
      throw ex;
    } finally {
      this._done = true;
    }
  }

  public get inProgress() { return this._done === false && this._statusOK }
  public get ok() { return this._statusOK; }
  public get hasDone() { return this._done === true; }
  public get logs() { return this._logs }
  public get errors() { return this._errors }
  public get pass(){ return this.hasDone && this.ok }

  protected log(...values:any[]) { this._logs.push(...values); }

  protected error(...values:any[]) { this._errors.push(...values); }

  protected async assert(condition:Function, message?:string) {
    const rs = await condition.apply(this, []);
    if(rs) {
      this.log({ pass: rs, message, });
    } else {
      this.log({ fail: rs, message, });
      this._statusOK = false;
      throw new AssertError(message);
    }
  }

  protected async assertThrows(condition:Function, throws:any[], message?:string) {
    return await this.assert(async ()=>{
      try {
        await condition();
        throw new AssertError('expected throw but never occurred');
      } catch(ex) {
        return throws.find((t)=>ex instanceof t);
      }
    }, message);
  }
}

export class TestCase {
  public title?:string;
  public description?:string;

  public setup?:Function;
  public teardown?:Function;

  protected suite:TestSuite;
  protected units:TestCaseUnit[];
  protected _done?:boolean;

  constructor(suite:TestSuite, ...tests:TestCaseUnit[]) {
    this.suite = suite;
    this.units = tests;
  }

  public get inProgress(){ return this._done === false }
  public get ok() { return this.units.reduce((t, u)=>(t && u.ok), true) }
  public get hasDone() { return this._done === true }
  public get logs() { return this.units.reduce((a, u)=>a.concat(u.logs), []); }
  public get errors() { return this.units.reduce((a, u)=>a.concat(u.errors), []); }
  public get pass(){ return this.hasDone && this.ok }

  public async run(...args:any[]) {
    this._done = false;
    try {
      const params = this.setup
        ? this.setup.apply(this, args)
        : args;
      const progress = Promise.all(
        this.units.map((unit)=>unit.run(...params))
      );
      await Promise.race([
        progress,
        // forceQuit

      ]);
      return this.teardown
        ? this.teardown.apply(this, rss)
        : rss;
    } catch (ex) {
      throw ex;
    } finally {
      //
      this._done = true;
    }
  }
}

export class TestSuite {
  public title?:string;
  public description?:string;
  protected _cases:TestCase[];
  protected _done?:boolean;

  constructor(...cases:TestCase[]) {
    this._cases = cases;
  }

  public get inProgress(){ return this._done === false }
  public get ok() { return this._cases.reduce((t, c)=>(t && c.ok), true) }
  public get hasDone() { return this._done === true }
  public get pass(){ return this.hasDone && this.ok }

  public async run(...args:any[]) {
    this._done = false;
    let params = args;
    try {
      for(const testcase of this._cases) {
        params = await testcase.run(...params);
      }
    } catch (ex) {
      // 
      console.error(ex);
    } finally {
      this._done = true;
    }
  }

}