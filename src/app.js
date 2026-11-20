/**
 * Main interactive controller for 청월당 (淸月堂) Monthly & Quarterly Saju Web App.
 */

import { getTodayPlainDate, parsePlainTime } from './date-utils.js';
import { SIJIN_LIST, EARTHLY_BRANCHES, getHourBranchFromTime } from './manseryeok.js';
import { ELEMENTS } from './saju-analyzer.js';
import { generateSajuReport } from './fortune-engine.js';
import { renderElementsBar, renderMonthlyFlowChart, renderQuarterlyChart } from './charts.js';

const THEME_STORAGE_KEY = 'saju-color-scheme';
const HISTORY_STORAGE_KEY = 'saju-recent-profiles-v1';

const appState = {
  report: null,
  activeView: 'monthly', // 'monthly' | 'quarterly'
  monthFilter: 'all', // 'all' | 'q1' | 'q2' | 'q3' | 'q4' | 'great'
  selectedMonth: null,
  selectedQuarter: null,
  dialogMode: null, // { type: 'month', month: number } | { type: 'quarter', quarter: number }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ==========================================================================
   1. Two-State Color Scheme Toggle (System Setting vs Opposite Pinned)
   ========================================================================== */
function initThemeController() {
  const toggleBtn = document.getElementById('theme-toggle');
  const toggleLabel = document.getElementById('theme-toggle-label');
  const metaTheme = document.querySelector('meta[name="color-scheme"]');
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const getSavedScheme = () => {
    try {
      const val = localStorage.getItem(THEME_STORAGE_KEY);
      return val === 'light' || val === 'dark' ? val : null;
    } catch {
      return null;
    }
  };

  const applyScheme = (scheme) => {
    const isPinned = scheme === 'light' || scheme === 'dark';
    if (isPinned) {
      if (metaTheme) metaTheme.content = scheme;
      document.documentElement.dataset.theme = scheme;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, scheme);
      } catch {
        // Ignore storage restrictions
      }
    } else {
      if (metaTheme) metaTheme.content = 'light dark';
      delete document.documentElement.dataset.theme;
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch {
        // Ignore storage restrictions
      }
    }

    const effectiveDark = isPinned ? scheme === 'dark' : darkQuery.matches;
    toggleBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
    if (isPinned) {
      toggleLabel.textContent = scheme === 'dark' ? '다크 고정 (시스템 복귀)' : '라이트 고정 (시스템 복귀)';
    } else {
      toggleLabel.textContent = effectiveDark ? '시스템(다크) · 라이트 전환' : '시스템(라이트) · 다크 전환';
    }
  };

  applyScheme(getSavedScheme());

  toggleBtn.addEventListener('click', () => {
    const currentSaved = getSavedScheme();
    if (currentSaved) {
      applyScheme(null);
    } else {
      const opposite = darkQuery.matches ? 'light' : 'dark';
      applyScheme(opposite);
    }
  });

  darkQuery.addEventListener('change', () => {
    if (!getSavedScheme()) {
      applyScheme(null);
    }
  });
}

/* ==========================================================================
   2. Validation Accessibility Bridge & :user-invalid WeakMap Fallback
   ========================================================================== */
const UserInvalidFallback = (() => {
  const dirtyState = new WeakMap();

  const updateState = (input) => {
    const isValid = input.checkValidity();
    input.classList.toggle('user-invalid-fallback', !isValid);
    input.classList.toggle('user-valid-fallback', isValid);
    if (!isValid) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  };

  const handleEvent = (event) => {
    const input = event.target;
    if (event.type === 'reset') {
      const controls = input.elements || [];
      for (const control of controls) {
        dirtyState.delete(control);
        control.classList.remove('user-invalid-fallback', 'user-valid-fallback');
        control.removeAttribute('aria-invalid');
      }
      return;
    }
    if (!input.checkValidity) return;

    if (event.type === 'input' || event.type === 'change') {
      const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(input, state);
      if (state.hasBlurred) {
        updateState(input);
      }
    } else if (event.type === 'blur') {
      const state = dirtyState.get(input) || { hasInteracted: false, hasBlurred: false };
      state.hasBlurred = true;
      dirtyState.set(input, state);
      if (state.hasInteracted || input.required) {
        updateState(input);
      }
    }
  };

  const markFormAttempted = (form) => {
    const controls = form.querySelectorAll('input');
    for (const control of controls) {
      if (control.disabled) continue;
      dirtyState.set(control, { hasInteracted: true, hasBlurred: true });
      updateState(control);
    }
  };

  const init = (root) => {
    if (CSS.supports('selector(:user-invalid)')) return null;
    root.addEventListener('blur', handleEvent, true);
    root.addEventListener('input', handleEvent);
    root.addEventListener('change', handleEvent);
    root.addEventListener('reset', handleEvent, true);
    return { markFormAttempted };
  };

  return { init };
})();

