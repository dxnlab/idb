/**
 * Base shared worker that traces all the worker tests
 * @core
 */

import { createSharedWorker, registerSharedWorker } from '@dxnlab/workers/shared'

export default createSharedWorker(self, {
  onConnect() {
    // TODO: spawn tests
    console.log('test hub connected');

    // TODO: response ready
  },
  onMessage({data}:Event) {
    // TODO: start test suite worker

    // TODO: stop test suite worker

    // TODO: list current test suite status
  },
})
