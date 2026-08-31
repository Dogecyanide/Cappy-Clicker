import './styles/main.css';
import './styles/components.css';
import './styles/animations.css';
import { createGame } from './ui/app.js';

const root = document.querySelector('#app');

try {
  const game = createGame(root);
  game.start();
  globalThis.cappyClicker = game;
} catch (error) {
  console.error('Cappy Clicker failed to start', error);
  root.innerHTML = `<main class="fatal-error"><h1>The Odyssey hit turbulence.</h1><p>Cappy Clicker could not start. Reload the page, or reset site data if this keeps happening.</p></main>`;
}

