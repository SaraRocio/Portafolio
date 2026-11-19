import './style.css';
import { createBookScene, opening } from './book-scene.js';
import { chapters } from './chapters.js';

const book = document.querySelector('.book');
const spread = document.querySelector('.spread');
const index = document.querySelector('.cutouts');
const tabs = document.querySelector('.tabs');
const chapter = document.querySelector('.chapter');
const heading = chapter.querySelector('h2');
const description = chapter.querySelector('p');
const art = chapter.querySelector('.chapter-art');
const back = chapter.querySelector('.back');
const skip = document.querySelector('.skip');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function drawArt(container, item) {
  if (item.art) {
    const image = document.createElement('img');
    image.src = item.art;
    image.alt = '';
    container.replaceChildren(image);
  } else {
    container.textContent = item.symbol;
  }
  container.style.setProperty('--ink', item.color);
}

const cutouts = new Map();
const separators = new Map();
for (const item of chapters) {
  const cutout = document.createElement('button');
  cutout.type = 'button';
  cutout.className = 'cutout';
  const illustration = document.createElement('span');
  illustration.className = 'cutout-art';
  illustration.setAttribute('aria-hidden', 'true');
  drawArt(illustration, item);
  const label = document.createElement('span');
  label.className = 'ribbon';
  label.textContent = item.title;
  cutout.append(illustration, label);
  cutout.addEventListener('click', () => showChapter(item));
  index.append(cutout);
  cutouts.set(item.id, cutout);

  const tab = document.createElement('button');
  tab.type = 'button';
  tab.textContent = item.title;
  tab.style.setProperty('--ink', item.color);
  tab.addEventListener('click', () => showChapter(item));
  tabs.append(tab);
  separators.set(item.id, tab);
}

let activeChapter;
function showChapter(item) {
  if (activeChapter === item) return;
  activeChapter = item;
  book.dataset.state = 'chapter';
  heading.textContent = item.title;
  description.textContent = item.description;
  drawArt(art, item);
  for (const [id, tab] of separators) {
    if (id === item.id) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  index.hidden = true;
  chapter.hidden = false;
  tabs.hidden = false;
  heading.focus();
}

back.addEventListener('click', () => {
  const previous = activeChapter;
  activeChapter = undefined;
  book.dataset.state = 'index';
  index.hidden = false;
  cutouts.get(previous.id).focus();
  chapter.hidden = true;
  tabs.hidden = true;
});

let scene;
try {
  scene = createBookScene(document.querySelector('#book-canvas'));
} catch (error) {
  console.warn('El visor 3D no está disponible.', error);
  book.classList.add('book--flat');
}

let frame;
function finishOpening() {
  cancelAnimationFrame(frame);
  scene?.draw(1);
  const moveFocus = document.activeElement === skip;
  book.dataset.state = 'index';
  book.setAttribute('aria-busy', 'false');
  spread.hidden = false;
  if (moveFocus) cutouts.values().next().value.focus();
  skip.hidden = true;
}

skip.addEventListener('click', finishOpening);
if (!scene || reducedMotion.matches) {
  finishOpening();
} else {
  let start;
  function animate(time) {
    start ??= time;
    const progress = Math.min((time - start) / opening.duration, 1);
    if (progress === 1 || reducedMotion.matches) {
      finishOpening();
      return;
    }
    scene.draw(progress);
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
}
