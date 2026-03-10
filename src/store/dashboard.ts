import { defineStore } from '@liteforge/store';

export interface ServerMetrics {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  cpu: number;
  ram: number;
  ramTotal: number;
  requests: number;
  errorRate: number;
  responseTime: number;
  uptime: number;
  cpuHistory: number[];
  ramHistory: number[];
  reqHistory: number[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  server: string;
  message: string;
}

const INITIAL_SERVERS: ServerMetrics[] = [
  { id: 's1', name: 'app-01',     region: 'EU-West',   status: 'healthy', cpu: 22, ram: 45, ramTotal: 16, requests: 120, errorRate: 0.2, responseTime: 85,  uptime: 0, cpuHistory: [], ramHistory: [], reqHistory: [] },
  { id: 's2', name: 'app-02',     region: 'EU-West',   status: 'healthy', cpu: 18, ram: 41, ramTotal: 16, requests: 98,  errorRate: 0.1, responseTime: 92,  uptime: 0, cpuHistory: [], ramHistory: [], reqHistory: [] },
  { id: 's3', name: 'db-primary', region: 'EU-West',   status: 'healthy', cpu: 35, ram: 72, ramTotal: 64, requests: 45,  errorRate: 0.0, responseTime: 12,  uptime: 0, cpuHistory: [], ramHistory: [], reqHistory: [] },
  { id: 's4', name: 'db-replica', region: 'US-East',   status: 'healthy', cpu: 28, ram: 65, ramTotal: 64, requests: 30,  errorRate: 0.0, responseTime: 18,  uptime: 0, cpuHistory: [], ramHistory: [], reqHistory: [] },
  { id: 's5', name: 'cdn-edge',   region: 'AP-South',  status: 'healthy', cpu: 12, ram: 28, ramTotal: 8,  requests: 510, errorRate: 0.3, responseTime: 28,  uptime: 0, cpuHistory: [], ramHistory: [], reqHistory: [] },
];

export const dashboardStore = defineStore('dashboard', {
  state: {
    servers:             INITIAL_SERVERS as ServerMetrics[],
    logs:                [] as LogEntry[],
    simulating:          true,
    interval:            1000 as 1000 | 500 | 250,
    globalRequests:      0,
    globalErrorRate:     0,
    globalResponseTime:  0,
    globalConnections:   0,
  },
  getters: state => ({
    serverById: () => (id: string) =>
      state.servers().find(s => s.id === id),
  }),
  actions: state => ({
    updateServer(id: string, patch: Partial<ServerMetrics>) {
      state.servers.update(list =>
        list.map(s => s.id === id ? { ...s, ...patch } : s)
      );
    },
    addLog(entry: LogEntry) {
      state.logs.update(list => {
        const next = [entry, ...list];
        return next.length > 200 ? next.slice(0, 200) : next;
      });
    },
    setSimulating(v: boolean) {
      state.simulating.set(v);
    },
    setInterval(v: 1000 | 500 | 250) {
      state.interval.set(v);
    },
    setGlobals(req: number, err: number, rt: number, conn: number) {
      state.globalRequests.set(req);
      state.globalErrorRate.set(err);
      state.globalResponseTime.set(rt);
      state.globalConnections.set(conn);
    },
  }),
});