function initFormValidationBridge(form) {
  const fallbackHandle = UserInvalidFallback.init(form);

  const syncAriaInvalid = (input) => {
    if (input.disabled) {
      input.removeAttribute('aria-invalid');
      return;
    }
    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  };

  form.addEventListener(
    'blur',
    (e) => {
      if (e.target.matches('input[required]')) {
        syncAriaInvalid(e.target);
      }
    },
    true
  );

  form.addEventListener('input', (e) => {
    if (e.target.matches('input') && e.target.checkValidity()) {
      e.target.removeAttribute('aria-invalid');
      e.target.classList.remove('user-invalid-fallback');
    }
  });

  form.addEventListener('reset', () => {
    form.querySelectorAll('input').forEach((el) => {
      el.removeAttribute('aria-invalid');
      el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
    });
  });

  return {
    syncOnSubmit() {
      if (fallbackHandle) {
        fallbackHandle.markFormAttempted(form);
      }
      form.querySelectorAll('input[required]').forEach(syncAriaInvalid);
    },
  };
}

/* ==========================================================================
   3. Recent History Management
   ========================================================================== */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToHistory(payload) {
  const existing = loadHistory().filter(
    (item) =>
      !(
        item.lastName === payload.lastName &&
        item.firstName === payload.firstName &&
        item.birthDate === payload.birthDate &&
        item.calendarType === payload.calendarType
      )
  );
  const next = [payload, ...existing].slice(0, 5);
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
  return next;
}

function renderHistoryBar(onSelectProfile) {
  const bar = document.getElementById('history-bar');
  const chipsWrap = document.getElementById('history-chips');
  const items = loadHistory();

  if (!items.length) {
    bar.hidden = true;
    chipsWrap.innerHTML = '';
    return;
  }

  bar.hidden = false;
  chipsWrap.innerHTML = items
    .map(
      (item, idx) => `
      <button type="button" class="history-chip" data-history-idx="${idx}">
        ${escapeHtml(item.lastName)}${escapeHtml(item.firstName)} · ${escapeHtml(item.birthDate)} (${item.timeUnknown ? '시각모름' : escapeHtml(item.birthTime)})
      </button>`
    )
    .join('');

  chipsWrap.querySelectorAll('[data-history-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.historyIdx);
      if (items[idx]) onSelectProfile(items[idx]);
    });
  });
}

/* ==========================================================================
   4. Sijin Quick Picker & Live Badge
   ========================================================================== */
function initSijinPicker({ birthTimeInput, timeUnknownCheckbox, onTimeSelected }) {
  const chipsWrap = document.getElementById('sijin-chips');
  const pickerWrap = document.getElementById('sijin-picker-wrap');
  const liveBadge = document.getElementById('sijin-live-badge');

  chipsWrap.innerHTML = SIJIN_LIST.map(
    (item) => `
    <button
      type="button"
      class="sijin-chip"
      data-sijin-branch="${item.branchIndex}"
      data-sijin-time="${item.representativeTime}"
    >
      <strong>${item.label}</strong>
      <span>${item.timeRange}</span>
    </button>`
  ).join('');

  const updateUi = () => {
    const unknown = timeUnknownCheckbox.checked;
    birthTimeInput.disabled = unknown;
    birthTimeInput.required = !unknown;
    pickerWrap.classList.toggle('is-disabled', unknown);
    document.getElementById('birth-time-req-mark').hidden = unknown;

    if (unknown) {
      birthTimeInput.removeAttribute('aria-invalid');
      liveBadge.textContent = '시각 모름 · 삼주(년·월·일) 분석 모드';
      chipsWrap.querySelectorAll('.sijin-chip').forEach((c) => c.classList.remove('is-active'));
      return;
    }

    const val = birthTimeInput.value;
    if (!val) {
      liveBadge.textContent = '시진을 확인하려면 시각을 선택하세요';
      chipsWrap.querySelectorAll('.sijin-chip').forEach((c) => c.classList.remove('is-active'));
      return;
    }

    try {
      const t = parsePlainTime(val);
      const { branchIndex, advancesDay } = getHourBranchFromTime(t.hour, t.minute, true);
      const branch = EARTHLY_BRANCHES[branchIndex];
      liveBadge.textContent = advancesDay
        ? `${branch.timeLabel} (${branch.timeRange}) · 야자시 일주 전환`
        : `${branch.timeLabel} (${branch.timeRange})`;
      chipsWrap.querySelectorAll('.sijin-chip').forEach((c) => {
        c.classList.toggle('is-active', Number(c.dataset.sijinBranch) === branchIndex);
      });
    } catch {
      liveBadge.textContent = '올바른 시각을 입력해 주세요';
    }
  };

  chipsWrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sijin-time]');
    if (!btn) return;
    timeUnknownCheckbox.checked = false;
    birthTimeInput.disabled = false;
    birthTimeInput.required = true;
    birthTimeInput.value = btn.dataset.sijinTime;
    birthTimeInput.removeAttribute('aria-invalid');
    birthTimeInput.classList.remove('user-invalid-fallback');
    updateUi();
    if (onTimeSelected) onTimeSelected();
  });

  birthTimeInput.addEventListener('input', updateUi);
  birthTimeInput.addEventListener('change', updateUi);
  timeUnknownCheckbox.addEventListener('change', updateUi);

  updateUi();
  return { updateUi };
}

