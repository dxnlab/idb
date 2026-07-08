import { expect } from "expect-webdriverio";
import { appendRequestHandlers, promiseRequest, range } from "./common";


describe('test common wrappers', async () => {
  // wrap promise request
  it('promiseRequest', async ()=>{
    const req = new EventTarget();
    const wrapped = promiseRequest(req);
    expect(wrapped).toBeInstanceOf(Promise);
    expect(req.onsuccess).toBeDefined();
    expect(req.onerror).toBeDefined();
  });

  it('promiseRequestPlusHandler', async ()=> {
    const req = new EventTarget();
    const invoked = { onEmitted: false, onCustomEvent: false };
    let handlers = {
      onEmit: (ev)=>{ invoked.onEmitted = true; },
      custom: (ev)=>{ 
        expect(ev).toBeInstanceOf(CustomEvent);
        invoked.onCustomEvent = true; 
      },
    };
    const wrapped = promiseRequest(req);
    appendRequestHandlers(req, handlers);
    expect(invoked.onEmitted).toBe(false);
    expect(invoked.onCustomEvent).toBe(false);

    // explicit invoke onEmit
    await req.onemit();
    expect(invoked.onEmitted).toBe(true);
    expect(invoked.onCustomEvent).toBe(false);

    const customEvent = new CustomEvent('custom');
    await req.dispatchEvent(customEvent);
    expect(invoked.onCustomEvent).toBe(true);
  });
});