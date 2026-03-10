import { createComponent } from 'liteforge';
import { For } from 'liteforge';
import { Link } from '@liteforge/router';
import { dashboardStore, type ServerMetrics } from '../store/dashboard.js';
import { LineChart } from '../components/LineChart.js';
import { AreaChart } from '../components/AreaChart.js';

const SERVER_COLORS = ['#00C49A', '#60a5fa', '#f59e0b', '#a78bfa', '#f472b6'];

const TABLE_COLS = [
  'Server', 'Status', 'CPU %', 'RAM %', 'Req/s', 'Err %', 'RT ms', 'Uptime', 'Region',
];

function statusBadge(status: ServerMetrics['status']): string {
  switch (status) {
    case 'healthy':  return 'bg-[#00C49A]/15 text-[#00C49A] border-[#00C49A]/30';
    case 'degraded': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'critical': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'offline':  return 'bg-[#333]/50 text-[#666] border-[#333]';
  }
}

function cpuColor(cpu: number): string {
  if (cpu >= 80) return 'text-red-400';
  if (cpu >= 60) return 'text-yellow-400';
  return 'text-[#00C49A]';
}

function ramColor(ram: number): string {
  if (ram >= 85) return 'text-red-400';
  if (ram >= 70) return 'text-yellow-400';
  return 'text-[#60a5fa]';
}

function errColor(err: number): string {
  if (err >= 3) return 'text-red-400';
  if (err >= 1) return 'text-yellow-400';
  return 'text-[#00C49A]';
}

function rtColor(rt: number): string {
  if (rt >= 300) return 'text-red-400';
  if (rt >= 200) return 'text-yellow-400';
  return 'text-[#00C49A]';
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export const Overview = createComponent({
  name: 'Overview',
  component() {
    return (
      <div class="pt-12 min-h-screen bg-[#0d0d0d]">
        <div class="p-4 space-y-4">

          {/* KPI Cards */}
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-2">Requests / sec</div>
              <div class={() => `text-2xl font-mono font-bold ${
                dashboardStore.globalRequests() > 800 ? 'text-red-400' :
                dashboardStore.globalRequests() > 400 ? 'text-yellow-400' : 'text-[#00C49A]'
              }`}>
                {() => dashboardStore.globalRequests().toLocaleString()}
              </div>
              <div class="text-[10px] text-[#444] mt-1 font-mono">total across all servers</div>
            </div>

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-2">Error Rate</div>
              <div class={() => `text-2xl font-mono font-bold ${
                dashboardStore.globalErrorRate() > 3 ? 'text-red-400' :
                dashboardStore.globalErrorRate() > 1 ? 'text-yellow-400' : 'text-[#00C49A]'
              }`}>
                {() => dashboardStore.globalErrorRate().toFixed(2)}%
              </div>
              <div class="text-[10px] text-[#444] mt-1 font-mono">avg across all servers</div>
            </div>

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-2">Avg Response Time</div>
              <div class={() => `text-2xl font-mono font-bold ${
                dashboardStore.globalResponseTime() > 300 ? 'text-red-400' :
                dashboardStore.globalResponseTime() > 200 ? 'text-yellow-400' : 'text-[#00C49A]'
              }`}>
                {() => dashboardStore.globalResponseTime().toFixed(0)}ms
              </div>
              <div class="text-[10px] text-[#444] mt-1 font-mono">p50 latency</div>
            </div>

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-2">Active Connections</div>
              <div class="text-2xl font-mono font-bold text-[#a78bfa]">
                {() => dashboardStore.globalConnections()}
              </div>
              <div class="text-[10px] text-[#444] mt-1 font-mono">open TCP connections</div>
            </div>
          </div>

          {/* Charts row */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[11px] font-mono uppercase tracking-wider text-[#555] mb-3">
                CPU Usage — last 60 ticks
              </div>
              <LineChart
                data={() => dashboardStore.servers().map(s => s.cpuHistory)}
                colors={SERVER_COLORS}
                labels={dashboardStore.servers().map(s => s.name)}
                yMax={100}
                height={120}
              />
            </div>

            <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4">
              <div class="text-[11px] font-mono uppercase tracking-wider text-[#555] mb-3">
                RAM Usage — last 60 ticks
              </div>
              <AreaChart
                data={() => dashboardStore.servers().map(s => s.ramHistory)}
                colors={SERVER_COLORS}
                labels={dashboardStore.servers().map(s => `${s.name} (${s.ramTotal}GB)`)}
                yMax={100}
                height={120}
              />
            </div>
          </div>

          {/* Server Table */}
          <div class="bg-[#161616] border border-[#1e1e1e] rounded-lg overflow-hidden">
            <div class="px-4 py-3 border-b border-[#1e1e1e]">
              <span class="text-[11px] font-mono uppercase tracking-wider text-[#555]">Servers</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-xs font-mono">
                <thead>
                  <tr class="border-b border-[#1e1e1e]">
                    {For({
                      each: TABLE_COLS,
                      children: (col) => (
                        <th class="text-left px-4 py-2 text-[#444] font-normal">{col}</th>
                      ),
                    })}
                  </tr>
                </thead>
                <tbody>
                  {For({
                    each: () => dashboardStore.servers(),
                    children: (s) => (
                      <tr class="border-b border-[#111] hover:bg-[#1a1a1a] transition-colors cursor-pointer">
                        <td class="px-4 py-3">
                          {Link({
                            href: `/servers/${s.id}`,
                            class: 'text-white hover:text-[#00C49A] transition-colors',
                            children: s.name,
                          })}
                        </td>
                        <td class="px-4 py-3">
                          <span class={`inline-flex px-2 py-0.5 rounded-full border text-[10px] ${statusBadge(s.status)}`}>
                            {s.status}
                          </span>
                        </td>
                        <td class={`px-4 py-3 ${cpuColor(s.cpu)}`}>{s.cpu.toFixed(1)}</td>
                        <td class={`px-4 py-3 ${ramColor(s.ram)}`}>{s.ram.toFixed(1)}</td>
                        <td class="px-4 py-3 text-[#888]">{s.requests.toFixed(0)}</td>
                        <td class={`px-4 py-3 ${errColor(s.errorRate)}`}>{s.errorRate.toFixed(2)}</td>
                        <td class={`px-4 py-3 ${rtColor(s.responseTime)}`}>{s.responseTime.toFixed(0)}</td>
                        <td class="px-4 py-3 text-[#555]">{formatUptime(s.uptime)}</td>
                        <td class="px-4 py-3 text-[#555]">{s.region}</td>
                      </tr>
                    ),
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  },
});
