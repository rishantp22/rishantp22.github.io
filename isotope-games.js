// All scales below compare the same isotope ratio with the same reference and corrections.
export function scalesFromNormalizedRatio(q) {
  if (!Number.isFinite(q) || q < 0) throw new RangeError('The normalized isotope ratio must be finite and nonnegative.');
  const difference = q - 1;
  return {
    percent: difference * 100,
    delta: difference * 1000,
    epsilon: difference * 10000,
    mu: difference * 1000000,
    percentOfReference: q * 100
  };
}

export function epsilonFromNormalizedRatio(q) {
  return scalesFromNormalizedRatio(q).epsilon;
}

export function isCorrectEpsilonAnswer(q, answer, tolerance = 0.005001) {
  if (typeof answer === 'string' && answer.trim() === '') return false;
  if (typeof answer !== 'string' && typeof answer !== 'number') return false;
  const value = Number(answer);
  return Number.isFinite(value) && Math.abs(value - epsilonFromNormalizedRatio(q)) <= tolerance;
}

// Fictional, already-corrected teaching values: these are not measured meteorites.
export const METEORITE_ROUNDS = Object.freeze([
  Object.freeze({ id: 'M-01', q: 1.000240, title: 'A small excess', hint: 'The sample ratio is slightly above the reference. Your epsilon should be positive.' }),
  Object.freeze({ id: 'M-02', q: 0.999880, title: 'Read the sign', hint: 'The sample ratio is below the reference. Keep the negative sign when you subtract 1.' }),
  Object.freeze({ id: 'M-03', q: 1.000035, title: 'A finer difference', hint: 'Epsilon can be smaller than 1. Carefully count the decimal places.' }),
  Object.freeze({ id: 'M-04', q: 1.000000, title: 'A familiar reference', hint: 'An identical ratio means zero relative difference on every anomaly scale.' }),
  Object.freeze({ id: 'M-05', q: 1.000725, title: 'Bring it together', hint: 'Subtract 1 first, then multiply the fractional difference by 10,000.' })
]);

export function createMeteoriteGame() {
  let index = 0;
  let complete = false;
  let records = METEORITE_ROUNDS.map(() => ({ resolved: false, correct: false, revealed: false, attempts: 0 }));
  function getState() {
    return {
      index, complete, round: METEORITE_ROUNDS[index], total: METEORITE_ROUNDS.length,
      score: records.filter(record => record.correct).length,
      resolved: records[index].resolved,
      records: records.map(record => ({ ...record }))
    };
  }
  function checkAnswer(raw) {
    if (complete || records[index].resolved) return { status: 'locked', ...getState() };
    if ((typeof raw !== 'number' && typeof raw !== 'string') || (typeof raw === 'string' && raw.trim() === '') || !Number.isFinite(Number(raw))) {
      return { status: 'invalid', ...getState() };
    }
    records[index].attempts += 1;
    if (!isCorrectEpsilonAnswer(METEORITE_ROUNDS[index].q, raw)) return { status: 'incorrect', ...getState() };
    records[index].correct = true;
    records[index].resolved = true;
    return { status: 'correct', ...getState() };
  }
  function revealAnswer() {
    if (complete || records[index].resolved) return { status: 'locked', ...getState() };
    records[index].revealed = true;
    records[index].resolved = true;
    return { status: 'revealed', ...getState() };
  }
  function nextRound() {
    if (!records[index].resolved || complete) return false;
    if (index === METEORITE_ROUNDS.length - 1) complete = true;
    else index += 1;
    return true;
  }
  function reset() {
    index = 0;
    complete = false;
    records = METEORITE_ROUNDS.map(() => ({ resolved: false, correct: false, revealed: false, attempts: 0 }));
    return getState();
  }
  return { getState, checkAnswer, revealAnswer, nextRound, reset };
}

function formatted(value, maximumFractionDigits = 2, signed = false) {
  const stableValue = Math.abs(value) < 1e-9 ? 0 : value;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits, signDisplay: signed ? 'exceptZero' : 'auto' }).format(stableValue);
}

