import { Queriable } from "./common";


export function prepare(store:Queriable) {
  return new Statement(store);
}

class Statement {

  constructor(protected readonly store:StoreProxy) { }

  /** 
   * setup value range out of queries
   * 
   * @param query:string
   *   INDEX 
   *   
   */
  public range(query:string, ...values:any[]) {

  }

  /**
   * where generator setter
   */
  public having(validator:(v:any)=>boolean):void {

  }

  public async *exec(...params:any[]):AsyncGenerator {

  }
}