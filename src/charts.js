/**
 * Accessible Inline SVG Charts for Five Elements, Monthly Fortune Curve, and Quarterly Comparison.
 */

import { ELEMENTS, ELEMENT_KEYS } from './saju-analyzer.js';

const ELEMENT_COLOR_VAR = {
  목: 'var(--el-wood)',
  화: 'var(--el-fire)',
  토: 'var(--el-earth)',
  금: 'var(--el-metal)',
  수: 'var(--el-water)',
};

/**
 * Render proportional Five Elements (오행) stacked bar & legend.
 */
export function renderElementsBar(elementStats) {
  const { percentages, counts, strongest, weakest } = elementStats;

  const segments = ELEMENT_KEYS.map((el) => {
    const pct = percentages[el] || 0;
    const widthPct = Math.max(pct, counts[el] > 0 ? 4 : 0);
    return {
      key: el,
      info: ELEMENTS[el],
      pct,
      widthPct,
      count: counts[el],
    };
  });

  const barParts = segments
    .filter((seg) => seg.widthPct > 0)
    .map(
      (seg) => `
      <div
        class="element-bar-seg el-bg-${seg.info.token}"
        style="flex: ${seg.widthPct} 0 0%;"
        title="${seg.info.label} ${seg.pct}%"
      >
        ${seg.pct >= 10 ? `<span>${seg.key} ${seg.pct}%</span>` : ''}
      </div>`
    )
    .join('');

  const legendItems = segments
    .map((seg) => {
      const tag =
        seg.key === strongest
          ? '<em class="el-tag is-strong">강</em>'
          : seg.key === weakest
            ? '<em class="el-tag is-weak">보완</em>'
            : '';
      return `
      <div class="element-legend-item">
        <span class="element-dot el-bg-${seg.info.token}" aria-hidden="true"></span>
        <span class="element-name">${seg.info.label}</span>
        <strong class="element-pct">${seg.pct}%</strong>
        ${tag}
      </div>`;
    })
    .join('');

  return `
    <div class="elements-chart" role="group" aria-label="사주 오행 분포 비율">
      <div class="elements-stacked-bar" aria-hidden="true">
        ${barParts}
      </div>
      <div class="elements-legend">
        ${legendItems}
      </div>
    </div>
  `;
}

/**
 * Render 12-Month Saju Score Flow Chart (SVG).
 */