function initializeMeteoriteGame() {
  const form = document.querySelector('#epsilon-form');
  if (!form) return;
  const game = createMeteoriteGame();
  const answer = document.querySelector('#epsilon-answer');
  const feedback = document.querySelector('#game-feedback');
  const next = document.querySelector('#next-sample');
  const hint = document.querySelector('#answer-hint');
  const result = document.querySelector('#sample-result');

  function updateProgress() {
    const state = game.getState();
    document.querySelector('#game-score').textContent = `${state.score} / ${state.total}`;
    document.querySelectorAll('[data-round-progress]').forEach((item, index) => {
      const record = state.records[index];
      const status = record.correct ? 'solved' : record.revealed ? 'revealed' : index === state.index ? 'current' : 'pending';
      item.dataset.state = status;
      item.setAttribute('aria-label', `Sample ${index + 1}: ${status}`);
      if (status === 'current') item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }

  function renderRound(moveFocus = false) {
    const state = game.getState();
    const round = state.round;
    document.querySelector('#sample-number').textContent = round.id;
    document.querySelector('#sample-title').textContent = round.title;
    document.querySelector('#round-counter').textContent = `SAMPLE ${state.index + 1} OF ${state.total}`;
    document.querySelector('#normalized-ratio').textContent = round.q.toFixed(6);
    const x = 210 + ((round.q - 1) / 0.001) * 170;
    document.querySelector('#ratio-marker').setAttribute('cx', x.toFixed(2));
    document.querySelector('#ratio-stem').setAttribute('x1', x.toFixed(2));
    document.querySelector('#ratio-stem').setAttribute('x2', x.toFixed(2));
    document.querySelector('#ratio-plot').setAttribute('aria-label', `Magnified normalized-ratio axis from 0.999 to 1.001. The sample ratio is ${round.q.toFixed(6)}; the reference is 1.`);
    answer.value = '';
    answer.disabled = false;
    answer.removeAttribute('aria-invalid');
    document.querySelector('#check-answer').disabled = false;
    document.querySelector('#reveal-answer').disabled = false;
    document.querySelector('#show-hint').disabled = false;
    document.querySelector('#show-hint').setAttribute('aria-expanded', 'false');
    hint.hidden = true;
    result.hidden = true;
    next.disabled = true;
    next.textContent = state.index === state.total - 1 ? 'See my result →' : 'Next sample →';
    feedback.dataset.kind = 'neutral';
    feedback.textContent = moveFocus ? `Sample ${state.index + 1} is ready. Calculate epsilon from the new ratio.` : 'Enter your result to check this sample.';
    updateProgress();
    if (moveFocus) answer.focus();
  }

  function resolveRound(outcome) {
    const state = game.getState();
    const values = scalesFromNormalizedRatio(state.round.q);
    document.querySelector('#result-epsilon').textContent = formatted(values.epsilon, 2, true);
    document.querySelector('#result-percent').textContent = `${formatted(values.percent, 5, true)}%`;
    document.querySelector('#result-mu').textContent = formatted(values.mu, 2, true);
    document.querySelector('#result-equation').textContent = `(${state.round.q.toFixed(6)} − 1) × 10,000 = ${formatted(values.epsilon, 2, true)}`;
    result.hidden = false;
    answer.disabled = true;
    answer.removeAttribute('aria-invalid');
    document.querySelector('#check-answer').disabled = true;
    document.querySelector('#reveal-answer').disabled = true;
    document.querySelector('#show-hint').disabled = true;
    next.disabled = false;
    feedback.dataset.kind = outcome.status;
    feedback.textContent = outcome.status === 'correct'
      ? `Correct: ε⁵⁴Cr = ${formatted(values.epsilon, 2, true)}. One point added. Score: ${state.score} of ${state.total}.`
      : `Solution: ε⁵⁴Cr = ${formatted(values.epsilon, 2, true)}. This revealed sample earns no point. You can continue.`;
    updateProgress();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const outcome = game.checkAnswer(answer.value);
    if (outcome.status === 'correct') resolveRound(outcome);
    else if (outcome.status === 'invalid') {
      feedback.dataset.kind = 'incorrect';
      feedback.textContent = 'Enter a finite number, such as 2.4 or −1.2. Use a minus sign for a deficit.';
      answer.setAttribute('aria-invalid', 'true');
    } else if (outcome.status === 'incorrect') {
      feedback.dataset.kind = 'incorrect';
      feedback.textContent = 'Not quite. Subtract 1 from the normalized ratio, then multiply by 10,000. Try again or open the hint.';
      answer.setAttribute('aria-invalid', 'true');
    }
  });
  document.querySelector('#show-hint').addEventListener('click', event => {
    hint.hidden = !hint.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!hint.hidden));
    hint.textContent = game.getState().round.hint;
  });
  document.querySelector('#reveal-answer').addEventListener('click', () => {
    const outcome = game.revealAnswer();
    if (outcome.status === 'revealed') resolveRound(outcome);
  });
  next.addEventListener('click', () => {
    if (!game.nextRound()) return;
    const state = game.getState();
    if (state.complete) {
      document.querySelector('#challenge-active').hidden = true;
      document.querySelector('#challenge-summary').hidden = false;
      document.querySelector('#final-score').textContent = `${state.score} / ${state.total}`;
      document.querySelector('#summary-message').textContent = state.score === state.total
        ? 'Five samples, five correct calculations. Now change the scale and explore a much larger stellar signature.'
        : `You solved ${state.score} of ${state.total} samples without revealing the answer. Every sample used the same rule: subtract the reference, then scale the difference.`;
      document.querySelector('#challenge-summary').focus();
    } else renderRound(true);
  });
  document.querySelectorAll('[data-reset-game]').forEach(button => button.addEventListener('click', () => {
    game.reset();
    document.querySelector('#challenge-active').hidden = false;
    document.querySelector('#challenge-summary').hidden = true;
    renderRound(true);
  }));
  document.querySelector('#challenge-loading').hidden = true;
  document.querySelector('#challenge-interface').hidden = false;
  renderRound();
}

