import { createComponent } from 'liteforge';
import { For } from 'liteforge';
import { dashboardStore, type ServerMetrics } from '../store/dashboard.js';
import { getActiveRouter } from '@liteforge/router';

const SERVER_COLORS: Record<string, string> = {
  s1: '#00C49A', s2: '#60a5fa', s3: '#f59e0b', s4: '#a78bfa', s5: '#f472b6',
};

function statusBadge(status: ServerMetrics['status']): string {
  switch (status) {
    case 'healthy':  return 'bg-[#00C49A]/15 text-[#00C49A] border-[#00C49A]/30';
    case 'degraded': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'critical': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'offline':  return 'bg-[#333]/50 text-[#666] border-[#333]';
  }
}

export const Servers = createComponent({
  name: 'Servers',
  component() {
    function navTo(id: string) {
      getActiveRouter()?.navigate(`/servers/${id}`);
    }

    return (
      <div class="pt-12 min-h-screen bg-[#0d0d0d]">
        <div class="p-4 space-y-3">
          <div class="text-[11px] font-mono uppercase tracking-wider text-[#444] mb-2">
            All Servers
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {For({
              each: () => dashboardStore.servers(),
              children: (s) => (
                <div
                  onclick={() => navTo(s.id)}
                  class="bg-[#161616] border border-[#1e1e1e] rounded-lg p-4 hover:border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="w-2.5 h-2.5 rounded-full shrink-0"
                        style={`background: ${SERVER_COLORS[s.id] ?? '#666'}`}
                      />
                      <span class="font-mono font-medium text-sm text-white">{s.name}</span>
                    </div>
                    <span class={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-mono ${statusBadge(s.status)}`}>
                      {s.status}
                    </span>
                  </div>

                  <div class="grid grid-cols-3 gap-2 text-xs font-mono mb-3">
                    <div>
                      <div class="text-[10px] text-[#444] mb-0.5">CPU</div>
                      <div style={`color: ${s.cpu >= 80 ? '#ef4444' : s.cpu >= 60 ? '#f59e0b' : '#00C49A'}`} class="font-bold">
                        {s.cpu.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] text-[#444] mb-0.5">RAM</div>
                      <div style={`color: ${s.ram >= 85 ? '#ef4444' : s.ram >= 70 ? '#f59e0b' : '#60a5fa'}`} class="font-bold">
                        {s.ram.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div class="text-[10px] text-[#444] mb-0.5">Req/s</div>
                      <div class="font-bold text-[#a78bfa]">{s.requests.toFixed(0)}</div>
                    </div>
                  </div>

                  {/* Mini sparkline */}
                  <div class="mt-1 h-6">
                    {() => {
                      const svgNS = 'http://www.w3.org/2000/svg';
                      const svg = document.createElementNS(svgNS, 'svg');
                      svg.setAttribute('viewBox', '0 0 120 24');
                      svg.style.width = '100%';
                      svg.style.height = '24px';
                      svg.setAttribute('preserveAspectRatio', 'none');
                      const vals = s.cpuHistory;
                      if (vals.length >= 2) {
                        const pts = vals.map((v, i) => {
                          const x = (i / (vals.length - 1)) * 120;
                          const y = 24 - (v / 100) * 22;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        }).join(' ');
                        const poly = document.createElementNS(svgNS, 'polyline');
                        poly.setAttribute('points', pts);
                        poly.setAttribute('fill', 'none');
                        poly.setAttribute('stroke', SERVER_COLORS[s.id] ?? '#00C49A');
                        poly.setAttribute('stroke-width', '1.5');
                        poly.setAttribute('stroke-linejoin', 'round');
                        poly.setAttribute('stroke-linecap', 'round');
                        svg.appendChild(poly);
                      }
                      return svg;
                    }}
                  </div>

                  <div class="mt-2 text-[10px] font-mono text-[#444]">{s.region} · {s.id}</div>
                </div>
              ),
            })}
          </div>
        </div>
      </div>
    );
  },
});
