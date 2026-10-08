import { CliOptions, TestUserConfig, createVitest, Vitest, VitestOptions } from 'vitest/node'
import { createSharedWorker } from '@dxnlab/workers/shared';

class VitestWorker extends EventTarget {

  private vitest:Promise<Vitest>;
  private localPorts:MessagePort[] = [];

  

  constructor(self:SharedWorkerGlobalScope, ) {
    super();
  }

  initiateVitest(cliOption:CliOptions, userOption:TestUserConfig, options?:VitestOptions
  ):Promise<Vitest> {
    const { promise, resolve, reject } = Promise.withResolvers<Vitest>();
    try {
      this.vitest = createVitest('test', cliOption, userOption, options);
      this.vitest.then(resolve);
    } catch (err) {
      reject(err);
    }
    return promise;
  }
}