function initializePresolarExplorer() {
  const slider = document.querySelector('#presolar-ratio');
  if (!slider) return;
  const blocks = document.querySelector('#ratio-blocks');
  for (let i = 0; i < 60; i++) {
    const block = document.createElement('span');
    const fill = document.createElement('i');
    block.append(fill);
    blocks.append(block);
  }
  function update() {
    const q = Number(slider.value);
    const values = scalesFromNormalizedRatio(q);
    document.querySelector('#presolar-ratio-value').textContent = `${formatted(q, 1)}×`;
    slider.setAttribute('aria-valuetext', `${formatted(q, 1)} times the reference ratio`);
    document.querySelector('#presolar-percent').textContent = `${formatted(values.percent, 1, true)}%`;
    document.querySelector('#presolar-of-reference').textContent = `${formatted(values.percentOfReference, 1)}% of the reference ratio`;
    document.querySelector('#sample-ratio-label').textContent = `Sample: ${formatted(q, 1)}× reference`;
    document.querySelector('#presolar-equation').textContent = `(${formatted(q, 1)} − 1) × 100 = ${formatted(values.percent, 1, true)}%`;
    const comparison = q === 1 ? 'The ratio matches the reference.' : `${formatted(Math.abs(values.percent), 1)}% ${q > 1 ? 'higher' : 'lower'} than the reference ratio.`;
    document.querySelector('#presolar-comparison').textContent = comparison;
    document.querySelector('#scale-percent').textContent = `${formatted(values.percent, 1, true)}%`;
    document.querySelector('#scale-delta').textContent = `${formatted(values.delta, 1, true)}‰`;
    document.querySelector('#scale-epsilon').textContent = formatted(values.epsilon, 1, true);
    document.querySelector('#scale-mu').textContent = formatted(values.mu, 1, true);
    [...blocks.children].forEach((block, index) => {
      const fraction = Math.max(0, Math.min(1, q - index));
      block.firstElementChild.style.width = `${fraction * 100}%`;
    });
    document.querySelectorAll('[data-ratio-preset]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.ratioPreset) === q));
    });
    document.querySelector('#presolar-announcement').textContent = `${formatted(q, 1)} times the reference. ${comparison} This is ${formatted(values.percentOfReference, 1)} percent of the reference ratio.`;
    document.querySelector('#literature-preset-note').hidden = q !== 57;
  }
  slider.addEventListener('input', update);
  document.querySelectorAll('[data-ratio-preset]').forEach(button => button.addEventListener('click', () => {
    slider.value = button.dataset.ratioPreset;
    update();
  }));
  document.querySelector('#presolar-controls').hidden = false;
  document.querySelector('#ratio-unit-visual').hidden = false;
  update();
}

if (typeof document !== 'undefined') {
  initializeMeteoriteGame();
  initializePresolarExplorer();
}
