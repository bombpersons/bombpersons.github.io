// Behaviour and geometry are independent of the DOM so they can be simulated.
export class Farmyard {
  constructor(bounds, { random = Math.random, night = false, frozen = false } = {}) {
    this.random = random;
    this.bounds = bounds;
    this.night = night;
    this.frozen = frozen;
    this.reducedMotion = false;
    this.hens = Array.from({ length: 3 }, (_, i) => ({
      x: bounds.door, y: 0, face: 1, state: night ? 'sleeping' : 'leaving',
      timer: i * 0.7 + this.between(0.2, 0.7), target: this.landPoint(),
      speed: this.between(25, 36), opacity: 0, phase: 0
    }));
    this.flock = { mode: 'roaming', timer: this.between(9, 16), anchor: this.flockPoint(), target: this.flockPoint() };
    this.ducks = Array.from({ length: 3 }, (_, i) => ({
      x: this.clamp(this.flock.anchor - i * this.spacing(), bounds.landStart, bounds.landEnd),
      y: 0, face: 1, state: 'idle', timer: this.between(1, 3),
      speed: this.between(32, 40), target: 0, splash: 0, angle: 0,
      inWater: false, tripAfter: this.between(70, 260), phase: 0
    }));
  }

  between(a, b) { return a + this.random() * (b - a); }
  clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  landPoint() { return this.between(this.bounds.landStart, this.bounds.landEnd); }
  spacing() { return Math.min(32, (this.bounds.landEnd - this.bounds.landStart) / 3); }
  flockPoint() { return this.between(this.bounds.landStart + 2 * this.spacing(), this.bounds.landEnd); }
  waterSlot(i) { return this.bounds.waterStart + (this.bounds.waterEnd - this.bounds.waterStart) * i / 2; }
  move(bird, target, speed, dt) {
    const distance = target - bird.x;
    if (Math.abs(distance) < 0.5) { bird.x = target; return 0; }
    bird.face = distance > 0 ? 1 : -1;
    const step = Math.min(Math.abs(distance), speed * dt);
    bird.x += bird.face * step;
    return step;
  }

  setNight(night) {
    if (night === this.night) return;
    this.night = night;
    this.hens.forEach(hen => {
      hen.state = night ? 'returning' : 'leaving';
      hen.timer = night ? 0 : this.between(0, 1.2);
      hen.target = night ? this.bounds.door : this.landPoint();
    });
    if (this.reducedMotion) this.settle();
  }

  setReducedMotion(reduced) {
    this.reducedMotion = reduced;
    if (reduced) this.settle();
  }

  setFrozen(frozen) {
    if (frozen === this.frozen) return;
    this.frozen = frozen;
    if (!frozen) return;
    if (this.reducedMotion) { this.settle(); return; }
    // Finish getting to shore if winter is selected during a pond visit.
    const visiting = this.ducks.some(duck => duck.inWater || duck.jump);
    this.flock.mode = visiting ? 'leaving' : 'roaming';
    this.flock.anchor = Math.max(...this.ducks.map(duck => Math.min(duck.x, this.bounds.landEnd)));
    this.flock.target = this.flockPoint();
    this.flock.timer = this.between(6, 12);
    this.ducks.forEach((duck, i) => {
      if (duck.inWater || duck.jump) this.startJump(duck, i, false);
      else if (duck.state === 'waiting') duck.state = 'idle';
    });
  }

  settle() {
    this.hens.forEach((hen, i) => {
      hen.x = this.night ? this.bounds.door : this.bounds.landStart + (this.bounds.landEnd - this.bounds.landStart) * (i + 1) / 4;
      hen.state = this.night ? 'sleeping' : 'idle';
      hen.opacity = this.night ? 0 : 1;
      hen.timer = this.between(1, 3);
    });
    this.flock.mode = 'roaming';
    this.flock.timer = this.between(9, 16);
    this.flock.anchor = this.flockPoint();
    this.flock.target = this.flockPoint();
    this.ducks.forEach((duck, i) => {
      duck.x = this.clamp(this.flock.anchor - i * this.spacing(), this.bounds.landStart, this.bounds.landEnd);
      duck.y = 0;
      duck.state = 'idle';
      duck.inWater = false;
      duck.jump = null;
      duck.angle = 0;
      duck.splash = 0;
    });
  }

