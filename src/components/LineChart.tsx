import { createComponent } from 'liteforge';

interface LineChartProps {
  data: () => number[][];   // array of series, each is array of values
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

function buildPolyline(values: number[], width: number, height: number, yMax: number): string {
  if (values.length < 2) return '';
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (v / yMax) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return pts.join(' ');
}

export const LineChart = createComponent<LineChartProps>({
  name: 'LineChart',
  component({ props }) {
    const W = 560;
    const H = props.height ?? 120;
    const yMax = props.yMax ?? 100;

    return (
      <div class="w-full">
        <svg
          viewBox={`0 0 ${W} ${H + 20}`}
          class="w-full"
          style={`height: ${H + 20}px`}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(pct => {
            const y = H - (pct / 100) * H;
            return (
              <g>
                <line
                  x1="0" y1={y} x2={W} y2={y}
                  stroke="#1e1e1e" stroke-width="1"
                />
                <text x="4" y={y - 2} font-size="9" fill="#444" font-family="monospace">
                  {Math.round((pct / 100) * yMax)}
                </text>
              </g>
            );
          })}

          {/* Series lines */}
          {() => {
            const series = props.data();
            return series.map((values, i) => (
              <polyline
                points={buildPolyline(values, W, H, yMax)}
                fill="none"
                stroke={props.colors[i] ?? '#00C49A'}
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            ));
          }}
        </svg>

        {/* Legend */}
        <div class="flex items-center gap-4 mt-1 flex-wrap">
          {props.labels.map((label, i) => (
            <div class="flex items-center gap-1.5">
              <span
                class="w-3 h-0.5 rounded inline-block"
                style={`background:${props.colors[i] ?? '#00C49A'}`}
              />
              <span class="text-[10px] font-mono text-[#666]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
