import { createWorker } from '@dxnlab/workers'
import { TestSuite } from './test'

export default createWorker(self, {
  async onMessage({data}:any) {
    let response;
    const { c, args } = data;
    switch(c) {
      case 'start':
        self.running = suite.run(...args);
        response = { }
      case 'stop':
        self.running?.forceStop();
      
    }

    // TODO: stop the the suite

    // TODO: show status
  }
});

// test definitions
const suite = new TestSuite(
  TestSuite.unit(()=>{
    this.assert(()=>globalThis.indexedDB != undefined, 'idb defined');
    this.assert(()=>globalThis.indexedDB instanceof IDBFactory, 'idb type IDBFactory');
  }, { title: 'factory', description: 'test if idb factory .indexedDB exists' })
);