  resize(bounds) {
    const old = this.bounds;
    if (Object.keys(bounds).every(key => bounds[key] === old[key])) return;
    const map = (x, water) => {
      const start = water ? old.waterStart : old.landStart;
      const end = water ? old.waterEnd : old.landEnd;
      const nextStart = water ? bounds.waterStart : bounds.landStart;
      const nextEnd = water ? bounds.waterEnd : bounds.landEnd;
      return nextStart + this.clamp((x - start) / Math.max(1, end - start), 0, 1) * (nextEnd - nextStart);
    };
    this.hens.forEach(hen => {
      if (hen.state === 'sleeping') hen.x = bounds.door;
      else if (hen.state === 'leaving' || hen.state === 'returning') {
        hen.x = bounds.door + this.clamp((hen.x - old.door) / Math.max(1, old.landEnd - old.door), 0, 1) * (bounds.landEnd - bounds.door);
      } else hen.x = map(hen.x, false);
      hen.target = map(hen.target, false);
    });
    this.ducks.forEach((duck, i) => {
      duck.x = map(duck.x, duck.inWater);
      duck.target = map(duck.target, duck.inWater);
      if (duck.jump) {
        const entering = duck.state === 'jumping-in';
        duck.jump.from = map(duck.jump.from, !entering);
        duck.jump.to = entering ? bounds.waterStart + (bounds.waterEnd - bounds.waterStart) * i / 2 : bounds.landEnd - i * Math.min(32, (bounds.landEnd - bounds.landStart) / 3);
      }
    });
    this.flock.anchor = map(this.flock.anchor, false);
    this.flock.target = map(this.flock.target, false);
    this.bounds = bounds;
    if (this.reducedMotion) this.settle();
  }

  step(seconds) {
    if (this.reducedMotion) return;
    // Small steps preserve transitions when tests or slow frames advance time.
    while (seconds > 0) {
      const dt = Math.min(seconds, 0.05);
      this.hens.forEach(hen => this.stepHen(hen, dt));
      this.stepFlock(dt);
      seconds -= dt;
    }
  }

  stepHen(hen, dt) {
    hen.phase += dt;
    if (hen.state === 'sleeping') return;
    if (hen.state === 'returning') {
      this.move(hen, this.bounds.door, hen.speed * 1.2, dt);
      hen.opacity = this.clamp(Math.abs(hen.x - this.bounds.door) / 12, 0, 1);
      if (hen.x === this.bounds.door) hen.state = 'sleeping';
      return;
    }
    hen.timer -= dt;
    if (hen.state === 'leaving') {
      if (hen.timer > 0) return;
      this.move(hen, hen.target, hen.speed, dt);
      hen.opacity = this.clamp(Math.abs(hen.x - this.bounds.door) / 12, 0, 1);
      if (hen.x === hen.target) { hen.state = 'idle'; hen.timer = this.between(0.5, 2); }
    } else if (hen.state === 'walking') {
      this.move(hen, hen.target, hen.speed, dt);
      if (hen.x === hen.target) { hen.state = 'idle'; hen.timer = this.between(0.8, 2.5); }
    } else if (hen.timer <= 0) {
      if (hen.state !== 'pecking' && this.random() < 0.6) {
        hen.state = 'pecking';
        hen.phase = 0;
        hen.timer = this.between(1.3, 3.8);
      } else {
        hen.state = 'walking';
        hen.target = this.landPoint();
      }
    }
  }

  stepLandDuck(duck, target, dt, nibble) {
    duck.timer -= dt;
    if (duck.state === 'fallen') {
      if (duck.timer > 0) return;
      duck.state = 'idle';
    }
    if (duck.state === 'nibbling') {
      if (duck.timer > 0 && nibble) return;
      duck.state = 'idle';
    }
    const distance = this.move(duck, target, duck.speed, dt);
    if (distance > 0) {
      duck.state = 'walking';
      duck.tripAfter -= distance;
      if (duck.tripAfter <= 0) {
        duck.state = 'fallen';
        duck.timer = this.between(0.7, 1.5);
        duck.tripAfter = this.between(100, 350);
      }
    } else {
      duck.state = 'idle';
      if (nibble && duck.timer <= 0) {
        duck.state = 'nibbling';
        duck.phase = 0;
        duck.timer = this.between(1, 2.8);
      }
    }
  }

  startJump(duck, index, entering) {
    duck.state = entering ? 'jumping-in' : 'jumping-out';
    duck.angle = 0;
    duck.jump = {
      elapsed: 0, duration: this.between(0.8, 1.05), from: duck.x,
      to: entering ? this.waterSlot(index) : this.bounds.landEnd - index * this.spacing(),
      fromY: duck.y, toY: entering ? this.bounds.waterY : 0
    };
    duck.face = duck.jump.to > duck.x ? 1 : -1;
  }

