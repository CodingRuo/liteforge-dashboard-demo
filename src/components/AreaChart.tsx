import { createComponent } from 'liteforge';
import { For } from 'liteforge';

interface AreaChartProps {
  data: () => number[][];
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

const GRID_PCTS = [
  { pct: 0 },
  { pct: 25 },
  { pct: 50 },
  { pct: 75 },
  { pct: 100 },
];

function buildAreaPath(values: number[], width: number, height: number, yMax: number): string {
  if (values.length < 2) return '';
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / yMax) * height;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  const first = pts[0];
  if (!last || !first) return line;
  return `${line} L${last.x.toFixed(1)},${height} L${first.x.toFixed(1)},${height} Z`;
}

function buildLinePath(values: number[], width: number, height: number, yMax: number): string {
  if (values.length < 2) return '';
  return 'M ' + values.map((v, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - (v / yMax) * height;
    return `${idx === 0 ? '' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export const AreaChart = createComponent<AreaChartProps>({
  name: 'AreaChart',
  component({ props }) {
    const W = 560;
    const H = props.height ?? 120;
    const yMax = props.yMax ?? 100;

    const gridLines = GRID_PCTS.map(({ pct }) => ({
      pct,
      y: H - (pct / 100) * H,
      label: Math.round((pct / 100) * yMax),
    }));

    const legendItems = props.labels.map((label, i) => ({
      label,
      color: props.colors[i] ?? '#00C49A',
    }));

    return (
      <div class="w-full">
        <svg
          viewBox={`0 0 ${W} ${H + 20}`}
          class="w-full"
          style={`height: ${H + 20}px`}
          preserveAspectRatio="none"
        >
          {For({
            each: gridLines,
            children: (gl) => (
              <g>
                <line x1="0" y1={gl.y} x2={W} y2={gl.y} stroke="#1e1e1e" stroke-width="1" />
                <text x="4" y={gl.y - 2} font-size="9" fill="#444" font-family="monospace">
                  {gl.label}%
                </text>
              </g>
            ),
          })}

          {() => {
            const series = props.data();
            const seriesItems = series.map((values, i) => ({
              areaPath: buildAreaPath(values, W, H, yMax),
              linePath: buildLinePath(values, W, H, yMax),
              color: props.colors[i] ?? '#00C49A',
            }));
            return For({
              each: seriesItems,
              children: (item) => (
                <g>
                  <path d={item.areaPath} fill={item.color} fill-opacity="0.12" stroke="none" />
                  <path
                    d={item.linePath}
                    fill="none"
                    stroke={item.color}
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                </g>
              ),
            });
          }}
        </svg>

        <div class="flex items-center gap-4 mt-1 flex-wrap">
          {For({
            each: legendItems,
            children: (item) => (
              <div class="flex items-center gap-1.5">
                <span
                  class="w-3 h-2 rounded-sm inline-block opacity-60"
                  style={`background:${item.color}`}
                />
                <span class="text-[10px] font-mono text-[#666]">{item.label}</span>
              </div>
            ),
          })}
        </div>
      </div>
    );
  },
});