/* ==========================================================================
   5. Render Natal Chart & Fortune Views
   ========================================================================== */
function renderPillarCard(slotTitle, subLabel, pillar, isDayPillar = false) {
  if (!pillar) {
    return `
      <div class="pillar-card is-unknown">
        <span class="pillar-slot-label">${slotTitle}</span>
        <span class="pillar-tengod">태어난 시각 미상</span>
        <div class="pillar-glyph-box">
          <div class="glyph-cell el-bg-metal">
            <span class="glyph-hanja">?</span>
            <span class="glyph-hangul">미상</span>
          </div>
          <div class="glyph-cell el-bg-metal">
            <span class="glyph-hanja">?</span>
            <span class="glyph-hangul">삼주 풀이</span>
          </div>
        </div>
        <span class="pillar-stage">${subLabel}</span>
      </div>`;
  }

  const stemEl = ELEMENTS[pillar.stem.element];
  const branchEl = ELEMENTS[pillar.branch.element];

  return `
    <div class="pillar-card ${isDayPillar ? 'is-day-pillar' : ''}">
      <span class="pillar-slot-label">${slotTitle}</span>
      <span class="pillar-tengod">${pillar.stemTenGod.name}</span>
      <div class="pillar-glyph-box">
        <div class="glyph-cell el-bg-${stemEl.token}">
          <span class="glyph-hanja" lang="zh-Hant">${pillar.stem.hanja}</span>
          <span class="glyph-hangul">${pillar.stem.hangul} · ${stemEl.key}</span>
        </div>
        <div class="glyph-cell el-bg-${branchEl.token}">
          <span class="glyph-hanja" lang="zh-Hant">${pillar.branch.hanja}</span>
          <span class="glyph-hangul">${pillar.branch.hangul} · ${branchEl.key}(${pillar.branch.animal})</span>
        </div>
      </div>
      <span class="pillar-stage">${pillar.branchTenGod.name} · ${pillar.twelveStage.name}</span>
    </div>`;
}