  stepJump(duck, dt) {
    const jump = duck.jump;
    jump.elapsed += dt;
    const t = Math.min(1, jump.elapsed / jump.duration);
    duck.x = jump.from + (jump.to - jump.from) * t;
    duck.y = jump.fromY + (jump.toY - jump.fromY) * t - Math.sin(t * Math.PI) * 40;
    if (t === 1) {
      duck.x = jump.to;
      duck.y = jump.toY;
      duck.inWater = duck.state === 'jumping-in';
      duck.state = duck.inWater ? 'swimming' : 'idle';
      duck.timer = this.between(1.5, 4);
      duck.target = duck.x;
      duck.splash = duck.inWater ? 0.65 : 0;
      duck.jump = null;
    }
  }

  stepWaterDuck(duck, dt) {
    duck.timer -= dt;
    if (duck.state === 'diving') {
      duck.diveTime += dt;
      const t = Math.min(1, duck.diveTime / duck.diveDuration);
      duck.y = this.bounds.waterY + Math.sin(t * Math.PI) * duck.diveDepth;
      duck.angle = Math.sin(t * 2 * Math.PI) * 38;
      if (t === 1) {
        duck.state = 'swimming'; duck.angle = 0;
        duck.timer = this.between(1.5, 3.5); duck.splash = 0.45;
      }
    } else {
      duck.y = this.bounds.waterY + Math.sin(duck.phase * 2.2) * 1.2;
      this.move(duck, duck.target, 13, dt);
      if (duck.timer <= 0 && this.flock.mode !== 'leaving') {
        if (!this.frozen && this.random() < 0.4) {
          duck.state = 'diving'; duck.diveTime = 0;
          duck.diveDuration = this.between(2.5, 4);
          duck.diveDepth = this.between(22, 36);
          duck.splash = 0.35;
        } else {
          duck.target = this.between(this.bounds.waterStart, this.bounds.waterEnd);
          duck.timer = this.between(2.5, 5);
        }
      }
    }
  }

  stepFlock(dt) {
    const flock = this.flock, bounds = this.bounds;
    flock.timer -= dt;
    this.ducks.forEach(duck => { duck.phase += dt; duck.splash = Math.max(0, duck.splash - dt); });

    if (flock.mode === 'roaming') {
      if (flock.timer <= 0) {
        if (!this.frozen && this.random() < 0.4) {
          flock.mode = 'approaching';
        } else {
          flock.target = this.flockPoint();
          flock.timer = this.between(6, 12);
        }
      }
      const distance = flock.target - flock.anchor;
      flock.anchor += Math.sign(distance) * Math.min(Math.abs(distance), dt * 24);
      this.ducks.forEach((duck, i) => this.stepLandDuck(duck,
        this.clamp(flock.anchor - i * this.spacing(), bounds.landStart, bounds.landEnd), dt, true));
    } else if (flock.mode === 'approaching') {
      this.ducks.forEach((duck, i) => this.stepLandDuck(duck, bounds.landEnd - i * this.spacing(), dt, false));
      if (this.ducks.every((duck, i) => Math.abs(duck.x - (bounds.landEnd - i * this.spacing())) < 1 && duck.state !== 'fallen')) {
        flock.mode = 'entering';
        this.ducks.forEach((duck, i) => { duck.state = 'waiting'; duck.timer = i * 0.45; });
      }
    } else if (flock.mode === 'entering') {
      this.ducks.forEach((duck, i) => {
        if (duck.state === 'waiting') {
          duck.timer -= dt;
          if (duck.timer <= 0) this.startJump(duck, i, true);
        } else if (duck.jump) this.stepJump(duck, dt);
        else this.stepWaterDuck(duck, dt);
      });
      if (this.ducks.every(duck => duck.inWater)) {
        flock.mode = 'swimming'; flock.timer = this.between(18, 32);
      }
    } else if (flock.mode === 'swimming') {
      this.ducks.forEach(duck => this.stepWaterDuck(duck, dt));
      if (flock.timer <= 0) {
        flock.mode = 'leaving';
        this.ducks.forEach((duck, i) => { duck.exitWait = i * 0.6; });
      }
    } else if (flock.mode === 'leaving') {
      this.ducks.forEach((duck, i) => {
        if (duck.jump) this.stepJump(duck, dt);
        else if (duck.inWater) {
          this.stepWaterDuck(duck, dt);
          if (duck.state !== 'diving') {
            duck.exitWait -= dt;
            if (duck.exitWait <= 0) this.startJump(duck, i, false);
          }
        } else duck.state = 'idle';
      });
      if (this.ducks.every(duck => !duck.inWater && !duck.jump)) {
        flock.mode = 'roaming'; flock.anchor = bounds.landEnd;
        flock.target = this.flockPoint(); flock.timer = this.between(12, 22);
      }
    }
  }
}
