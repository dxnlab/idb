import { Queriable } from './common'
import iDB from './database'


export function prepare(target:Queriable) {
  return new Statement(target);
}

export enum PrepareOperator {
  lt = '<',
  gt = '>',
  lte = '<=',
  gte = '>=',
  eq = '=',
}


class Statement {
  
  protected static operators = [
    {operator:'lt', pattern: /^(<|lt)$/i, bounds:(value:any)=>({ upper: [value, true] }) },
    {operator:'gt', pattern: /^(>|gt)$/i, bounds:(value:any)=>({ lower: [value, true] }) },
    {operator:'lte', pattern: /^(<=|=<|lte)$/i, bounds:(value:any)=>({ upper: [ value, false] }) },
    {operator:'gte', pattern: /^(>=|=>|gte)$/i, bounds:(value:any)=>({ lower: [ value, false] }) },
    {operator:'eq', pattern: /^(={1,3}|eq)$/i, bounds:(value:any)=>({ upper: [value,false], lower: [value,false] }) },
  ];

  protected _upper = [undefined, undefined];
  protected _lower = [undefined, undefined];
  protected _yields:((iter:any)=>boolean)[];
  protected _directNext = true;
  protected _unique = false;

  protected constructor(protected readonly target:Queriable) { }

  /*** setting statements up ***/

  
  /**
   * set the index's range by keyPathes.
   * 
   * @param oper operator by the values. '<', '>', '<=', '=', '==' or string literal 'lt','gte','eq'
   * @param values values that corresponding to `target`'s keyPathes.
   *  i) **kwargs style; single object that contains { [keyname:string]:keyValue }
   *    e.g. range('=', { category: 'aCat', brand: 'myBrand' })
   *  ii) *args style; multiple values according to keyPathes order.
   *    // assume the index 'vdimension' = ['w', 'h', 'd'] 
   *    e.g. range('<', 60, 50, 40); // === range('<', {w:60, h:50, d:40})
   * 
   * @returns 
   */
  public range(oper:PrepareOperator|string, ...values:any[]):Statement {
    const selectedOp = Statement.operators
      .reduce((g?:string, {operator, pattern, bounds})=>{

      if(g == undefined && pattern.test(oper)) {
        // put values into the query
        const boundary = bounds(this.parameterize(...values));
        this.upper = boundary?.upper;
        this.lower = boundary?.lower;
        // mark current operator 
        g = operator;
      }
      return g;
    }, undefined);

    if(!selectedOp) {
      throw new Error(`Cound not found operator ${oper}`);
    }

    return this;
  }



  /*** final - major entryPoints ***/

  /**
   * Retrieve default cursor
   * 
   * for await (const {key, value} of stmt.cursor) { 
   *  //do things with the IDBCursorWithValue 
   * }
   * 
   * @yields cursor:IDBCursorWithValue
   */
  public get cursor():AsyncGenerator<IDBCursorWithValue> {
    return this.target.openGenerator(this.boundary, this.direction);
  }

  /**
   * Retrieval keys. Identical key can presented multiple times as many as its items.
   * const keyCounts = {};
   * 
   * for await (const key of stmt.keys) {
   *  keyCounts[key] = keyCounts?.[key] ? keyCounts[key]+1 : 1;
   * }
   * 
   * @yields key:IDBValidKey
   */
  public get keys():AsyncGenerator<IDBCursor> {
    return this.target.keyGenerator(this.defaultGeneratorParams);
  }

  /**
   * Retrieve unique keys in range/having.
   *  Overwrite setting 'unique' config, run by unique direction.
   *  Since it's run over unique keys, having function that assumming non-unique situation could fail.
   * 
   * @yields key:IDBValidKey (unique)
   */
  public get uniqueKeys():AsyncGenerator<IDBCursor> {
    const direction = this._directNext ? 'nextunique' : 'prevunique';
    const params = Object.assign(this.defaultGeneratorParams, { direction });
    return this.target.keyGenerator(params);
  }

  /**
   * Retrieve grouped key items.
   *  Overwrite setting 'unique' config if it set true, to find group items.
   * 
   * let keyCounts = {};
   * for await (const [key, items] of stmt.keyEntries) {
   *  keyCounts[key] = items.length;  
   * }
   * 
   * @yields [key:IDBValidKey, items:any[]]
   */
  public get keyEntries():AsyncGenerator<[IDBValidKey, any[]]> {
    const direction = this._directNext ? 'next' : 'prev';
    const params = Object.assign(this.defaultGeneratorParams, { direction });
    return this.target.groupGenerator(params);
  }

  /**
   * Retrieve only the item values.
   */
  public get values():AsyncGenerator {
    return this.target.valueGenerator(this.defaultGeneratorParams);
  }

  /*** internal providers ***/

