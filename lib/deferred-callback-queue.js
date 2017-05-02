import {CompositeDisposable, Disposable} from 'event-kit';
import {autobind} from 'core-decorators';

// const defaultDidFocus = () => {
//   currentWin.on('focus');
//   return new Disposable();
// };

export default class DeferredCallbackQueue {
  static TIMEOUT = 3000

  constructor(callback, {onDidFocus, onDidBlur} = {onDidFocus: defaultDidFocus, onDidBlur: defaultDidBlur}) {
    this.callback = callback;
    this.subscriptions = new CompositeDisposable();
    this.items = new Set();

    // this.paused = win.isFocused;
    window.addEventListener('blur', this.pause);
    window.addEventListener('focus', this.resume);
    // this.subscriptions.add(onDidFocus(this.resume));
    // this.subscriptions.add(onDidBlur(this.pause));
    this.subscriptions.add(new Disposable(() => {
      window.removeEventListener('blur', this.pause);
      window.removeEventListener('focus', this.resume);
    }));
  }

  @autobind
  pause() {
    if (this.paused) { return; }
    this.paused = true;
  }

  @autobind
  resume() {
    if (!this.paused) { return; }
    this.paused = false;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.flush();
  }

  resetTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(this.flush, DeferredCallbackQueue.TIMEOUT);
  }

  @autobind
  flush() {
    delete this.timer;
    this.callback([...this.items]);
  }

  push(items) {
    if (this.paused) {
      items.forEach(item => this.items.add(item));
      this.resetTimer();
    } else {
      this.callback(items);
    }
  }

  destroy() {
    this.subscriptions.dispose();
  }
}
