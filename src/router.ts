import type { RouteDefinition } from '@liteforge/router';
import { Overview } from './pages/Overview.js';

export const routes: RouteDefinition[] = [
  // redirect / to /overview
  { path: '/', component: Overview, meta: { title: 'Overview — LiteForge Dashboard' } },
  { path: '/overview', component: Overview, meta: { title: 'Overview — LiteForge Dashboard' } },
  {
    path: '/servers',
    component: () => import('./pages/Servers.js'),
    export: 'Servers',
    meta: { title: 'Servers — LiteForge Dashboard' },
  },
  {
    path: '/servers/:id',
    component: () => import('./pages/ServerDetail.js'),
    export: 'ServerDetail',
    meta: { title: 'Server Detail — LiteForge Dashboard' },
  },
  {
    path: '/logs',
    component: () => import('./pages/Logs.js'),
    export: 'Logs',
    meta: { title: 'Logs — LiteForge Dashboard' },
  },
  // catch-all
  { path: '*', component: Overview },
];
