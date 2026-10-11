// A deliberately playful arcade scene, not a simulation of meteoroid flux.
// The small engine is independent of the DOM so timing and collisions can be checked.
export const METEOR_WORLD = Object.freeze({ width: 900, height: 480, ground: 432 });
export const METEOR_RULES = Object.freeze({ duration: 45, lives: 3, playerSpeed: 350, maxStep: .05, shieldSeconds: 1.8 });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function createMeteorGame({ random = Math.random, duration = METEOR_RULES.duration } = {}) {
  return {
    mode: 'ready', elapsed: 0, duration: Number.isFinite(duration) && duration > 0 ? duration : METEOR_RULES.duration,
    lives: METEOR_RULES.lives, dodged: 0, score: 0, rocks: [], nextId: 1,
    spawnTimer: .75, invulnerable: 0, player: { x: 450, y: 426, moving: false },
    random: typeof random === 'function' ? random : Math.random,
  };
}

export function resetGame(state) {
  Object.assign(state, createMeteorGame({ random: state.random, duration: state.duration }));
  return state;
}

export function startGame(state) {
  if (state.mode !== 'ready') return false;
  state.mode = 'running';
  return true;
}

export function pauseGame(state) {
  if (state.mode !== 'running') return false;
  state.mode = 'paused';
  state.player.moving = false;
  return true;
}

export function resumeGame(state) {
  if (state.mode !== 'paused') return false;
  state.mode = 'running';
  return true;
}

export function rockHitsPlayer(rock, player) {
  // A modest body-sized hitbox gives the hiker's backpack and walking feet some grace.
  const nearestX = clamp(rock.x, player.x - 10, player.x + 10);
  const nearestY = clamp(rock.y, player.y - 40, player.y);
  return (rock.x - nearestX) ** 2 + (rock.y - nearestY) ** 2 < (rock.radius * .8) ** 2;
}

function randomUnit(state) {
  const value = state.random();
  return Number.isFinite(value) ? clamp(value, 0, 1) : .5;
}

function spawnRock(state) {
  const progress = state.elapsed / state.duration;
  const x = 75 + randomUnit(state) * 1020;
  const radius = 12 + randomUnit(state) * 8;
  const vy = 175 + progress * 70 + randomUnit(state) * 25;
  state.rocks.push({
    id: state.nextId++, x, y: -55, radius,
    // A shared direction gives the streaks the visual coherence of a shower.
    // Its speed, proximity, and collisions remain deliberate arcade conventions.
    vx: -vy * .34, vy,
  });
  // Even near the finish, every new rock starts well above the visible playfield.
  state.spawnTimer = .98 - progress * .38 + randomUnit(state) * .15;
}

export function stepGame(state, seconds, input = {}) {
  if (state.mode !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return state;
  const dt = Math.min(seconds, METEOR_RULES.maxStep, state.duration - state.elapsed);
  const oldX = state.player.x;
  const direction = Number(Boolean(input.right)) - Number(Boolean(input.left));
  if (direction) state.player.x += direction * METEOR_RULES.playerSpeed * dt;
  else if (Number.isFinite(input.targetX)) {
    state.player.x += clamp(input.targetX - state.player.x, -METEOR_RULES.playerSpeed * dt, METEOR_RULES.playerSpeed * dt);
  }
  state.player.x = clamp(state.player.x, 24, METEOR_WORLD.width - 24);
  state.player.moving = Math.abs(state.player.x - oldX) > .1;
  state.elapsed += dt;
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) spawnRock(state);

  const survivors = [];
  for (const rock of state.rocks) {
    rock.x += rock.vx * dt;
    rock.y += rock.vy * dt;
    if (state.invulnerable <= 0 && rockHitsPlayer(rock, state.player)) {
      state.lives -= 1;
      state.invulnerable = METEOR_RULES.shieldSeconds;
      continue;
    }
    if (rock.y - rock.radius > METEOR_WORLD.height) state.dodged += 1;
    else survivors.push(rock);
  }
  state.rocks = survivors;
  if (state.lives <= 0) state.mode = 'lost';
  else if (state.elapsed >= state.duration - 1e-9) {
    state.elapsed = state.duration;
    state.mode = 'won';
  }
  state.score = Math.floor(state.elapsed * 10) + state.dodged * 25;
  if (state.mode !== 'running') state.player.moving = false;
  return state;
}

