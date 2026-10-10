import './isotope.js';

const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
    menu.focus();
  }
});

const stories = {
  asteroids: {
    kicker: '01 / SMALL WORLDS', title: 'Archives in orbit.',
    text: 'Asteroids preserve diverse histories of the Solar System. Some retain ancient mixtures of rock and metal; others experienced melting and separation into layers. Bennu, shown here, is one of these small worlds—a bridge between observations from space and samples studied in the laboratory.',
    source: 'NASA · Explore asteroids ↗', url: 'https://science.nasa.gov/solar-system/asteroids/facts/', next: '#research', action: 'Follow the chemical clues →'
  },
  meteorites: {
    kicker: '02 / MESSENGERS FROM SPACE', title: 'A history you can hold.',
    text: 'Most meteorites found on Earth are fragments of asteroids. Their minerals and chemical compositions preserve clues to heating, alteration, and the ingredients of the early Solar System. My work examines these records in materials including calcium–aluminum-rich inclusions and amoeboid olivine aggregates.',
    source: 'NASA · Explore meteorites ↗', url: 'https://science.nasa.gov/solar-system/meteors-meteorites/facts/', next: '#research', action: 'Explore my research →'
  },
  isotopes: {
    kicker: '03 / THE FINE PRINT', title: 'Same element. Different mass.',
    text: 'Isotopes share an element’s proton count but differ in their number of neutrons. Physical and chemical processes can shift their relative proportions. In the interactive lab, explore an idealized example of how progressive removal changes the isotopic signature of the material left behind.',
    source: 'MIT · Explore fractionation ↗', url: 'https://ocw.mit.edu/courses/12-119-analytical-techniques-for-studying-environmental-and-geologic-samples-spring-2011/e7ace2638d7b86bab91eb63ea19f524b_MIT12_119S11_PSet2.pdf', next: '#isotope-lab', action: 'Try the isotope experiment →'
  }
};
const storyDialog = document.querySelector('#story-panel');
let storyTrigger;
document.querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => {
  const story = stories[button.dataset.story];
  storyTrigger = button;
  button.setAttribute('aria-expanded', 'true');
  document.querySelector('#story-kicker').textContent = story.kicker;
  document.querySelector('#story-title').textContent = story.title;
  document.querySelector('#story-text').textContent = story.text;
  const source = document.querySelector('#story-source');
  source.textContent = story.source;
  source.href = story.url;
  const next = document.querySelector('#story-next');
  next.href = story.next;
  next.textContent = story.action;
  storyDialog.showModal();
}));
const resetStoryState = () => storyTrigger?.setAttribute('aria-expanded', 'false');
storyDialog.addEventListener('close', resetStoryState);
storyDialog.addEventListener('cancel', resetStoryState);
document.querySelector('#story-next').addEventListener('click', () => storyDialog.close());
document.querySelector('#credits-open').addEventListener('click', () => document.querySelector('#credits-panel').showModal());
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});

const observedSections = document.querySelectorAll('main > section[id]');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      document.querySelectorAll('#navigation a[href^="#"]').forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-20% 0px -55% 0px' });
  observedSections.forEach(section => observer.observe(section));
}
document.querySelector('#year').textContent = new Date().getFullYear();
