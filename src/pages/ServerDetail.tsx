import { createComponent } from 'liteforge';
import { For, Show } from 'liteforge';
import { Link, useParam } from '@liteforge/router';
import { dashboardStore } from '../store/dashboard.js';
import { LineChart } from '../components/LineChart.js';
import { AreaChart } from '../components/AreaChart.js';

const PROCESSES = [
  { name: 'nginx',    pid: 1024, cpu: () => Math.random() * 5 + 1,  mem: () => Math.random() * 3 + 0.5 },
  { name: 'node',     pid: 1031, cpu: () => Math.random() * 20 + 5, mem: () => Math.random() * 8 + 2 },
  { name: 'postgres', pid: 1148, cpu: () => Math.random() * 10 + 2, mem: () => Math.random() * 15 + 5 },
  { name: 'redis',    pid: 1201, cpu: () => Math.random() * 3 + 0.3,mem: () => Math.random() * 2 + 0.5 },
  { name: 'sshd',     pid: 888,  cpu: () => Math.random() * 0.5,    mem: () => Math.random() * 0.3 },
];

const PROC_COLS = ['PID', 'Name', 'CPU %', 'MEM %'];

function statusColor(status: string): string {
  if (status === 'critical') return 'text-red-400';
  if (status === 'degraded') return 'text-yellow-400';
  return 'text-[#00C49A]';
}

function cpuColor(cpu: number): string {
  if (cpu >= 80) return 'text-red-400';
  if (cpu >= 60) return 'text-yellow-400';
  return 'text-[#00C49A]';
}

export const ServerDetail = createComponent({
  name: 'ServerDetail',
  component() {
    const id = useParam('id');

    return (
      <div class="pt-12 min-h-screen bg-[#0d0d0d]">
        <div class="p-4 space-y-4">

          {/* Back + header */}
          <div class="flex items-center gap-4">
            {Link({ href: '/overview', class: 'text-xs font-mono text-[#555] hover:text-white transition-colors', children: '← Back to Overview' })}
          </div>

          {() => {
            const server = dashboardStore.serverById()(id() ?? '');
            if (!server) {
              return (
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-8 text-center">
                  <p class="text-[#555] font-mono text-sm">Server not found: {id()}</p>
                </div>
              );
            }

            return (
              <div class="space-y-4">
                {/* Header */}
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h1 class="text-lg font-bold font-mono text-white">{server.name}</h1>
                    <p class="text-xs font-mono text-[#555] mt-0.5">{server.region} · {server.id}</p>
                  </div>
                  <div class="text-right">
                    <div class={`text-sm font-mono font-medium ${statusColor(server.status)}`}>
                      {server.status}
                    </div>
                    <div class="text-xs font-mono text-[#444] mt-0.5">
                      RAM: {server.ramTotal}GB total
                    </div>
                  </div>
                </div>

                {/* Stat cards */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-3">
                    <div class="text-[10px] font-mono text-[#444] uppercase mb-1">CPU</div>
                    <div class={`text-xl font-mono font-bold ${cpuColor(server.cpu)}`}>
                      {server.cpu.toFixed(1)}%
                    </div>
                  </div>
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-3">
                    <div class="text-[10px] font-mono text-[#444] uppercase mb-1">RAM</div>
                    <div class="text-xl font-mono font-bold text-[#60a5fa]">
                      {server.ram.toFixed(1)}%
                    </div>
                  </div>
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-3">
                    <div class="text-[10px] font-mono text-[#444] uppercase mb-1">Req/s</div>
                    <div class="text-xl font-mono font-bold text-[#a78bfa]">
                      {server.requests.toFixed(0)}
                    </div>
                  </div>
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-3">
                    <div class="text-[10px] font-mono text-[#444] uppercase mb-1">Error Rate</div>
                    <div class={() => `text-xl font-mono font-bold ${
                      server.errorRate > 3 ? 'text-red-400' :
                      server.errorRate > 1 ? 'text-yellow-400' : 'text-[#00C49A]'
                    }`}>
                      {server.errorRate.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Charts */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
                    <div class="text-[11px] font-mono uppercase tracking-wider text-[#555] mb-3">
                      CPU — last 60 ticks
                    </div>
                    <LineChart
                      data={() => [server.cpuHistory]}
                      colors={['#00C49A']}
                      labels={[server.name]}
                      yMax={100}
                      height={120}
                    />
                  </div>
                  <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
                    <div class="text-[11px] font-mono uppercase tracking-wider text-[#555] mb-3">
                      RAM — last 60 ticks
                    </div>
                    <AreaChart
                      data={() => [server.ramHistory]}
                      colors={['#60a5fa']}
                      labels={[`${server.name} (${server.ramTotal}GB)`]}
                      yMax={100}
                      height={120}
                    />
                  </div>
                </div>

                {/* Request rate chart */}
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
                  <div class="text-[11px] font-mono uppercase tracking-wider text-[#555] mb-3">
                    Request Rate — last 60 ticks
                  </div>
                  <LineChart
                    data={() => [server.reqHistory]}
                    colors={['#a78bfa']}
                    labels={['req/s']}
                    yMax={Math.max(100, ...server.reqHistory) * 1.2}
                    height={80}
                  />
                </div>

                {/* Top processes */}
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
                  <div class="px-4 py-3 border-b border-[#1e1e1e]">
                    <span class="text-[11px] font-mono uppercase tracking-wider text-[#555]">
                      Top Processes
                    </span>
                  </div>
                  <table class="w-full text-xs font-mono">
                    <thead>
                      <tr class="border-b border-[#1e1e1e]">
                        {For({
                          each: PROC_COLS,
                          children: (col) => (
                            <th class="text-left px-4 py-2 text-[#444] font-normal">{col}</th>
                          ),
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {For({
                        each: PROCESSES,
                        children: (p) => (
                          <tr class="border-b border-[#111]">
                            <td class="px-4 py-2.5 text-[#444]">{p.pid}</td>
                            <td class="px-4 py-2.5 text-white">{p.name}</td>
                            <td class="px-4 py-2.5 text-[#00C49A]">{() => p.cpu().toFixed(1)}</td>
                            <td class="px-4 py-2.5 text-[#60a5fa]">{() => p.mem().toFixed(1)}</td>
                          </tr>
                        ),
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Alert history (filtered from global logs) */}
                <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
                  <div class="px-4 py-3 border-b border-[#1e1e1e]">
                    <span class="text-[11px] font-mono uppercase tracking-wider text-[#555]">
                      Recent Alerts
                    </span>
                  </div>
                  <div class="divide-y divide-[#111]">
                    {() => {
                      const alerts = dashboardStore.logs()
                        .filter(l => l.server === server.name && l.level !== 'INFO')
                        .slice(0, 10);
                      return Show({
                        when: () => alerts.length === 0,
                        children: () => (
                          <div class="px-4 py-6 text-center text-[#444] text-xs font-mono">No alerts</div>
                        ),
                        fallback: () => For({
                          each: alerts,
                          children: (l) => (
                            <div class="px-4 py-2.5 flex items-start gap-3 font-mono text-xs">
                              <span class={`shrink-0 ${l.level === 'ERROR' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {l.level}
                              </span>
                              <span class="text-[#888] shrink-0">
                                {new Date(l.timestamp).toLocaleTimeString()}
                              </span>
                              <span class="text-[#ccc]">{l.message}</span>
                            </div>
                          ),
                        }),
                      });
                    }}
                  </div>
                </div>
              </div>
            );
          }}

        </div>
      </div>
    );
  },
});