function mountMeteorGame() {
  const root = document.querySelector('#meteor-game');
  const canvas = document.querySelector('#meteor-canvas');
  if (!root || !canvas || root.dataset.gameMounted === 'true') return;
  const find = id => document.getElementById(id);
  const controls = {
    start: find('meteor-start'), pause: find('meteor-pause'), restart: find('meteor-restart'),
    left: find('meteor-left'), right: find('meteor-right'), status: find('meteor-status'),
    time: find('meteor-time'), lives: find('meteor-lives'), score: find('meteor-score'), best: find('meteor-best'),
    overlay: find('meteor-overlay'), title: find('meteor-overlay-title'), copy: find('meteor-overlay-copy'),
    progress: find('meteor-progress'),
  };
  if (Object.entries(controls).some(([key, value]) => key !== 'progress' && !value)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    controls.status.textContent = 'Your browser could not start the canvas game. The outdoor journal and science notes below are still available.';
    controls.start.disabled = true;
    controls.left.disabled = true;
    controls.right.disabled = true;
    return;
  }
  root.dataset.gameMounted = 'true';
  const state = createMeteorGame();
  const input = { left: false, right: false, targetX: null };
  let frameId = 0;
  let lastTime = null;
  let activePointer = null;
  let best = 0;
  let lastLives = state.lives;
  let lastMode = '';
  const storageKey = 'rishant-outdoors-meteor-best-v1';
  try {
    const stored = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(stored) && stored >= 0) best = Math.floor(stored);
  } catch { /* Private browsing can disable storage; this visit still has a best score. */ }
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars = Array.from({ length: 48 }, (_, i) => ({
    x: ((i * 137.508) % 880) + 10, y: ((i * 73.31) % 230) + 18, r: i % 6 === 0 ? 1.35 : .7,
  }));

  function setText(element, text) {
    if (element.textContent !== String(text)) element.textContent = String(text);
  }

  function clearInput() {
    input.left = false;
    input.right = false;
    input.targetX = null;
    activePointer = null;
    controls.left.classList.remove('is-held');
    controls.right.classList.remove('is-held');
  }

  function nudge(direction) {
    // A short tap should register even if keyup arrives before the next frame.
    state.player.x = clamp(state.player.x + (direction === 'left' ? -18 : 18), 24, METEOR_WORLD.width - 24);
    draw();
  }

  function stopFrame() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    lastTime = null;
  }

  function updateInterface(announcement) {
    const remaining = Math.max(0, Math.ceil(state.duration - state.elapsed));
    setText(controls.time, `${remaining}s`);
    setText(controls.lives, state.lives);
    setText(controls.score, state.score);
    setText(controls.best, best);
    if (controls.progress) controls.progress.value = state.elapsed;
    controls.start.hidden = state.mode !== 'ready';
    controls.pause.disabled = !['running', 'paused'].includes(state.mode);
    controls.pause.textContent = state.mode === 'paused' ? 'Resume expedition' : 'Pause';
    controls.pause.setAttribute('aria-pressed', String(state.mode === 'paused'));
    controls.restart.disabled = state.mode === 'ready';
    controls.left.disabled = state.mode !== 'running';
    controls.right.disabled = state.mode !== 'running';
    controls.overlay.hidden = state.mode === 'running';
    root.dataset.state = state.mode;
    if (state.mode === 'ready') {
      setText(controls.title, 'Your campsite is waiting.');
      setText(controls.copy, 'Dodge the bright meteor heads for 45 seconds. Three lives. One starry trail.');
    } else if (state.mode === 'paused') {
      setText(controls.title, 'A moment under the stars.');
      setText(controls.copy, 'The trail is paused. Resume when you are ready.');
    } else if (state.mode === 'won') {
      setText(controls.title, 'You made it to camp.');
      setText(controls.copy, `${state.dodged} meteors dodged · ${state.score} points. The night is yours.`);
    } else if (state.mode === 'lost') {
      setText(controls.title, 'Time for another trail.');
      setText(controls.copy, `${Math.floor(state.elapsed)} seconds on the trail · ${state.score} points. Restart for another expedition.`);
    }
    if (announcement) setText(controls.status, announcement);
    else if (state.mode !== lastMode) {
      const messages = {
        ready: 'Ready when you are. Start the expedition to play.',
        running: 'Expedition in progress. Move left or right to avoid the bright meteor heads.',
        paused: 'Expedition paused. Choose Resume expedition to continue.',
        won: `Campsite reached! You scored ${state.score} points and dodged ${state.dodged} meteors.`,
        lost: `Expedition ended. You scored ${state.score} points. Choose Restart to try again.`,
      };
      setText(controls.status, messages[state.mode]);
    } else if (state.lives < lastLives) {
      setText(controls.status, `A meteor caught you. ${state.lives} ${state.lives === 1 ? 'life' : 'lives'} remaining. A brief shield gives you time to move.`);
    }
    lastMode = state.mode;
    lastLives = state.lives;
  }

  function mountain(points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, METEOR_WORLD.height);
    points.forEach(([x, y]) => ctx.lineTo(x, y));
    ctx.lineTo(METEOR_WORLD.width, METEOR_WORLD.height);
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    const { width, height } = METEOR_WORLD;
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#101b22');
    sky.addColorStop(1, '#293b3d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#c9d6ca';
    for (const star of stars) {
      ctx.globalAlpha = .36;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#e2d6b7';
    ctx.beginPath(); ctx.arc(754, 78, 21, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#122029';
    ctx.beginPath(); ctx.arc(764, 71, 20, 0, Math.PI * 2); ctx.fill();
    mountain([[0, 323], [117, 228], [189, 301], [306, 180], [448, 328], [586, 237], [724, 321], [842, 207], [900, 285]], '#253739');
    mountain([[0, 361], [89, 303], [186, 360], [315, 292], [437, 369], [605, 292], [735, 367], [839, 308], [900, 351]], '#304442');
    mountain([[0, 393], [160, 371], [283, 399], [410, 370], [627, 400], [765, 369], [900, 392]], '#223632');
    ctx.fillStyle = '#172923';
    ctx.fillRect(0, METEOR_WORLD.ground, width, height - METEOR_WORLD.ground);
    ctx.strokeStyle = '#647765'; ctx.globalAlpha = .42; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 432); ctx.lineTo(width, 432); ctx.stroke(); ctx.globalAlpha = 1;
    // A small tent at the edge of the clearing anchors the campsite destination.
    ctx.fillStyle = '#ae8565';
    ctx.beginPath(); ctx.moveTo(784, 429); ctx.lineTo(823, 372); ctx.lineTo(867, 429); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#816a50';
    ctx.beginPath(); ctx.moveTo(823, 372); ctx.lineTo(846, 429); ctx.lineTo(867, 429); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#26362d';
    ctx.beginPath(); ctx.moveTo(808, 429); ctx.lineTo(823, 400); ctx.lineTo(837, 429); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#83917a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(790, 407); ctx.lineTo(771, 432); ctx.moveTo(852, 407); ctx.lineTo(877, 432); ctx.stroke();

    for (const rock of state.rocks) {
      const speed = Math.hypot(rock.vx, rock.vy);
      const ux = rock.vx / speed, uy = rock.vy / speed;
      const trailLength = 100 + rock.radius * 4;
      const tailX = rock.x - ux * trailLength;
      const tailY = rock.y - uy * trailLength;
      const tail = ctx.createLinearGradient(rock.x, rock.y, tailX, tailY);
      tail.addColorStop(0, 'rgba(255, 235, 197, .95)');
      tail.addColorStop(.22, 'rgba(214, 223, 228, .7)');
      tail.addColorStop(1, 'rgba(143, 190, 216, 0)');
      ctx.fillStyle = tail;
      ctx.beginPath();
      ctx.moveTo(rock.x - uy * 3.5, rock.y + ux * 3.5);
      ctx.lineTo(tailX, tailY);
      ctx.lineTo(rock.x + uy * 3.5, rock.y - ux * 3.5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = tail; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(rock.x, rock.y); ctx.stroke();
      const glow = ctx.createRadialGradient(rock.x, rock.y, 1, rock.x, rock.y, rock.radius * 1.3);
      glow.addColorStop(0, 'rgba(255, 241, 213, .85)');
      glow.addColorStop(.35, 'rgba(242, 191, 125, .35)');
      glow.addColorStop(1, 'rgba(226, 168, 100, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(rock.x, rock.y, rock.radius * 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff4db';
      ctx.beginPath(); ctx.arc(rock.x, rock.y, 2.8, 0, Math.PI * 2); ctx.fill();
    }

    const { x, y, moving } = state.player;
    const stride = moving && !motionPreference.matches ? Math.sin(state.elapsed * 18) * 4 : 0;
    ctx.fillStyle = 'rgba(6, 18, 14, .35)';
    ctx.beginPath(); ctx.ellipse(x, y + 5, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (state.invulnerable > 0) {
      ctx.strokeStyle = '#dfc893'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(x, y - 21, 26, 33, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = '#e0d5b5'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x - 7 - stride, y); ctx.moveTo(x, y - 15); ctx.lineTo(x + 7 + stride, y); ctx.stroke();
    ctx.fillStyle = '#929e73'; ctx.fillRect(x - 13, y - 28, 10, 17);
    ctx.strokeStyle = '#d8a77c'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x, y - 14); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 1, y - 25); ctx.lineTo(x + 11, y - 14 - stride / 2); ctx.stroke();
    ctx.fillStyle = '#edc7a4'; ctx.beginPath(); ctx.arc(x, y - 37, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c5cbaa'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 10, y - 41); ctx.lineTo(x + 9, y - 41); ctx.stroke();
    ctx.fillStyle = '#8e9c72'; ctx.fillRect(x - 6, y - 46, 12, 6);
  }

  function resize() {
    const displayedWidth = canvas.getBoundingClientRect().width || METEOR_WORLD.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(displayedWidth * dpr));
    canvas.height = Math.max(1, Math.round(displayedWidth * METEOR_WORLD.height / METEOR_WORLD.width * dpr));
    draw();
  }

  function saveBest() {
    if (state.score <= best) return;
    best = state.score;
    try { localStorage.setItem(storageKey, String(best)); } catch { /* Keep it for this visit if persistence is unavailable. */ }
  }

  function tick(timestamp) {
    frameId = 0;
    if (state.mode !== 'running') { lastTime = null; return; }
    const dt = lastTime === null ? 0 : Math.min(Math.max(0, (timestamp - lastTime) / 1000), METEOR_RULES.maxStep);
    lastTime = timestamp;
    stepGame(state, dt, input);
    if (state.mode === 'won' || state.mode === 'lost') { saveBest(); clearInput(); lastTime = null; }
    updateInterface();
    draw();
    if (state.mode === 'running') frameId = requestAnimationFrame(tick);
  }

  function beginFrames() {
    stopFrame();
    updateInterface();
    draw();
    if (state.mode === 'running') frameId = requestAnimationFrame(tick);
  }

  function ensureGameVisible() {
    const margin = 16;
    const availableHeight = window.innerHeight - margin * 2;
    const wrapper = root.getBoundingClientRect();
    const playfield = canvas.getBoundingClientRect();
    const hud = root.querySelector('.meteor-hud')?.getBoundingClientRect();
    const sceneTop = hud ? Math.min(hud.top, playfield.top) : playfield.top;
    const sceneHeight = playfield.bottom - sceneTop;
    // Prefer showing the controls as well. On short screens, preserve the
    // playable scene and timer together; center the canvas only as a fallback.
    const target = wrapper.height <= availableHeight
      ? { top: wrapper.top, bottom: wrapper.bottom, height: wrapper.height }
      : sceneHeight <= availableHeight
        ? { top: sceneTop, bottom: playfield.bottom, height: sceneHeight }
        : { top: playfield.top, bottom: playfield.bottom, height: playfield.height };
    if (target.top < margin || target.bottom > window.innerHeight - margin) {
      window.scrollTo({ top: window.scrollY + target.top - (window.innerHeight - target.height) / 2, behavior: 'instant' });
    }
  }

  function pause(announcement) {
    if (!pauseGame(state)) return;
    stopFrame(); clearInput(); updateInterface(announcement); draw();
  }

  function resume() {
    if (!resumeGame(state)) return;
    clearInput(); root.focus({ preventScroll: true }); beginFrames(); ensureGameVisible();
  }

  controls.start.addEventListener('click', () => {
    if (!startGame(state)) return;
    clearInput(); root.focus({ preventScroll: true }); beginFrames(); ensureGameVisible();
  });
  controls.pause.addEventListener('click', () => state.mode === 'paused' ? resume() : pause());
  controls.restart.addEventListener('click', () => {
    stopFrame(); saveBest(); clearInput(); resetGame(state); startGame(state);
    root.focus({ preventScroll: true }); beginFrames(); ensureGameVisible();
  });

  root.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (['arrowleft', 'a', 'arrowright', 'd'].includes(key) && state.mode === 'running') {
      event.preventDefault();
      const direction = key === 'arrowleft' || key === 'a' ? 'left' : 'right';
      if (!event.repeat && !input[direction]) nudge(direction);
      input[direction] = true;
      input.targetX = null;
    } else if ((key === 'p' || key === 'escape') && ['running', 'paused'].includes(state.mode)) {
      event.preventDefault();
      if (event.repeat) return;
      if (state.mode === 'running') pause();
      else if (key === 'p') resume();
    }
  });
  window.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') input.left = false;
    if (key === 'arrowright' || key === 'd') input.right = false;
  });
  root.addEventListener('focusout', event => {
    if (!root.contains(event.relatedTarget)) pause('Expedition paused while focus is outside the game. Resume when you return.');
  });
  window.addEventListener('blur', () => pause('Expedition paused while you were away. Resume when you are ready.'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause('Expedition paused while this tab was hidden. Resume when you are ready.');
  });

  for (const [direction, button] of [['left', controls.left], ['right', controls.right]]) {
    const release = () => { input[direction] = false; button.classList.remove('is-held'); };
    button.addEventListener('pointerdown', event => {
      if (state.mode !== 'running' || event.button !== 0) return;
      event.preventDefault();
      if (!input[direction]) nudge(direction);
      input[direction] = true; input.targetX = null;
      button.classList.add('is-held');
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
    button.addEventListener('keydown', event => {
      if (state.mode === 'running' && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        if (!event.repeat && !input[direction]) nudge(direction);
        input[direction] = true; input.targetX = null; button.classList.add('is-held');
      }
    });
    button.addEventListener('keyup', event => { if (event.key === ' ' || event.key === 'Enter') release(); });
    button.addEventListener('blur', release);
  }

  function pointerTarget(event) {
    const rect = canvas.getBoundingClientRect();
    input.targetX = clamp((event.clientX - rect.left) / rect.width * METEOR_WORLD.width, 24, METEOR_WORLD.width - 24);
  }
  canvas.addEventListener('pointerdown', event => {
    if (state.mode !== 'running' || event.button !== 0) return;
    event.preventDefault(); root.focus({ preventScroll: true });
    activePointer = event.pointerId; input.left = false; input.right = false;
    canvas.setPointerCapture(event.pointerId); pointerTarget(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (state.mode === 'running' && event.pointerId === activePointer) { event.preventDefault(); pointerTarget(event); }
  });
  const releaseCanvas = event => {
    if (event.pointerId === activePointer) { activePointer = null; input.targetX = null; }
  };
  canvas.addEventListener('pointerup', releaseCanvas);
  canvas.addEventListener('pointercancel', releaseCanvas);
  canvas.addEventListener('lostpointercapture', releaseCanvas);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) pause('Expedition paused while the game is off screen. Resume when you return to the trail.');
    }).observe(canvas);
  }
  motionPreference.addEventListener('change', draw);
  updateInterface(); resize();
}

if (typeof document !== 'undefined') mountMeteorGame();
