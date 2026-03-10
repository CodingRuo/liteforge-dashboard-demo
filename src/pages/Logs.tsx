import { createComponent, signal, computed } from 'liteforge';
import { For, Show } from 'liteforge';
import { dashboardStore, type LogEntry } from '../store/dashboard.js';

type Filter = 'ALL' | 'WARN' | 'ERROR';

const FILTER_OPTS: { value: Filter; label: string }[] = [
  { value: 'ALL',   label: 'ALL' },
  { value: 'WARN',  label: 'WARN' },
  { value: 'ERROR', label: 'ERROR' },
];

function levelColor(level: LogEntry['level']): string {
  switch (level) {
    case 'ERROR': return 'text-red-400';
    case 'WARN':  return 'text-yellow-400';
    case 'INFO':  return 'text-[#444]';
  }
}

function levelBg(level: LogEntry['level']): string {
  switch (level) {
    case 'ERROR': return 'bg-red-500/10';
    case 'WARN':  return 'bg-yellow-500/10';
    case 'INFO':  return '';
  }
}

function msgColor(level: LogEntry['level']): string {
  switch (level) {
    case 'ERROR': return 'text-red-300';
    case 'WARN':  return 'text-yellow-200/80';
    case 'INFO':  return 'text-[#666]';
  }
}

export const Logs = createComponent({
  name: 'Logs',
  component() {
    const filter = signal<Filter>('ALL');
    const autoScroll = signal(true);

    const filteredEntries = computed(() =>
      filter() === 'ALL'
        ? dashboardStore.logs()
        : dashboardStore.logs().filter(l => l.level === filter())
    );

    return (
      <div class="pt-12 min-h-screen bg-[#0d0d0d]">
        <div class="p-4 space-y-3">

          {/* Controls */}
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1">
              {For({
                each: FILTER_OPTS,
                children: (opt) => (
                  <button
                    onclick={() => filter.set(opt.value)}
                    class={() => `px-3 py-1.5 text-xs font-mono rounded border transition-colors ${
                      filter() === opt.value
                        ? opt.value === 'ERROR' ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : opt.value === 'WARN'  ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                        : 'bg-[#1e1e1e] border-[#333] text-white'
                        : 'border-transparent text-[#555] hover:text-[#888]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ),
              })}
            </div>

            <div class="flex items-center gap-3">
              <div class="text-xs font-mono text-[#444]">
                {() => `${filteredEntries().length} / ${dashboardStore.logs().length} entries`}
              </div>
              <button
                onclick={() => autoScroll.update(v => !v)}
                class={() => `text-xs font-mono px-2 py-1 rounded border transition-colors ${
                  autoScroll()
                    ? 'border-[#00C49A]/30 text-[#00C49A] bg-[#00C49A]/10'
                    : 'border-[#333] text-[#555]'
                }`}
              >
                {() => autoScroll() ? '↑ auto-scroll' : '↑ scroll off'}
              </button>
            </div>
          </div>

          {/* Log stream */}
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
            <div class="h-[calc(100vh-12rem)] overflow-y-auto font-mono text-xs">
              {Show({
                when: () => filteredEntries().length === 0,
                children: () => (
                  <div class="flex items-center justify-center h-full text-[#444]">
                    Waiting for log entries…
                  </div>
                ),
                fallback: () => For({
                  each: filteredEntries,
                  children: (l) => (
                    <div class={`flex items-start gap-3 px-4 py-1.5 border-b border-[#111] ${levelBg(l.level)}`}>
                      <span class="text-[#333] shrink-0 tabular-nums">
                        {new Date(l.timestamp).toLocaleTimeString('en-US', {
                          hour12: false,
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                      <span class={`w-10 shrink-0 font-bold ${levelColor(l.level)}`}>
                        {l.level}
                      </span>
                      <span class="text-[#555] shrink-0 w-20 truncate">{l.server}</span>
                      <span class={msgColor(l.level)}>{l.message}</span>
                    </div>
                  ),
                }),
              })}
            </div>
          </div>

        </div>
      </div>
    );
  },
});
