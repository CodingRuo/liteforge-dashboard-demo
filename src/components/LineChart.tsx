import { createComponent } from 'liteforge';
import { For } from 'liteforge';

interface LineChartProps {
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

function buildPolyline(values: number[], width: number, height: number, yMax: number): string {
  if (values.length < 2) return '';
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / yMax) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export const LineChart = createComponent<LineChartProps>({
  name: 'LineChart',
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
                  {gl.label}
                </text>
              </g>
            ),
          })}

          {() => {
            const series = props.data();
            const seriesItems = series.map((values, i) => ({
              points: buildPolyline(values, W, H, yMax),
              color: props.colors[i] ?? '#00C49A',
            }));
            return For({
              each: seriesItems,
              children: (item) => (
                <polyline
                  points={item.points}
                  fill="none"
                  stroke={item.color}
                  stroke-width="1.5"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                />
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
                  class="w-3 h-0.5 rounded inline-block"
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
