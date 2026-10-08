
abstract class AbstractDescriptable {
  public title?:string;
  public description?:string;
  protected _logs: string[];
  protected _errors: unknown[];
  protected _done?:Boolean;
  protected _pass?:Boolean;

  constructor() {
    this._logs = [];
    this._errors = [];
  }


  protected abstract runTest(...args:any[]) : Promise<unknown>;

  protected async run(...args:any[]) {
    try {
      this._done = false;
      const rs = await this.runTest(...args);
      this._pass = true;
      return rs;
    } catch (ex) {
      this._pass = false;
      this.error = ex;
    } finally {
      this._done = true;
    }
  }


  public get logs() { return this._logs }
  protected set log(value:string) { this._logs.push(value) }
  public get errors() { return this._errors }
  protected set error(value:unknown) { this._errors.push(value) }

}

class TestCaseUnit extends AbstractDescriptable  {
  protected _test:Function;
  protected _before?:Function;
  protected _after?:Function;

  constructor(
    testFn:Function,
    options?: {
      title: string,
      description?: string,
      before:Function,
      after:Function,
    }
  ) {
    super();

    this._test = testFn;
    this.title = options?.title;
    this.description = options?.description;
    this._before = options?.before;
    this._after = options?.after;
    this._logs = [];
    this._errors =[];
  }

  protected async runTest(...args:any[]) {
    
  }
}