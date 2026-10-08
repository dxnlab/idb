import { DatabaseOption } from "./types";

export function idb(database:string, option?:DatabaseOption) {
  return (cls:any, context:DecoratorContext) => {
    // assign idb static properties

    // register event handlers if exists
  };
}

