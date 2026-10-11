/**
 * Idealized Rayleigh fractionation of the remaining reservoir.
 * alpha = isotope ratio of removed material / ratio of remaining material.
 * f is the fraction of the denominator isotope remaining; interpreting f as
 * bulk material remaining assumes a sufficiently rare numerator isotope.
 * Result is the change in ratio relative to the initial ratio, in per mil.
 *
 * Equation and convention: MIT OpenCourseWare 12.119, Assignment 2 (2011).
 * Assumptions: USGS, Fundamentals of Isotope Geochemistry, section 2.3.
 */
export function rayleighDelta(f, alpha) {
  if (!Number.isFinite(f) || f <= 0 || f > 1) {
    throw new RangeError('The remaining fraction must be greater than 0 and at most 1.');
  }
  if (!Number.isFinite(alpha) || alpha <= 0) {
    throw new RangeError('The fractionation factor must be a positive finite number.');
  }
  if (f === 1 || alpha === 1) return 0;
  return 1000 * Math.expm1((alpha - 1) * Math.log(f));
}

const NS = 'http://www.w3.org/2000/svg';
const PRESETS = {
  evaporation: { fraction: 50, alpha: 995 },
  none: { fraction: 50, alpha: 1000 },
  reverse: { fraction: 50, alpha: 1005 },
};

