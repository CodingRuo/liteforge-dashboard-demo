import { toast } from '@liteforge/toast';
import { dashboardStore, type ServerMetrics, type LogEntry } from '../store/dashboard.js';

// Base load profiles per server
const BASE_LOAD: Record<string, { cpu: number; ram: number; req: number; err: number; rt: number }> = {
  s1: { cpu: 22, ram: 45, req: 120, err: 0.2, rt: 85 },
  s2: { cpu: 18, ram: 41, req: 98,  err: 0.1, rt: 92 },
  s3: { cpu: 35, ram: 72, req: 45,  err: 0.0, rt: 12 },
  s4: { cpu: 28, ram: 65, req: 30,  err: 0.0, rt: 18 },
  s5: { cpu: 12, ram: 28, req: 510, err: 0.3, rt: 28 },
};

type IncidentType = 'cpu-spike' | 'memory-leak' | 'request-storm' | 'degraded';

interface Incident {
  serverId: string;
  type: IncidentType;
  endsAt: number;
  ramAccum?: number;
}

const LOG_MESSAGES: Record<string, string[]> = {
  s1: [
    'Request handled in {rt}ms',
    'Cache hit ratio: {ratio}%',
    'DB query executed in {db}ms',
    'Session created for user #{uid}',
    'Healthcheck OK',
  ],
  s2: [
    'Request handled in {rt}ms',
    'Rate limiter: {req} req/s',
    'JWT verified successfully',
    'Response cached (TTL 60s)',
    'Healthcheck OK',
  ],
  s3: [
    'Query executed: SELECT * FROM users ({db}ms)',
    'Index scan on orders ({db}ms)',
    'Transaction committed',
    'Replication lag: {lag}ms',
    'WAL checkpoint completed',
  ],
  s4: [
    'Replica sync lag: {lag}ms',
    'Read query forwarded ({db}ms)',
    'Replica in sync with primary',
    'Streaming replication active',
    'Healthcheck OK',
  ],
  s5: [
    'Cache HIT for /static/{hash}.js',
    'Cache MISS — origin fetch {rt}ms',
    'CDN edge serving {req} req/s',
    'TLS handshake 1.3 ({rt}ms)',
    'Purge complete for {hash}',
  ],
};

const WARN_MESSAGES = [
  'High CPU detected: {cpu}%',
  'Memory pressure: {ram}% used',
  'Response time degraded: {rt}ms',
  'Connection pool near limit',
  'Slow query detected ({db}ms)',
];

const ERROR_MESSAGES = [
  'Connection timeout after {rt}ms',
  'Failed to connect to database',
  'Out of memory — process restarted',
  'HTTP 502 from upstream',
  'Disk I/O error on /var/data',
];

let logIdCounter = 0;

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 1): number {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pushHistory(arr: number[], val: number, maxLen = 60): number[] {
  const next = [...arr, val];
  return next.length > maxLen ? next.slice(next.length - maxLen) : next;
}

function formatMsg(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? k));
}

function statusFromCpu(cpu: number, err: number): ServerMetrics['status'] {
  if (cpu >= 90 || err >= 5) return 'critical';
  if (cpu >= 70 || err >= 2) return 'degraded';
  return 'healthy';
}

export class SimulationService {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private incidents: Incident[] = [];
  private prevStatus: Record<string, ServerMetrics['status']> = {};
  private tick = 0;
  private uptimeSeconds = 0;

  start(): void {
    if (this.timerId !== null) return;
    this.schedule();
  }