  /**
   * Parse boundary values into parameters
   * 
   * @param args array [ path0, path1, path2, ...] 
   *    or kwargs object; { [key:string]:any }
   * @returns Entries [ [key, value], ... ]
   */
  protected parameterize(kwarg:any, ...arg:any[]) {
    const keynames = this.target.keyPathes;
    const IsKwargTheOnlyObject = typeof kwarg === 'object' && arg.length<=0;
    const KeyLengthMeets = IsKwargTheOnlyObject && keynames.length == Object.keys(kwarg).length;
    const kwargs = KeyLengthMeets ? kwarg : null;
    const args = [kwarg, ...arg];
    return keynames.map((key:string, ki:number)=>{
      // first try kwargs
      if(kwargs && key in kwargs) { return kwargs[key]; }
      // then with args
      else if(ki<args.length) { return args[ki]; }
      // else (can not find)
      else { 
        throw new Error(`[${ki+1}] ${key} value undetermined`); 
      }
    });
  }

  /**
   * set lower/upper boundary from provided range args.
   * 
   * @param boundary choose 'lower'|'upper'
   * @param values range args
   * @param change function that checks if this setting would change current boundaries (true)
   * @returns selected boundary setting
   */
  protected setBound(boundary:'lower'|'upper', values:any, change:(prev:any, next:any)=>boolean) {
    const boundaryDirection = `_${boundary}`;
    // nil break
    if(!values) { return; }
    // values must be [params:any[], boolean]
    const [params, open] = values;
    // nil break for params
    if(!Array.isArray(params)) { return; }
    //
    const [prev, popen] = this[boundaryDirection];
    return this[boundaryDirection] = [
      params.map((p:any,pi:number)=>prev && !change(prev[pi], p) ? prev[pi] : p),
      open != undefined ? open : popen
    ];
  }

  /**
   * get lower/upper boundary settings to fit in IDBKeyRange bound functions.
   * 
   * @param boundary 
   * @returns 
   */
  protected getBound(boundary:'lower'|'upper') {
    const boundaryDirection = `_${boundary}`;
    const [param, open] = this[boundaryDirection];
    return Array.isArray(param) ? [param, open] : undefined;
  }


  /**
   * upper boundary setter
   * 
   * @param values [OneOf<
   *  i) **kwargs style = object
   *  ii) *args style = any[]
   * >]
   */
  protected set upper(values:any) {
    this.setBound('upper', values, (p,n)=>0<iDB.cmp(n,p));
  }

  /**
   * lower boundary setter
   * 
   * @param values [OneOf<
   *  i) **kwargs style = object
   *  ii) *args style = any[]
   * >]
   */
  protected set lower(values:any) {
    this.setBound('lower', values, this._lower, (p,n)=>0<iDB.cmp(p,n));
  }

  /**
   * upper boundary getter
   * 
   * @returns [IDBValidKey, boolean]
   */
  protected get upper() {
    return this.getBound('upper');
  }

  /**
   * lower boundary getter
   * 
   * @returns [IDBValidKey, boolean]
   */
  protected get lower() {
    return this.getBound('lower');
  }

  /**
   * translate current statement boundary settings into IDBKeyRange
   */
  public get boundary():undefined|IDBKeyRange {
    const lower = this.lower;
    const upper = this.upper;
    if(lower && upper) {
      const [lowerParam, lowerOpen] = lower;
      const [upperParam, upperOpen] = upper;
      return IDBKeyRange.bound(lowerParam, upperParam, lowerOpen, upperOpen);
    } else if(lower) {
      return IDBKeyRange.lowerBound(...lower);
    } else if(upper) {
      return IDBKeyRange.upperBound(...upper);
    } else {
      return undefined;
    }
  }

  /**
   * append HAVING validator.
   *  validators get stacking, non-erasable once set.
   */
  public having(validator:(v:any)=>boolean):Statement {
    this._yields = this._yields || [];
    this._yields.push(validator);
    return this;
  }

  public ascending():Statement { 
    this._directNext = true; 
    return this;
  }
  public descending():Statement { 
    this._directNext = false; 
    return this;
  }

  public unique():Statement { 
    this._unique = true;
    return this;
  }
  public iterate():Statement { 
    this._unique = false; 
    return this;
  }

  public get direction():IDBCursorDirection {
    switch(true) {
      case this._directNext && this._unique:
        return 'nextunique';
      case !this._directNext && this._unique:
        return 'prevunique';
      case !this._directNext && !this._unique:
        return 'prev'
      case this._directNext && !this._unique:
      default: 
        return 'next';
    }
  }

  /**
   * 
   */
  protected pass(value:any):boolean {
    // when there's no validator set
    return !this._yields 
      // or "every" validators get passed
      || this._yields.reduce((pass, validator)=>pass && validator(value), true);
  }

  protected get havingFn():undefined|Function {
    return Array.isArray(this._yields) && this._yields.reduce((ok, y)=>ok && typeof(y)==='function', true)
      ? this.pass
      : undefined
  }

  protected get defaultGeneratorParams() {
    return {
      query: this.boundary,
      direction: this.direction,
      having: this.havingFn,
    };
  }


}