function svgNode(tag, attributes, text) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function signed(value, places = 2) {
  if (Math.abs(value) < 0.5 * 10 ** -places) return (0).toFixed(places);
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(places)}`;
}

function drawChart(svg, f, alpha) {
  const left = 72;
  const top = 25;
  const width = 540;
  const height = 235;
  const bottom = top + height;
  const bound = Math.min(65, Math.max(5, Math.ceil(Math.abs(rayleighDelta(0.05, alpha)) / 5) * 5));
  const x = (fraction) => left + ((1 - fraction) / 0.95) * width;
  const y = (delta) => top + ((bound - delta) / (2 * bound)) * height;
  const delta = rayleighDelta(f, alpha);
  const group = document.createDocumentFragment();

  group.append(
    svgNode('title', { id: 'isotope-chart-title' }, 'Idealized Rayleigh isotope fractionation'),
    svgNode('desc', { id: 'isotope-chart-description' },
      `Isotope shift in the remaining reservoir as its fraction decreases from 100 to 5 percent. ` +
      `The fractionation factor is ${alpha.toFixed(3)}. At ${Math.round(f * 100)} percent remaining, ` +
      `the ratio changes by ${signed(delta)} parts per thousand relative to its initial value. ` +
      'These are illustrative calculations, not measured meteorite data.'),
  );

  const textStyle = {
    fill: 'var(--lab-text, #94a3b8)',
    'font-family': 'inherit',
    'font-size': 12,
  };

  [-bound, -bound / 2, 0, bound / 2, bound].forEach((tick) => {
    group.append(
      svgNode('line', {
        x1: left, x2: left + width, y1: y(tick), y2: y(tick),
        stroke: tick === 0 ? 'var(--lab-axis, #64748b)' : 'var(--lab-grid, rgba(148,163,184,.22))',
        'stroke-width': 1,
        'stroke-dasharray': tick === 0 ? 'none' : '3 5',
      }),
      svgNode('text', { ...textStyle, x: left - 12, y: y(tick) + 4, 'text-anchor': 'end' },
        signed(tick, Number.isInteger(tick) ? 0 : 1)),
    );
  });

  [1, 0.75, 0.5, 0.25, 0.05].forEach((tick) => {
    group.append(
      svgNode('line', {
        x1: x(tick), x2: x(tick), y1: bottom, y2: bottom + 5,
        stroke: 'var(--lab-axis, #64748b)', 'stroke-width': 1,
      }),
      svgNode('text', { ...textStyle, x: x(tick), y: bottom + 23, 'text-anchor': 'middle' },
        `${Math.round(tick * 100)}`),
    );
  });

  group.append(
    svgNode('line', {
      x1: left, x2: left + width, y1: bottom, y2: bottom,
      stroke: 'var(--lab-axis, #64748b)', 'stroke-width': 1,
    }),
    svgNode('text', { ...textStyle, x: left + width / 2, y: 309, 'text-anchor': 'middle' },
      'Fraction remaining (%)'),
    svgNode('text', { ...textStyle, transform: `translate(17 ${top + height / 2}) rotate(-90)`, 'text-anchor': 'middle' },
      'Isotope shift Δ (‰)'),
  );

  const points = Array.from({ length: 191 }, (_, i) => {
    const sampleFraction = 1 - (i / 190) * 0.95;
    return `${i === 0 ? 'M' : 'L'}${x(sampleFraction).toFixed(2)},${y(rayleighDelta(sampleFraction, alpha)).toFixed(2)}`;
  });
  group.append(
    svgNode('path', {
      d: points.join(' '), fill: 'none', stroke: 'var(--lab-line, #b97922)',
      'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
    }),
    svgNode('line', {
      x1: x(f), x2: x(f), y1: y(delta), y2: bottom,
      stroke: 'var(--lab-line, #b97922)', 'stroke-opacity': 0.55,
      'stroke-width': 1, 'stroke-dasharray': '4 5',
    }),
    svgNode('circle', {
      cx: x(f), cy: y(delta), r: 10,
      fill: 'var(--lab-dot, #f6bb58)', 'fill-opacity': 0.18,
    }),
    svgNode('circle', {
      cx: x(f), cy: y(delta), r: 5,
      fill: 'var(--lab-dot, #f6bb58)', stroke: 'var(--lab-line, #b97922)', 'stroke-width': 1.5,
    }),
  );

  svg.setAttribute('aria-labelledby', 'isotope-chart-title isotope-chart-description');
  svg.replaceChildren(group);
}

function initializeLab() {
  const fractionInput = document.getElementById('fraction');
  const alphaInput = document.getElementById('alpha');
  const fractionOutput = document.getElementById('fraction-value');
  const alphaOutput = document.getElementById('alpha-value');
  const deltaOutput = document.getElementById('delta-value');
  const explanation = document.getElementById('lab-explanation');
  const chart = document.getElementById('isotope-chart');
  if (![fractionInput, alphaInput, fractionOutput, alphaOutput, deltaOutput, explanation, chart].every(Boolean)) return;

  const presetButtons = [...document.querySelectorAll('[data-preset]')];

  function update() {
    const f = Number(fractionInput.value) / 100;
    const alpha = Number(alphaInput.value) / 1000;
    const delta = rayleighDelta(f, alpha);
    fractionOutput.textContent = `${Math.round(f * 100)}%`;
    alphaOutput.textContent = alpha.toFixed(3);
    deltaOutput.textContent = signed(delta);
    fractionInput.setAttribute('aria-valuetext', `${Math.round(f * 100)} percent remaining`);
    alphaInput.setAttribute('aria-valuetext', `Fractionation factor ${alpha.toFixed(3)}`);

    if (alpha === 1) {
      explanation.textContent = 'With α = 1, removal does not favor either isotope. The isotope ratio of the remaining material stays unchanged.';
    } else if (f === 1) {
      explanation.textContent = 'This is the starting reservoir. No material has been removed, so its isotope ratio has not changed. Lower the fraction remaining to follow the process.';
    } else if (alpha < 1) {
      explanation.textContent = `The removed material has a lower heavy-to-light isotope ratio. The remaining reservoir becomes enriched in the heavier isotope: ${signed(delta)}‰ relative to its starting ratio.`;
    } else {
      explanation.textContent = `The removed material has a higher heavy-to-light isotope ratio. The remaining reservoir becomes depleted in the heavier isotope: ${signed(delta)}‰ relative to its starting ratio.`;
    }

    presetButtons.forEach((button) => {
      const preset = PRESETS[button.dataset.preset];
      const active = Boolean(preset && Number(alphaInput.value) === preset.alpha && Number(fractionInput.value) === preset.fraction);
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
    drawChart(chart, f, alpha);
  }

  function applyPreset(preset) {
    fractionInput.value = String(preset.fraction);
    alphaInput.value = String(preset.alpha);
    update();
  }

  fractionInput.addEventListener('input', update);
  alphaInput.addEventListener('input', update);
  presetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const preset = PRESETS[button.dataset.preset];
      if (preset) applyPreset(preset);
    });
  });
  document.getElementById('reset-lab')?.addEventListener('click', () => applyPreset(PRESETS.evaporation));
  update();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLab, { once: true });
  } else {
    initializeLab();
  }
}