function renderReport(report) {
  appState.report = report;
  const resultsEl = document.getElementById('results-section');
  resultsEl.hidden = false;

  const { person, fourPillars, natal, nameAnalysis, annualSummary, targetYear } = report;
  const genderLabel =
    person.gender === 'female' ? '여성' : person.gender === 'male' ? '남성' : null;
  const lunarText = `음력 ${person.lunarDate.year}.${person.lunarDate.month}.${person.lunarDate.day}${person.lunarDate.isLeap ? ' (윤달)' : ''}`;
  const timeText = person.timeUnknown
    ? '태어난 시각 모름'
    : `${person.birthTime} · ${fourPillars.sijin.timeLabel}${fourPillars.dayAdvancedByJaSi ? ' (야자시 일주 적용)' : ''}`;

  document.getElementById('profile-banner').innerHTML = `
    <div>
      <div class="banner-name-row">
        <h2>${escapeHtml(person.fullName)} 님의 만세력 리포트</h2>
        <span class="banner-chip">${natal.pillars.day.hangul}일주 (${natal.pillars.day.hanja})</span>
        ${genderLabel ? `<span class="banner-chip">${genderLabel}</span>` : ''}
      </div>
      <div class="banner-meta">
        <span>양력 ${person.solarDate.iso}</span>
        <span>${lunarText}</span>
        <span>${timeText}</span>
      </div>
    </div>
    <div class="banner-actions">
      <button type="button" id="scroll-to-form-btn" class="btn-ghost btn-sm">정보 수정</button>
      <button type="button" id="print-report-btn" class="btn-ghost btn-sm">인쇄 / PDF 저장</button>
    </div>
  `;

  document.getElementById('scroll-to-form-btn').addEventListener('click', () => {
    document.getElementById('last-name').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('print-report-btn').addEventListener('click', () => {
    window.print();
  });

  // Natal Pillars
  const animalText = `${natal.pillars.year.branch.animal}띠 · 입춘 기준 ${fourPillars.sajuYear}년주`;
  document.getElementById('natal-subtitle').textContent = animalText;
  document.getElementById('natal-strength-badge').textContent = `${natal.strength} 사주 · 일간 ${natal.pillars.day.stem.hangul}(${natal.pillars.day.stem.hanja})`;

  document.getElementById('pillars-grid').innerHTML = [
    renderPillarCard('시주 (생시)', '말년 · 자식운', natal.pillars.hour, false),
    renderPillarCard('일주 (나)', '본인 · 배우자운', natal.pillars.day, true),
    renderPillarCard('월주 (생월)', '청년 · 직업운', natal.pillars.month, false),
    renderPillarCard('연주 (생년)', '초년 · 가문운', natal.pillars.year, false),
  ].join('');

  document.getElementById('day-master-box').innerHTML = `
    <h3>${natal.dayMasterProfile.title}</h3>
    <p>${natal.dayMasterProfile.summary}</p>
  `;

  // Elements + Yongsin
  document.getElementById('elements-chart-wrap').innerHTML = renderElementsBar(natal.elementStats);
  document.getElementById('yongsin-grid').innerHTML = `
    <div class="yongsin-pill">
      <span>용신 (핵심 보완)</span>
      <strong class="el-text-${ELEMENTS[natal.yongsin].token}">${ELEMENTS[natal.yongsin].label}</strong>
    </div>
    <div class="yongsin-pill">
      <span>희신 (돕는 기운)</span>
      <strong class="el-text-${ELEMENTS[natal.heesin].token}">${ELEMENTS[natal.heesin].label}</strong>
    </div>
    <div class="yongsin-pill">
      <span>기신 (주의 기운)</span>
      <strong class="el-text-${ELEMENTS[natal.gisin].token}">${ELEMENTS[natal.gisin].label}</strong>
    </div>
  `;

  // Name Analysis
  const tokenHtml = nameAnalysis.allTokens
    .map(
      (t) => `
      <span class="name-token">
        <span class="name-token-char">${escapeHtml(t.char)}</span>
        <span class="name-token-meta">초성 ${escapeHtml(t.initial)} · <strong class="el-text-${ELEMENTS[t.element].token}">${ELEMENTS[t.element].label}</strong></span>
      </span>`
    )
    .join('');

  document.getElementById('name-analysis-wrap').innerHTML = `
    <div class="name-tokens-row">${tokenHtml}</div>
    <p class="name-summary">${escapeHtml(nameAnalysis.summary)}</p>
    <div class="name-score-line">
      <span>성명 · 원국 오행 조화도</span>
      <strong>${nameAnalysis.harmonyScore}점 / 100</strong>
    </div>
  `;

  // Board Header & Stats
  document.getElementById('annual-headline').textContent = annualSummary.yearHeadline;
  const resultYearSelect = document.getElementById('result-year-select');
  if (resultYearSelect.value !== String(targetYear)) {
    resultYearSelect.value = String(targetYear);
  }

  document.getElementById('annual-quick-stats').innerHTML = `
    <span class="stat-pill">${targetYear}년 평균 <strong>${annualSummary.averageScore}점</strong></span>
    <span class="stat-pill">최고의 달 <strong>${annualSummary.bestMonth.month}월 (${annualSummary.bestMonth.score}점)</strong></span>
    <span class="stat-pill">최고 분기 <strong>${annualSummary.bestQuarter.quarter}분기 (${annualSummary.bestQuarter.score}점)</strong></span>
  `;

  renderMonthlyPanel();
  renderQuarterlyPanel();
}

function renderMonthlyPanel() {
  const report = appState.report;
  if (!report) return;

  const today = getTodayPlainDate();
  const currentMonthInYear = report.targetYear === today.year ? today.month : null;

  const chartWrap = document.getElementById('monthly-chart-wrap');
  chartWrap.innerHTML = renderMonthlyFlowChart(
    report.monthlyFortunes,
    appState.selectedMonth,
    currentMonthInYear
  );

  chartWrap.querySelectorAll('[data-chart-month]').forEach((node) => {
    const mNum = Number(node.dataset.chartMonth);
    node.addEventListener('click', () => openMonthDialog(mNum));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMonthDialog(mNum);
      }
    });
  });

  const filtered = report.monthlyFortunes.filter((m) => {
    if (appState.monthFilter === 'q1') return m.quarter === 1;
    if (appState.monthFilter === 'q2') return m.quarter === 2;
    if (appState.monthFilter === 'q3') return m.quarter === 3;
    if (appState.monthFilter === 'q4') return m.quarter === 4;
    if (appState.monthFilter === 'great') return m.score >= 74;
    return true;
  });

  const grid = document.getElementById('monthly-grid');
  if (!filtered.length) {
    grid.innerHTML = `<p class="section-desc">선택한 조건에 해당하는 달이 없습니다. 전체 보기로 확인해 주세요.</p>`;
    return;
  }

  grid.innerHTML = filtered
    .map((m) => {
      const isCurrent = m.month === currentMonthInYear;
      const relTags = m.relations
        .slice(0, 2)
        .map(
          (r) =>
            `<span class="mini-tag ${r.valence === 'positive' ? 'is-positive' : 'is-caution'}">${r.label}</span>`
        )
        .join('');

      return `
        <button
          type="button"
          class="month-card ${isCurrent ? 'is-current-month' : ''}"
          data-month-card="${m.month}"
        >
          <div class="month-card-top">
            <div class="month-title-group">
              <h4>${m.month}월 · ${m.pillar.hangul}월 (${m.pillar.hanja})${isCurrent ? ' ★' : ''}</h4>
              <p class="month-term-sub">${m.termRangeText}</p>
            </div>
            <span class="score-badge tier-${m.grade.tier}">${m.score}점 · ${m.grade.label}</span>
          </div>

          <div class="month-pillar-row">
            <span>십성: <strong>${m.stemTenGod.name} · ${m.branchTenGod.name}</strong></span>
            <span>12운성: <strong>${m.twelveStage.name}</strong></span>
          </div>

          <p class="month-headline">${m.headline}</p>

          <div class="tag-row">
            ${m.keywords.map((k) => `<span class="mini-tag">#${k}</span>`).join('')}
            ${relTags}
          </div>

          <div class="month-mini-bars">
            <div><span>재물</span><strong>${m.categories.wealth.score}</strong></div>
            <div><span>직업</span><strong>${m.categories.career.score}</strong></div>
            <div><span>애정</span><strong>${m.categories.love.score}</strong></div>
            <div><span>건강</span><strong>${m.categories.health.score}</strong></div>
          </div>
        </button>`;
    })
    .join('');

  grid.querySelectorAll('[data-month-card]').forEach((card) => {
    card.addEventListener('click', () => {
      openMonthDialog(Number(card.dataset.monthCard));
    });
  });
}

function renderQuarterlyPanel() {
  const report = appState.report;
  if (!report) return;

  const bestQuarterNum = report.annualSummary.bestQuarter.quarter;
  const chartWrap = document.getElementById('quarterly-chart-wrap');
  chartWrap.innerHTML = renderQuarterlyChart(report.quarterlyFortunes, appState.selectedQuarter);

  chartWrap.querySelectorAll('[data-chart-quarter]').forEach((node) => {
    const qNum = Number(node.dataset.chartQuarter);
    node.addEventListener('click', () => openQuarterDialog(qNum));
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openQuarterDialog(qNum);
      }
    });
  });

  const grid = document.getElementById('quarterly-grid');
  grid.innerHTML = report.quarterlyFortunes
    .map((q) => {
      const isBest = q.quarter === bestQuarterNum;
      return `
        <article class="quarter-card ${isBest ? 'is-best-quarter' : ''}">
          <div class="quarter-head">
            <div>
              <h4>${q.label}${isBest ? ' · 올해의 핵심 분기' : ''}</h4>
              <p class="quarter-season-sub">${q.seasonTitle} · 흐름: <strong>${q.trajectory}</strong></p>
            </div>
            <span class="score-badge tier-${q.grade.tier}">${q.score}점 · ${q.grade.label}</span>
          </div>

          <p class="quarter-theme">${q.themeHeadline}</p>
          <p class="quarter-overview">${escapeHtml(q.overview)}</p>

          <div class="quarter-months-strip">
            ${q.months
              .map(
                (m) => `
              <button type="button" class="quarter-month-btn" data-open-month="${m.month}">
                <strong>${m.month}월 (${m.pillar.hangul})</strong>
                <span>${m.score}점 · ${m.grade.label} · ${m.branchTenGod.name}</span>
              </button>`
              )
              .join('')}
          </div>

          <ul class="quarter-strategies">
            ${q.strategies.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
          </ul>

          <div class="quarter-actions">
            <button type="button" class="btn-ghost btn-sm" data-open-quarter="${q.quarter}">
              ${q.quarter}분기 영역별 상세 보기
            </button>
          </div>
        </article>`;
    })
    .join('');

  grid.querySelectorAll('[data-open-month]').forEach((btn) => {
    btn.addEventListener('click', () => openMonthDialog(Number(btn.dataset.openMonth)));
  });

  grid.querySelectorAll('[data-open-quarter]').forEach((btn) => {
    btn.addEventListener('click', () => openQuarterDialog(Number(btn.dataset.openQuarter)));
  });
}

/* ==========================================================================
   6. Tabs (월별 사주 <-> 분기별 사주) & Keyboard Navigation
   ========================================================================== */
function initViewTabs() {
  const tabMonthly = document.getElementById('tab-monthly');
  const tabQuarterly = document.getElementById('tab-quarterly');
  const panelMonthly = document.getElementById('panel-monthly');
  const panelQuarterly = document.getElementById('panel-quarterly');
  const tabs = [tabMonthly, tabQuarterly];

  const activateTab = (viewName, focusTab = false) => {
    appState.activeView = viewName;
    const isMonthly = viewName === 'monthly';

    tabMonthly.setAttribute('aria-selected', isMonthly ? 'true' : 'false');
    tabMonthly.tabIndex = isMonthly ? 0 : -1;
    tabQuarterly.setAttribute('aria-selected', isMonthly ? 'false' : 'true');
    tabQuarterly.tabIndex = isMonthly ? -1 : 0;

    panelMonthly.hidden = !isMonthly;
    panelQuarterly.hidden = isMonthly;

    if (focusTab) {
      (isMonthly ? tabMonthly : tabQuarterly).focus();
    }
  };

  tabMonthly.addEventListener('click', () => activateTab('monthly'));
  tabQuarterly.addEventListener('click', () => activateTab('quarterly'));

  tabs.forEach((tab, idx) => {
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextIdx = (idx + 1) % tabs.length;
        activateTab(nextIdx === 0 ? 'monthly' : 'quarterly', true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        activateTab('monthly', true);
      } else if (e.key === 'End') {
        e.preventDefault();
        activateTab('quarterly', true);
      }
    });
  });

  return { activateTab };
}

/* ==========================================================================
   7. Modal Dialog (Native closedby="any" + Mandatory Backdrop Fallback)
   ========================================================================== */
const dialogEl = document.getElementById('detail-dialog');

// MANDATORY: Fallback for browsers without closedby attribute support
if (!('closedBy' in HTMLDialogElement.prototype)) {
  dialogEl.addEventListener('click', (event) => {
    if (event.target !== dialogEl) return;
    const rect = dialogEl.getBoundingClientRect();
    const isDialogContent =
      rect.top <= event.clientY &&
      event.clientY <= rect.top + rect.height &&
      rect.left <= event.clientX &&
      event.clientX <= rect.left + rect.width;
    if (isDialogContent) return;
    dialogEl.close();
  });
}

function openMonthDialog(monthNum) {
  const report = appState.report;
  if (!report) return;
  const m = report.monthlyFortunes.find((item) => item.month === monthNum);
  if (!m) return;

  appState.selectedMonth = monthNum;
  appState.dialogMode = { type: 'month', month: monthNum };

  document.getElementById('dialog-kicker').textContent =
    `${report.targetYear}년 ${m.quarter}분기 · ${m.termRangeText}`;
  document.getElementById('dialog-title').textContent =
    `${m.month}월 운세 — ${m.pillar.hangul}월 (${m.pillar.hanja}) · ${m.score}점 (${m.grade.label})`;

  const relListHtml = m.relations.length
    ? m.relations
        .map(
          (r) =>
            `<span class="mini-tag ${r.valence === 'positive' ? 'is-positive' : 'is-caution'}">${r.label}: ${r.description}</span>`
        )
        .join('')
    : '<span class="mini-tag">원국과의 큰 충·형 없이 무난한 지지 흐름</span>';

  document.getElementById('dialog-body').innerHTML = `
    <div class="dialog-summary-box">
      <p><strong>${m.headline}</strong></p>
      <p style="margin-top: 0.45rem;">${escapeHtml(m.overview)}</p>
      <div class="tag-row" style="margin-top: 0.65rem;">${relListHtml}</div>
    </div>

    <div class="dialog-domains">
      <div class="domain-box">
        <div class="domain-box-head"><strong>재물운</strong><span>${m.categories.wealth.score}점</span></div>
        <p>${m.categories.wealth.advice}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>직업 · 학업운</strong><span>${m.categories.career.score}점</span></div>
        <p>${m.categories.career.advice}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>대인 · 애정운</strong><span>${m.categories.love.score}점</span></div>
        <p>${m.categories.love.advice}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>건강 · 컨디션</strong><span>${m.categories.health.score}점</span></div>
        <p>${m.categories.health.advice}</p>
      </div>
    </div>

    <div class="dialog-lucky-box">
      <div><strong>이달의 개운 요소:</strong> 색상 <b>${m.lucky.color}</b> · 방위 <b>${m.lucky.direction}</b> · 숫자 <b>${m.lucky.number}</b></div>
      <div><strong>실천 조언:</strong> ${m.lucky.actionTip}</div>
    </div>
  `;

  document.getElementById('dialog-prev-btn').textContent = '← 이전 달';
  document.getElementById('dialog-next-btn').textContent = '다음 달 →';

  if (!dialogEl.open) {
    dialogEl.showModal();
  }
}

function openQuarterDialog(quarterNum) {
  const report = appState.report;
  if (!report) return;
  const q = report.quarterlyFortunes.find((item) => item.quarter === quarterNum);
  if (!q) return;

  appState.selectedQuarter = quarterNum;
  appState.dialogMode = { type: 'quarter', quarter: quarterNum };

  document.getElementById('dialog-kicker').textContent =
    `${report.targetYear}년 ${q.seasonTitle} · 흐름: ${q.trajectory}`;
  document.getElementById('dialog-title').textContent =
    `${q.label} 종합 운세 — ${q.score}점 (${q.grade.label})`;

  document.getElementById('dialog-body').innerHTML = `
    <div class="dialog-summary-box">
      <p><strong>${q.themeHeadline}</strong></p>
      <p style="margin-top: 0.45rem;">${escapeHtml(q.overview)}</p>
      <div class="tag-row" style="margin-top: 0.65rem;">
        <span class="mini-tag is-positive">최고의 달: ${q.bestMonth.month}월 (${q.bestMonth.pillar}월 · ${q.bestMonth.score}점)</span>
        <span class="mini-tag is-caution">조율할 달: ${q.cautionMonth.month}월 (${q.cautionMonth.pillar}월 · ${q.cautionMonth.score}점)</span>
      </div>
    </div>

    <div class="dialog-domains">
      <div class="domain-box">
        <div class="domain-box-head"><strong>분기 재물운</strong><span>${q.categorySummaries.wealth.score}점</span></div>
        <p>${q.categorySummaries.wealth.summary}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>분기 직업 · 학업운</strong><span>${q.categorySummaries.career.score}점</span></div>
        <p>${q.categorySummaries.career.summary}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>분기 대인 · 애정운</strong><span>${q.categorySummaries.love.score}점</span></div>
        <p>${q.categorySummaries.love.summary}</p>
      </div>
      <div class="domain-box">
        <div class="domain-box-head"><strong>분기 건강 · 컨디션</strong><span>${q.categorySummaries.health.score}점</span></div>
        <p>${q.categorySummaries.health.summary}</p>
      </div>
    </div>

    <div class="dialog-lucky-box">
      <strong>분기 행동 전략</strong>
      <ul class="quarter-strategies">
        ${q.strategies.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
    </div>
  `;

  document.getElementById('dialog-prev-btn').textContent = '← 이전 분기';
  document.getElementById('dialog-next-btn').textContent = '다음 분기 →';

  if (!dialogEl.open) {
    dialogEl.showModal();
  }
}

/* ==========================================================================
   8. App Bootstrap
   ========================================================================== */
function initApp() {
  initThemeController();
  initViewTabs();

  const form = document.getElementById('saju-form');
  const lastNameInput = document.getElementById('last-name');
  const firstNameInput = document.getElementById('first-name');
  const birthDateInput = document.getElementById('birth-date');
  const birthTimeInput = document.getElementById('birth-time');
  const timeUnknownCheckbox = document.getElementById('time-unknown');
  const targetYearSelect = document.getElementById('target-year');
  const resultYearSelect = document.getElementById('result-year-select');
  const globalErrorBox = document.getElementById('form-global-error');

  // Default target year to today's year if within 2024..2030
  const today = getTodayPlainDate();
  if (today.year >= 2024 && today.year <= 2030) {
    targetYearSelect.value = String(today.year);
  }

  const validationBridge = initFormValidationBridge(form);
  const sijinController = initSijinPicker({
    birthTimeInput,
    timeUnknownCheckbox,
  });

  const applyProfileToForm = (profile, shouldSubmit = false) => {
    lastNameInput.value = profile.lastName || '';
    firstNameInput.value = profile.firstName || '';
    birthDateInput.value = profile.birthDate || '';
    timeUnknownCheckbox.checked = Boolean(profile.timeUnknown);
    birthTimeInput.value = profile.timeUnknown ? '' : profile.birthTime || '12:00';

    const calRadio = form.querySelector(`input[name="calendarType"][value="${profile.calendarType || 'solar'}"]`);
    if (calRadio) calRadio.checked = true;

    const genRadio = form.querySelector(`input[name="gender"][value="${profile.gender || 'none'}"]`);
    if (genRadio) genRadio.checked = true;

    if (profile.targetYear) {
      targetYearSelect.value = String(profile.targetYear);
    }

    sijinController.updateUi();
    if (shouldSubmit) {
      form.requestSubmit();
    }
  };

  renderHistoryBar((profile) => applyProfileToForm(profile, true));

  document.getElementById('fill-sample-btn').addEventListener('click', () => {
    applyProfileToForm(
      {
        lastName: '김',
        firstName: '서연',
        birthDate: '1994-05-18',
        birthTime: '14:20',
        timeUnknown: false,
        calendarType: 'solar',
        gender: 'female',
        targetYear: Number(targetYearSelect.value) || 2026,
      },
      true
    );
  });

  // Month Filter chips
  document.querySelectorAll('[data-month-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      appState.monthFilter = chip.dataset.monthFilter;
      document.querySelectorAll('[data-month-filter]').forEach((btn) => {
        btn.classList.toggle('is-active', btn === chip);
      });
      renderMonthlyPanel();
    });
  });

  // Dialog prev / next navigation
  document.getElementById('dialog-prev-btn').addEventListener('click', () => {
    if (!appState.dialogMode) return;
    if (appState.dialogMode.type === 'month') {
      const prev = appState.dialogMode.month === 1 ? 12 : appState.dialogMode.month - 1;
      openMonthDialog(prev);
    } else {
      const prev = appState.dialogMode.quarter === 1 ? 4 : appState.dialogMode.quarter - 1;
      openQuarterDialog(prev);
    }
  });

  document.getElementById('dialog-next-btn').addEventListener('click', () => {
    if (!appState.dialogMode) return;
    if (appState.dialogMode.type === 'month') {
      const next = appState.dialogMode.month === 12 ? 1 : appState.dialogMode.month + 1;
      openMonthDialog(next);
    } else {
      const next = appState.dialogMode.quarter === 4 ? 1 : appState.dialogMode.quarter + 1;
      openQuarterDialog(next);
    }
  });

  const runCalculation = (scrollToResults = true) => {
    globalErrorBox.hidden = true;
    globalErrorBox.textContent = '';

    const formData = new FormData(form);
    const payload = {
      lastName: String(formData.get('lastName') || '').trim(),
      firstName: String(formData.get('firstName') || '').trim(),
      birthDate: String(formData.get('birthDate') || ''),
      birthTime: timeUnknownCheckbox.checked ? '12:00' : String(formData.get('birthTime') || ''),
      timeUnknown: timeUnknownCheckbox.checked,
      calendarType: String(formData.get('calendarType') || 'solar'),
      gender: String(formData.get('gender') || 'none'),
      targetYear: Number(formData.get('targetYear') || 2026),
    };

    try {
      const report = generateSajuReport(payload);
      renderReport(report);
      saveToHistory(payload);
      renderHistoryBar((profile) => applyProfileToForm(profile, true));

      if (scrollToResults) {
        document.getElementById('results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      globalErrorBox.textContent = err instanceof Error ? err.message : '사주 계산 중 오류가 발생했습니다.';
      globalErrorBox.hidden = false;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    globalErrorBox.hidden = true;

    // Trim whitespace-only checks without losing user comfort
    lastNameInput.value = lastNameInput.value.trim();
    firstNameInput.value = firstNameInput.value.trim();

    validationBridge.syncOnSubmit();
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    runCalculation(true);
  });

  form.addEventListener('reset', () => {
    globalErrorBox.hidden = true;
    setTimeout(() => {
      sijinController.updateUi();
    }, 0);
  });

  resultYearSelect.addEventListener('change', () => {
    targetYearSelect.value = resultYearSelect.value;
    if (appState.report) {
      runCalculation(false);
    }
  });
}

if (typeof document !== 'undefined') {
  initApp();
}
