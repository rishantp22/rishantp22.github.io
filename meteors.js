// A decorative sky with gentle scroll depth, paused for reduced motion or hidden tabs.
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const canvas = document.createElement('canvas');
canvas.className = 'meteor-sky';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d');
let userEnabled = true;
try { userEnabled = localStorage.getItem('meteor-motion') !== 'off'; } catch {}
let frame = 0, width = 0, height = 0, previous = 0, elapsed = 0, streaks = [];
let lastScroll = window.scrollY, scrollDepth = 0, scrollTarget = 0, scrollEnergy = 0;
const stars = Array.from({ length: 78 }, () => ({
  x: Math.random(), y: Math.random(), r: .4 + Math.random() * .7,
  depth: .35 + Math.random() * .65, opacity: .11 + Math.random() * .14
}));
const toggle = document.createElement('button');
toggle.type = 'button';
toggle.className = 'motion-toggle';
document.querySelector('.site-footer')?.append(toggle);
const canAnimate = () => userEnabled && !preference.matches && !document.hidden;
const maxStreaks = () => width < 760 ? 4 : 5;

function updateButton() {
  const active = userEnabled && !preference.matches;
  toggle.textContent = active ? 'Pause meteor showers' : 'Enable meteor showers';
  toggle.setAttribute('aria-label', active ? 'Pause meteor showers' : 'Enable meteor showers');
  toggle.setAttribute('aria-pressed', String(active));
  toggle.disabled = preference.matches;
  if (preference.matches) {
    toggle.textContent = 'Meteor showers paused';
    toggle.setAttribute('aria-label', 'Meteor showers paused for reduced motion');
    toggle.title = 'Paused to respect your reduced-motion preference';
  } else toggle.removeAttribute('title');
}

function background() {
  ctx.clearRect(0, 0, width, height);
  stars.forEach(star => {
    const y = ((star.y * height - scrollDepth * star.depth) % height + height) % height;
    ctx.fillStyle = `rgba(231, 224, 203, ${star.opacity})`;
    ctx.beginPath();
    ctx.arc(star.x * width, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  streaks = streaks.slice(0, maxStreaks());
  background();
}

function createStreak(initial = false) {
  const life = 4.3 + Math.random() * 1.1;
  return {
    x: width * (.18 + Math.random() * .96),
    y: height * (-.06 + Math.random() * .7),
    age: initial ? life * (.12 + Math.random() * .17) : 0,
    life,
    length: (width < 760 ? 70 : 105) + Math.random() * (width < 760 ? 65 : 85),
    speed: 89 + Math.random() * 27,
    strength: .82 + Math.random() * .18
  };
}

function draw(time) {
  frame = 0;
  if (!canAnimate()) return;
  const dt = previous ? Math.min((time - previous) / 1000, .05) : 0;
  previous = time;
  elapsed += dt;
  scrollDepth += (scrollTarget - scrollDepth) * (1 - Math.exp(-dt * 3));
  scrollEnergy *= Math.exp(-dt * 1.7);
  const interval = (width < 760 ? 1.6 : 1.22) - scrollEnergy * .12;
  if (elapsed > interval && streaks.length < maxStreaks()) {
    elapsed = 0;
    streaks.push(createStreak());
  }
  background();
  streaks.forEach(streak => {
    streak.age += dt;
    const speed = streak.speed * (1 + scrollEnergy * .12);
    streak.x -= dt * speed;
    streak.y += dt * speed * .624;
    const fade = Math.sin(Math.min(streak.age / streak.life, 1) * Math.PI);
    const opacity = Math.pow(fade, 1.2) * .3 * streak.strength;
    const headY = streak.y - scrollDepth * .45;
    const tailX = streak.x + streak.length;
    const tailY = headY - streak.length * .624;
    const gradient = ctx.createLinearGradient(streak.x, headY, tailX, tailY);
    gradient.addColorStop(0, `rgba(248, 218, 186, ${opacity})`);
    gradient.addColorStop(.3, `rgba(235, 188, 146, ${opacity * .65})`);
    gradient.addColorStop(1, 'rgba(235, 188, 146, 0)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(streak.x, headY);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();
    ctx.fillStyle = `rgba(250, 226, 198, ${opacity * .85})`;
    ctx.beginPath();
    ctx.arc(streak.x, headY, .9, 0, Math.PI * 2);
    ctx.fill();
  });
  streaks = streaks.filter(streak => streak.age < streak.life);
  if (canAnimate()) frame = requestAnimationFrame(draw);
}

function sync() {
  cancelAnimationFrame(frame);
  frame = 0;
  previous = 0;
  scrollEnergy = 0;
  lastScroll = window.scrollY;
  updateButton();
  if (canAnimate()) {
    scrollTarget = Math.min(window.scrollY * .025, 65);
    if (!streaks.length) streaks = Array.from({ length: width < 760 ? 2 : 3 }, () => createStreak(true));
    frame = requestAnimationFrame(draw);
  } else {
    streaks = [];
    background();
  }
}

if (ctx) {
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => {
    const now = window.scrollY;
    if (canAnimate()) {
      scrollTarget = Math.min(Math.max(now, 0) * .025, 65);
      scrollEnergy = Math.min(1, scrollEnergy + Math.min(Math.abs(now - lastScroll), 100) / 180);
    }
    lastScroll = now;
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  // System changes must not erase a manual pause saved by the visitor.
  preference.addEventListener('change', sync);
  window.addEventListener('storage', event => {
    if (event.key !== 'meteor-motion') return;
    userEnabled = event.newValue !== 'off';
    sync();
  });
  toggle.addEventListener('click', () => {
    userEnabled = !userEnabled;
    try { localStorage.setItem('meteor-motion', userEnabled ? 'on' : 'off'); } catch {}
    sync();
  });
  sync();
} else {
  canvas.remove();
  toggle.remove();
}
