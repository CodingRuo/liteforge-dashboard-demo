import { createComponent } from 'liteforge';

interface AreaChartProps {
  data: () => number[][];   // array of series
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

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

export const AreaChart = createComponent<AreaChartProps>({
  name: 'AreaChart',
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
                  {Math.round((pct / 100) * yMax)}%
                </text>
              </g>
            );
          })}

          {/* Filled areas */}
          {() => {
            const series = props.data();
            return series.map((values, i) => {
              const color = props.colors[i] ?? '#00C49A';
              return (
                <g>
                  <path
                    d={buildAreaPath(values, W, H, yMax)}
                    fill={color}
                    fill-opacity="0.12"
                    stroke="none"
                  />
                  <path
                    d={`M ${values.map((v, idx) => {
                      const x = (idx / (values.length - 1)) * W;
                      const y = H - (v / yMax) * H;
                      return `${idx === 0 ? '' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(' ')}`}
                    fill="none"
                    stroke={color}
                    stroke-width="1.5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                  />
                </g>
              );
            });
          }}
        </svg>

        {/* Legend */}
        <div class="flex items-center gap-4 mt-1 flex-wrap">
          {props.labels.map((label, i) => (
            <div class="flex items-center gap-1.5">
              <span
                class="w-3 h-2 rounded-sm inline-block opacity-60"
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
