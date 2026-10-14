/**
 * Abu Madfa3 - Survivor.io Replica
 * Unified Input Controller (Keyboard & Touch Virtual Joystick)
 */

class InputController {
  constructor() {
    this.keys = {};
    this.touchVector = { x: 0, y: 0 };
    this.isTouchActive = false;
    this.joystickBase = null;
    this.joystickStick = null;
    this.joystickZone = null;
    this.touchId = null;
    this.touchCenter = { x: 0, y: 0 };
    this.maxRadius = 45; // Max joystick thumb travel

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.code] = true;

      // Pause toggle
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (window.gameInstance) {
          window.gameInstance.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.code] = false;
    });

    // Reset keys if window loses focus
    window.addEventListener('blur', () => {
      this.keys = {};
      this.touchVector = { x: 0, y: 0 };
    });
  }

  initTouch() {
    this.joystickZone = document.getElementById('joystick-zone');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickStick = document.getElementById('joystick-stick');

    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice && this.joystickZone) {
      this.joystickZone.style.display = 'block';
    }

    if (!this.joystickZone || !this.joystickBase || !this.joystickStick) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (this.isTouchActive) return;

      const touch = e.changedTouches[0];
      this.touchId = touch.identifier;
      this.isTouchActive = true;

      const rect = this.joystickBase.getBoundingClientRect();
      this.touchCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      this.updateJoystickPosition(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!this.isTouchActive) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchId) {
          this.updateJoystickPosition(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (!this.isTouchActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchId) {
          this.resetJoystick();
          break;
        }
      }
    };

    this.joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.touchCenter.x;
    const dy = clientY - this.touchCenter.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      this.touchVector = { x: 0, y: 0 };
      this.joystickStick.style.transform = `translate(0px, 0px)`;
      return;
    }

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, this.maxRadius);
    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    this.joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;
    this.touchVector = {
      x: stickX / this.maxRadius,
      y: stickY / this.maxRadius
    };
  }

  resetJoystick() {
    this.isTouchActive = false;
    this.touchId = null;
    this.touchVector = { x: 0, y: 0 };
    if (this.joystickStick) {
      this.joystickStick.style.transform = `translate(0px, 0px)`;
    }
  }

  // Get normalized movement vector [-1..1]
  getMovementVector() {
    let x = 0;
    let y = 0;

    // Keyboard checks
    if (this.keys['w'] || this.keys['arrowup'] || this.keys['keyw']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown'] || this.keys['keys']) y += 1;
    if (this.keys['a'] || this.keys['arrowleft'] || this.keys['keya']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright'] || this.keys['keyd']) x += 1;

    // Combine with Touch Joystick
    if (this.isTouchActive) {
      x += this.touchVector.x;
      y += this.touchVector.y;
    }

    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }

    return { x, y, magnitude: Math.min(1, mag) };
  }
}

// Global Input Controller Singleton
window.inputController = new InputController();
