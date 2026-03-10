import { createComponent } from 'liteforge';
import { RouterOutlet } from 'liteforge/router';
import { Topbar } from './components/Topbar.js';
import { ToastProvider } from '@liteforge/toast';

// Mount toast portal outside component tree
const toastRoot = ToastProvider({ position: 'bottom-right' });
document.body.appendChild(toastRoot);

export const App = createComponent({
  name: 'App',
  component() {
    return (
      <div class="min-h-screen bg-[#0d0d0d]">
        {Topbar({})}
        {RouterOutlet()}
      </div>
    );
  },
});
