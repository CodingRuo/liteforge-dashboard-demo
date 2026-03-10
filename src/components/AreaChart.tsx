import { createComponent } from 'liteforge';
import { effect } from '@liteforge/core';

interface AreaChartProps {
  data: () => number[][];
  colors: string[];
  labels: string[];
  yMax?: number;
  height?: number;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 560;
const GRID_PCTS = [0, 25, 50, 75, 100];

function makeSvgEl<T extends SVGElement>(tag: string, attrs: Record<string, string | number>): T {
  const el = document.createElementNS(SVG_NS, tag) as T;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function buildAreaPath(values: number[], height: number, yMax: number): string {
  if (values.length < 2) return '';
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * W, y: height - (v / yMax) * height }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1]!;
  const first = pts[0]!;
  return `${line} L${last.x.toFixed(1)},${height} L${first.x.toFixed(1)},${height} Z`;
}

function buildLinePath(values: number[], height: number, yMax: number): string {
  if (values.length < 2) return '';
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = height - (v / yMax) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export const AreaChart = createComponent<AreaChartProps>({
  name: 'AreaChart',
  component({ props }) {
    const H = props.height ?? 120;
    const yMax = props.yMax ?? 100;

    // --- SVG ---
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H + 20}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.width = '100%';
    svg.style.height = `${H + 20}px`;
    svg.style.display = 'block';

    // Grid lines
    for (const pct of GRID_PCTS) {
      const y = H - (pct / 100) * H;
      const g = document.createElementNS(SVG_NS, 'g');
      g.appendChild(makeSvgEl('line', { x1: 0, y1: y, x2: W, y2: y, stroke: '#1e1e1e', 'stroke-width': 1 }));
      const txt = makeSvgEl<SVGTextElement>('text', { x: 4, y: y - 2, 'font-size': 9, fill: '#444', 'font-family': 'monospace' });
      txt.textContent = `${Math.round((pct / 100) * yMax)}%`;
      g.appendChild(txt);
      svg.appendChild(g);
    }

    // Area + line paths (reactive)
    const seriesGroups = props.colors.map((color) => {
      const g = document.createElementNS(SVG_NS, 'g');
      const area = makeSvgEl<SVGPathElement>('path', { fill: color, 'fill-opacity': 0.12, stroke: 'none', d: '' });
      const line = makeSvgEl<SVGPathElement>('path', {
        fill: 'none', stroke: color, 'stroke-width': 1.5,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round', d: '',
      });
      g.appendChild(area);
      g.appendChild(line);
      svg.appendChild(g);
      return { area, line };
    });

    effect(() => {
      const series = props.data();
      series.forEach((values, i) => {
        const grp = seriesGroups[i];
        if (!grp) return;
        grp.area.setAttribute('d', buildAreaPath(values, H, yMax));
        grp.line.setAttribute('d', buildLinePath(values, H, yMax));
      });
    });

    // --- Legend ---
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.gap = '16px';
    legend.style.marginTop = '4px';

    props.labels.forEach((label, i) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '6px';

      const swatch = document.createElement('span');
      swatch.style.display = 'inline-block';
      swatch.style.width = '12px';
      swatch.style.height = '8px';
      swatch.style.borderRadius = '2px';
      swatch.style.opacity = '0.6';
      swatch.style.background = props.colors[i] ?? '#00C49A';

      const lbl = document.createElement('span');
      lbl.style.fontSize = '10px';
      lbl.style.fontFamily = 'monospace';
      lbl.style.color = '#666';
      lbl.textContent = label;

      item.appendChild(swatch);
      item.appendChild(lbl);
      legend.appendChild(item);
    });

    // --- Wrapper ---
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.appendChild(svg);
    wrapper.appendChild(legend);
    return wrapper;
  },
});
