import { createApp } from '@liteforge/runtime';
import { createBrowserHistory, createRouter } from '@liteforge/router';
import { App } from './App.js';
import { routes } from './router.js';
import { simulation } from './services/simulation.js';
import { toastPlugin } from '@liteforge/toast'
import './styles.css';

const history = createBrowserHistory();
const router = createRouter({
  routes,
  history,
  titleTemplate: t => t ?? 'LiteForge Dashboard',
});

await createApp({ 
  root: App, 
  target: '#app', 
  router 
}).use(toastPlugin({ position: 'bottom-right' })).mount();

// Start simulation after app mounts
simulation.start();
