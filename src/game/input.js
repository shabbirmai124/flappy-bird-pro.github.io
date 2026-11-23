export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.jumpCallbacks = [];
    this.pauseCallbacks = [];
    this.anyKeyCallbacks = [];
    this.heldKeys = new Set();
    this._lastTouchTime = 0;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._clearHeld = this._clearHeld.bind(this);
    this.bindEvents();
  }

  onJump(cb) {
    this.jumpCallbacks.push(cb);
  }

  onPause(cb) {
    this.pauseCallbacks.push(cb);
  }

  onAnyKey(cb) {
    this.anyKeyCallbacks.push(cb);
  }

  _isTextInputTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(target.isContentEditable);
  }

  _isInteractiveTarget(target) {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(
      target.closest('button') ||
        target.closest('.modal-card') ||
        target.closest('.continue-card') ||
        target.closest('.glass-card') ||
        target.closest('.ad-overlay-card') ||
        target.closest('a') ||
        target.tagName === 'INPUT' ||
        target.tagName === 'LABEL'
    );
  }

  _onKeyDown(e) {
    if (this._isTextInputTarget(e.target)) return;

    const isJumpKey =
      e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Tab';
    const isPauseKey = e.code === 'Escape' || e.code === 'KeyP';

    if (isJumpKey) {
      e.preventDefault();
      // Edge-trigger only: ignore key auto-repeat while held
      if (!e.repeat && !this.heldKeys.has(e.code)) {
        this.heldKeys.add(e.code);
        this.triggerJump();
      }
    } else if (isPauseKey) {
      e.preventDefault();
      if (!e.repeat && !this.heldKeys.has(e.code)) {
        this.heldKeys.add(e.code);
        this.triggerPause();
      }
    }

    this.triggerAnyKey();
  }

  _onKeyUp(e) {
    this.heldKeys.delete(e.code);
  }

  _onMouseDown(e) {
    if (Date.now() - this._lastTouchTime < 500) return;
    if (this._isInteractiveTarget(e.target)) return;
    if (e.button === 0) {
      this.triggerJump();
      this.triggerAnyKey();
    }
  }

  _onTouchStart(e) {
    this._lastTouchTime = Date.now();
    if (this._isInteractiveTarget(e.target)) return;
    this.triggerJump();
    this.triggerAnyKey();
  }

  _clearHeld() {
    this.heldKeys.clear();
  }

  bindEvents() {
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('touchstart', this._onTouchStart, { passive: true });
    window.addEventListener('blur', this._clearHeld);
    document.addEventListener('visibilitychange', this._clearHeld);
  }

  clearInputs() {
    this.heldKeys.clear();
  }

  triggerJump() {
    this.jumpCallbacks.forEach((cb) => cb());
  }

  triggerPause() {
    this.pauseCallbacks.forEach((cb) => cb());
  }

  triggerAnyKey() {
    this.anyKeyCallbacks.forEach((cb) => cb());
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('blur', this._clearHeld);
    document.removeEventListener('visibilitychange', this._clearHeld);
  }
}
