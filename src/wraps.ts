import { cmp, connect, disconnect, showDatabases } from "./idb";
import { DatabaseOption } from "./types";

export function getConnector(target:object, key:string) {
  return async (database:string, option?:DatabaseOption) => {
    if(!Object.hasOwn(target, key)) {
      Object.defineProperty(target, key, { value: await connect(database, option) });
    }
    return target[key];
  }
}

export function getDisconnector(target:object, key:string) {
  return async ()=>{
    if(target?.[key]!=undefined) {
      await disconnect(target[key]);
      delete target[key];
    }
  }
}


export function withTransaction(
  self:any,
  trxBuilder:Function,
  runner:Function) {
    return async function(...args:any[]) {
      const trx = await trxBuilder();
      return await trx(runner, args, self);
    }
}
