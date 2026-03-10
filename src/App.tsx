import { createComponent } from 'liteforge';
import { RouterOutlet } from '@liteforge/router';
import { Topbar } from './components/Topbar.js';

export const App = createComponent({
  name: 'App',
  component() {
    return (
      <div class="min-h-screen p-4">
        {Topbar()}
        {RouterOutlet()}
      </div>
    );
  },
});
