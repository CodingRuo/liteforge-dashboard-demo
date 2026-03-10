import { createComponent } from 'liteforge';
import { For } from 'liteforge';
import { NavLink } from '@liteforge/router';
import { dashboardStore } from '../store/dashboard.js';
import { simulation } from '../services/simulation.js';

const NAV_ITEMS = [
  { label: 'Overview', href: '/overview' },
  { label: 'Servers',  href: '/servers' },
  { label: 'Logs',     href: '/logs' },
] as const;

const INTERVALS = [
  { value: 1000 as const, label: '1s' },
  { value: 500  as const, label: '500ms' },
  { value: 250  as const, label: '250ms' },
];

export const Topbar = createComponent({
  name: 'Topbar',
  component() {
    const { simulating, interval } = dashboardStore;

    function toggleSim() {
      const next = !simulating();
      dashboardStore.setSimulating(next);
      if (next) simulation.start();
    }

    function setIntervalVal(v: 1000 | 500 | 250) {
      dashboardStore.setInterval(v);
    }

    return (
      <header class="fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 border-b border-[#1e1e1e] bg-[#0d0d0d]/95 backdrop-blur-sm">
        {/* Left: wordmark */}
        <div class="flex items-center gap-3">
          <span class="text-sm font-bold tracking-tight text-white">LiteForge</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#666] border border-[#2a2a2a]">
            dashboard demo
          </span>
        </div>

        {/* Center: nav */}
        <nav class="flex items-center gap-1">
          {For({
            each: NAV_ITEMS,
            children: (item) => NavLink({
              href: item.href,
              class: 'px-3 py-1.5 text-xs font-medium rounded text-[#888] hover:text-white hover:bg-[#1e1e1e] transition-colors',
              activeClass: 'text-white bg-[#1e1e1e]',
              children: item.label,
            }),
          })}
        </nav>

        {/* Right: live indicator + controls */}
        <div class="flex items-center gap-3">
          {/* Live/Paused indicator */}
          <div class="flex items-center gap-1.5">
            <span class={() => `w-2 h-2 rounded-full ${simulating() ? 'bg-[#00C49A] pulse-dot' : 'bg-[#555]'}`} />
            <span class="text-xs font-mono text-[#888]">
              {() => simulating() ? 'Live' : 'Paused'}
            </span>
          </div>

          {/* Interval selector */}
          <div class="flex items-center gap-0.5 text-xs font-mono">
            {For({
              each: INTERVALS,
              children: (item) => {
                const v = item.value;
                return (
                  <button
                    onclick={() => setIntervalVal(v)}
                    class={() =>
                      `px-2 py-1 rounded border transition-colors ${
                        interval() === v
                          ? 'bg-[#1e1e1e] border-[#333] text-white'
                          : 'border-transparent text-[#666] hover:text-[#999]'
                      }`
                    }
                  >
                    {item.label}
                  </button>
                );
              },
            })}
          </div>

          {/* Play/Pause button */}
          <button
            onclick={toggleSim}
            class={() =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                simulating()
                  ? 'border-[#333] text-[#888] hover:text-white hover:border-[#555]'
                  : 'border-[#00C49A]/40 text-[#00C49A] hover:bg-[#00C49A]/10'
              }`
            }
          >
            <span>{() => simulating() ? '⏸' : '▶'}</span>
            <span>{() => simulating() ? 'Pause' : 'Simulate'}</span>
          </button>
        </div>
      </header>
    );
  },
});