export function renderMonthlyFlowChart(monthlyFortunes, selectedMonth = null, currentMonthInYear = null) {
  const W = 840;
  const H = 248;
  const padL = 46;
  const padR = 26;
  const padT = 34;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const minScore = 45;
  const maxScore = 100;

  const xAt = (idx) => padL + (idx / 11) * plotW;
  const yAt = (score) => padT + ((maxScore - score) / (maxScore - minScore)) * plotH;

  let peakMonth = monthlyFortunes[0];
  for (const m of monthlyFortunes) {
    if (m.score > peakMonth.score) peakMonth = m;
  }

  // Alternating Q1~Q4 background bands
  const quarterBands = [0, 1, 2, 3]
    .map((qIdx) => {
      const startIdx = qIdx * 3;
      const x1 = qIdx === 0 ? padL - 10 : (xAt(startIdx - 1) + xAt(startIdx)) / 2;
      const x2 = qIdx === 3 ? W - padR + 10 : (xAt(startIdx + 2) + xAt(startIdx + 3)) / 2;
      const center = (x1 + x2) / 2;
      return `
        <rect
          x="${x1.toFixed(1)}"
          y="${padT - 8}"
          width="${(x2 - x1).toFixed(1)}"
          height="${plotH + 14}"
          rx="8"
          class="chart-quarter-band ${qIdx % 2 === 1 ? 'is-alt' : ''}"
        />
        <text x="${center.toFixed(1)}" y="18" text-anchor="middle" class="chart-quarter-label">
          ${qIdx + 1}분기
        </text>`;
    })
    .join('');

  // Horizontal guide lines
  const gridLines = [60, 75, 90]
    .map((val) => {
      const y = yAt(val);
      return `
        <line x1="${padL - 8}" y1="${y.toFixed(1)}" x2="${W - padR + 8}" y2="${y.toFixed(1)}" class="chart-grid-line" />
        <text x="${padL - 14}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="chart-axis-tick">${val}</text>`;
    })
    .join('');

  const points = monthlyFortunes.map((m, i) => ({
    x: xAt(i),
    y: yAt(m.score),
    m,
  }));

  // Smooth quadratic path through points
  let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = ((p0.x + p1.x) / 2).toFixed(1);
    linePath += ` C ${cx} ${p0.y.toFixed(1)}, ${cx} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  const baseLineY = (padT + plotH).toFixed(1);
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseLineY} L ${points[0].x.toFixed(1)} ${baseLineY} Z`;

  const nodes = points
    .map(({ x, y, m }) => {
      const isPeak = m.month === peakMonth.month;
      const isSelected = m.month === selectedMonth;
      const isCurrent = m.month === currentMonthInYear;
      const elColor = ELEMENT_COLOR_VAR[m.pillar.branch.element] || 'var(--accent-primary)';

      return `
        <g
          class="chart-node ${isPeak ? 'is-peak' : ''} ${isSelected ? 'is-selected' : ''}"
          role="button"
          tabindex="0"
          data-chart-month="${m.month}"
          aria-label="${m.month}월 ${m.pillar.hangul}월 운세 점수 ${m.score}점 (${m.grade.label}), 클릭하여 상세 보기"
        >
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="transparent" />
          ${isCurrent ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" class="chart-node-ring" />` : ''}
          <circle
            cx="${x.toFixed(1)}"
            cy="${y.toFixed(1)}"
            r="${isSelected || isPeak ? 6.5 : 5}"
            fill="${elColor}"
            class="chart-node-dot"
          />
          <text x="${x.toFixed(1)}" y="${(y - 12).toFixed(1)}" text-anchor="middle" class="chart-node-score">
            ${m.score}
          </text>
          ${isPeak ? `<text x="${x.toFixed(1)}" y="${(y - 24).toFixed(1)}" text-anchor="middle" class="chart-peak-tag">최고</text>` : ''}
          <text x="${x.toFixed(1)}" y="${H - 22}" text-anchor="middle" class="chart-month-tick ${isCurrent ? 'is-current' : ''}">
            ${m.month}월
          </text>
          <text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" class="chart-pillar-tick">
            ${m.pillar.hangul}
          </text>
        </g>`;
    })
    .join('');

  return `
    <svg
      class="saju-svg-chart"
      viewBox="0 0 ${W} ${H}"
      role="img"
      aria-label="1월부터 12월까지 월별 사주 운세 흐름 그래프"
    >
      <defs>
        <linearGradient id="monthlyFlowFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0.02" />
        </linearGradient>
      </defs>
      ${quarterBands}
      ${gridLines}
      <path d="${areaPath}" fill="url(#monthlyFlowFill)" />
      <path d="${linePath}" fill="none" stroke="var(--accent-primary)" stroke-width="2.75" stroke-linecap="round" />
      ${nodes}
    </svg>
  `;
}

/**
 * Render 4-Quarter Saju Comparison Grouped Bar Chart (SVG).
 */
export function renderQuarterlyChart(quarterlyFortunes, activeQuarter = null) {
  const W = 840;
  const H = 236;
  const padL = 48;
  const padR = 24;
  const padT = 32;
  const padB = 46;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const minScore = 40;
  const maxScore = 100;

  let peakQuarter = quarterlyFortunes[0];
  for (const q of quarterlyFortunes) {
    if (q.score > peakQuarter.score) peakQuarter = q;
  }

  const yAt = (score) => padT + ((maxScore - score) / (maxScore - minScore)) * plotH;
  const barHeight = (score) => padT + plotH - yAt(score);

  const gridLines = [60, 75, 90]
    .map((val) => {
      const y = yAt(val);
      return `
        <line x1="${padL - 8}" y1="${y.toFixed(1)}" x2="${W - padR + 8}" y2="${y.toFixed(1)}" class="chart-grid-line" />
        <text x="${padL - 14}" y="${(y + 4).toFixed(1)}" text-anchor="end" class="chart-axis-tick">${val}</text>`;
    })
    .join('');

  const groupWidth = plotW / 4;

  const groups = quarterlyFortunes
    .map((q, idx) => {
      const gx = padL + idx * groupWidth;
      const centerX = gx + groupWidth / 2;
      const isPeak = q.quarter === peakQuarter.quarter;
      const isActive = q.quarter === activeQuarter;

      const mainBarW = 34;
      const mainBarX = centerX - 66;
      const mainBarY = yAt(q.score);
      const mainBarH = barHeight(q.score);

      const domains = [
        { label: '재물', score: q.categorySummaries.wealth.score, color: 'var(--el-earth)' },
        { label: '직업', score: q.categorySummaries.career.score, color: 'var(--el-wood)' },
        { label: '애정', score: q.categorySummaries.love.score, color: 'var(--el-fire)' },
        { label: '건강', score: q.categorySummaries.health.score, color: 'var(--el-water)' },
      ];

      const miniBars = domains
        .map((d, dIdx) => {
          const bx = centerX - 20 + dIdx * 22;
          const by = yAt(d.score);
          const bh = barHeight(d.score);
          return `
            <rect
              x="${bx.toFixed(1)}"
              y="${by.toFixed(1)}"
              width="14"
              height="${bh.toFixed(1)}"
              rx="4"
              fill="${d.color}"
              opacity="0.88"
            />
            <text x="${(bx + 7).toFixed(1)}" y="${(by - 5).toFixed(1)}" text-anchor="middle" class="chart-mini-score">
              ${d.score}
            </text>
            <text x="${(bx + 7).toFixed(1)}" y="${padT + plotH + 14}" text-anchor="middle" class="chart-mini-label">
              ${d.label}
            </text>`;
        })
        .join('');

      return `
        <g
          class="chart-quarter-group ${isPeak ? 'is-peak' : ''} ${isActive ? 'is-active' : ''}"
          role="button"
          tabindex="0"
          data-chart-quarter="${q.quarter}"
          aria-label="${q.label} 종합 점수 ${q.score}점 (${q.grade.label}), 클릭하여 상세 보기"
        >
          <rect
            x="${(gx + 8).toFixed(1)}"
            y="${padT - 10}"
            width="${(groupWidth - 16).toFixed(1)}"
            height="${plotH + 34}"
            rx="12"
            class="chart-quarter-card-bg"
          />
          <rect
            x="${mainBarX.toFixed(1)}"
            y="${mainBarY.toFixed(1)}"
            width="${mainBarW}"
            height="${mainBarH.toFixed(1)}"
            rx="6"
            class="chart-main-quarter-bar"
          />
          <text x="${(mainBarX + mainBarW / 2).toFixed(1)}" y="${(mainBarY - 6).toFixed(1)}" text-anchor="middle" class="chart-node-score">
            ${q.score}
          </text>
          ${
            isPeak
              ? `<text x="${(mainBarX + mainBarW / 2).toFixed(1)}" y="${(mainBarY - 19).toFixed(1)}" text-anchor="middle" class="chart-peak-tag">최고 분기</text>`
              : ''
          }
          <text x="${(mainBarX + mainBarW / 2).toFixed(1)}" y="${padT + plotH + 14}" text-anchor="middle" class="chart-mini-label">
            종합
          </text>
          ${miniBars}
          <text x="${centerX.toFixed(1)}" y="${H - 6}" text-anchor="middle" class="chart-quarter-axis">
            ${q.quarter}분기 (${q.monthsRange}) · ${q.trajectory}
          </text>
        </g>`;
    })
    .join('');

  return `
    <svg
      class="saju-svg-chart"
      viewBox="0 0 ${W} ${H}"
      role="img"
      aria-label="1분기부터 4분기까지 분기별 사주 운세 비교 그래프"
    >
      ${gridLines}
      ${groups}
    </svg>
  `;
}