  stop(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private schedule(): void {
    const interval = dashboardStore.interval();
    this.timerId = setTimeout(() => {
      if (dashboardStore.simulating()) {
        this.step();
      }
      this.schedule();
    }, interval);
  }

  private step(): void {
    this.tick++;
    this.uptimeSeconds++;

    const now = Date.now();

    // Occasionally spawn an incident (~every 45 ticks)
    if (this.tick % 45 === 0 && Math.random() < 0.7) {
      this.spawnIncident(now);
    }

    // Remove expired incidents
    this.incidents = this.incidents.filter(i => i.endsAt > now);

    const servers = dashboardStore.servers();
    let totalReq = 0;
    let totalErr = 0;
    let totalRt = 0;

    for (const server of servers) {
      const base = BASE_LOAD[server.id];
      if (!base) continue;

      const incident = this.incidents.find(i => i.serverId === server.id);

      let cpu = base.cpu + randFloat(-5, 5);
      let ram = base.ram + randFloat(-2, 2);
      let req = base.req + randFloat(-15, 15);
      let err = base.err + randFloat(-0.05, 0.05);
      let rt  = base.rt  + randFloat(-8, 8);

      if (incident) {
        switch (incident.type) {
          case 'cpu-spike':
            cpu = lerp(cpu, 92 + randFloat(-3, 3), 0.7);
            rt  = lerp(rt, rt * 3, 0.5);
            err = lerp(err, 1.5, 0.5);
            break;
          case 'memory-leak': {
            incident.ramAccum = (incident.ramAccum ?? 0) + randFloat(0.3, 0.8);
            ram = Math.min(98, base.ram + (incident.ramAccum ?? 0));
            break;
          }
          case 'request-storm':
            req = lerp(req, base.req * 5, 0.6);
            cpu = lerp(cpu, cpu * 1.8, 0.5);
            rt  = lerp(rt, rt * 2.5, 0.6);
            err = lerp(err, 3.5, 0.4);
            break;
          case 'degraded':
            cpu = lerp(cpu, 70 + randFloat(-5, 5), 0.6);
            rt  = lerp(rt, rt * 2, 0.5);
            err = lerp(err, 2.5, 0.4);
            break;
        }
      }

      cpu = clamp(cpu, 2, 100);
      ram = clamp(ram, 5, 99);
      req = clamp(req, 0, 2000);
      err = clamp(err, 0, 100);
      rt  = clamp(rt,  1, 5000);

      const newStatus = statusFromCpu(cpu, err);

      const patch: Partial<ServerMetrics> = {
        cpu:          parseFloat(cpu.toFixed(1)),
        ram:          parseFloat(ram.toFixed(1)),
        requests:     parseFloat(req.toFixed(0)) as unknown as number,
        errorRate:    parseFloat(err.toFixed(2)),
        responseTime: parseFloat(rt.toFixed(0)) as unknown as number,
        status:       newStatus,
        uptime:       this.uptimeSeconds,
        cpuHistory:   pushHistory(server.cpuHistory, parseFloat(cpu.toFixed(1))),
        ramHistory:   pushHistory(server.ramHistory, parseFloat(ram.toFixed(1))),
        reqHistory:   pushHistory(server.reqHistory, parseFloat(req.toFixed(0))),
      };

      dashboardStore.updateServer(server.id, patch);

      // Status change toasts
      const prev = this.prevStatus[server.id];
      if (prev && prev !== newStatus) {
        if (newStatus === 'critical') {
          toast.error(`🚨 ${server.name} critical: CPU ${cpu.toFixed(0)}%`);
        } else if (newStatus === 'degraded') {
          toast.warning(`⚠️ ${server.name} degraded: high load`);
        } else if (newStatus === 'healthy' && (prev === 'critical' || prev === 'degraded')) {
          toast.success(`✅ ${server.name} recovered`);
        }
      }
      this.prevStatus[server.id] = newStatus;

      totalReq += req;
      totalErr += err;
      totalRt  += rt;

      // Log entries
      if (this.tick % 3 === 0 || Math.random() < 0.15) {
        this.emitLog(server.id, server.name, cpu, ram, req, err, rt, now);
      }
    }

    const count = servers.length || 1;
    dashboardStore.setGlobals(
      parseFloat(totalReq.toFixed(0)),
      parseFloat((totalErr / count).toFixed(2)),
      parseFloat((totalRt / count).toFixed(0)),
      randInt(80, 350),
    );
  }

  private spawnIncident(now: number): void {
    const types: IncidentType[] = ['cpu-spike', 'memory-leak', 'request-storm', 'degraded'];
    const servers = dashboardStore.servers();
    const server = servers[randInt(0, servers.length - 1)];
    if (!server) return;
    // Don't stack incidents on same server
    if (this.incidents.some(i => i.serverId === server.id)) return;

    const type = types[randInt(0, types.length - 1)] as IncidentType;
    const durations: Record<IncidentType, number> = {
      'cpu-spike':      randInt(20, 60) * 1000,
      'memory-leak':    randInt(30, 90) * 1000,
      'request-storm':  randInt(15, 45) * 1000,
      'degraded':       randInt(25, 70) * 1000,
    };

    this.incidents.push({
      serverId: server.id,
      type,
      endsAt: now + durations[type],
      ramAccum: 0,
    });
  }

  private emitLog(
    serverId: string,
    serverName: string,
    cpu: number,
    _ram: number,
    req: number,
    err: number,
    rt: number,
    now: number,
  ): void {
    const vars = {
      cpu:   cpu.toFixed(0),
      rt:    rt.toFixed(0),
      req:   req.toFixed(0),
      db:    randInt(2, 50),
      lag:   randInt(1, 30),
      uid:   randInt(1000, 9999),
      ratio: randInt(70, 99),
      hash:  Math.random().toString(36).slice(2, 8),
    };

    let level: LogEntry['level'] = 'INFO';
    let msgs: string[] = LOG_MESSAGES[serverId] ?? LOG_MESSAGES['s1'] ?? [];

    if (err > 3 || Math.random() < 0.04) {
      level = 'ERROR';
      msgs = ERROR_MESSAGES;
    } else if (cpu > 65 || err > 1.5 || Math.random() < 0.08) {
      level = 'WARN';
      msgs = WARN_MESSAGES;
    }

    const idx = randInt(0, msgs.length - 1);
    const template: string | undefined = msgs[idx];
    if (!template) return;

    dashboardStore.addLog({
      id:        `log-${++logIdCounter}`,
      timestamp: now,
      level,
      server:    serverName,
      message:   formatMsg(template, vars),
    });
  }
}

export const simulation = new SimulationService();
