import { EventEmitter } from "./event";

class VisibilityWatcher extends EventEmitter {
  private _lastHiddenTime: DOMHighResTimeStamp = 0;

  private _lastVisibleTime: DOMHighResTimeStamp = 0;

  public get visibility() {
    return document.visibilityState;
  }

  public get lastHiddenTime(): DOMHighResTimeStamp {
    return this._lastHiddenTime;
  }

  public get lastVisibleTime(): DOMHighResTimeStamp {
    return this._lastVisibleTime;
  }

  public constructor() {
    super();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this._lastHiddenTime = performance.now();
      } else {
        this._lastVisibleTime = performance.now();
      }

      console.debug(`current web page is ${document.visibilityState}`);

      this.emit("VISIBILITY_CHANGE", document.visibilityState);
    });
  }
}

export const visibilityWatcher = new VisibilityWatcher();
