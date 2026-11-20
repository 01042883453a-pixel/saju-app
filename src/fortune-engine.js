/**
 * Monthly (12개월) & Quarterly (4분기) Saju Fortune Engine.
 * Synthesizes quarterly fortunes strictly from their 3 constituent monthly calculations
 * so scores, best/caution months, and strategic guidance remain 100% consistent.
 */

import { parsePlainDate, parsePlainTime, solarToLunar, lunarToSolar, formatIsoDate } from './date-utils.js';
import { calculateFourPillars, getYearPillar, getYearMonthlyPillars } from './manseryeok.js';
import {
  ELEMENTS,
  ELEMENT_GENERATED_BY,
  getTenGod,
  getBranchMainStem,
  getTwelveStage,
  analyzeBranchRelations,
  analyzeNatalChart,
  analyzeNameElements,
} from './saju-analyzer.js';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function scoreToGrade(score) {
  if (score >= 84) return { label: '대길', hanja: '大吉', tier: 'great' };
  if (score >= 74) return { label: '길', hanja: '吉', tier: 'good' };
  if (score >= 64) return { label: '평길', hanja: '平吉', tier: 'steady' };
  return { label: '신중', hanja: '愼重', tier: 'caution' };
}

const TEN_GOD_MONTH_THEMES = {
  비견: {
    keyword: '주체성 · 동반자',
    headline: '자기 페이스를 되찾고 동료와 어깨를 나란히 하는 달',
    wealthAdvice: '공동 프로젝트나 협업에서 몫을 분명히 나누면 안정적인 수입이 따릅니다.',
    careerAdvice: '독립적인 업무 영역이 넓어지며, 비슷한 목표를 가진 동료와 시너지가 커집니다.',
    loveAdvice: '서로의 영역을 존중하는 편안한 교류가 이어지며, 솔직한 대화가 신뢰를 쌓습니다.',
  },
  겁재: {
    keyword: '돌파 · 경쟁력',
    headline: '경쟁 속에서 승부수를 던져 존재감을 각인시키는 달',
    wealthAdvice: '충동 지출이나 보증·투자 권유는 경계하고 현금 흐름을 단단히 묶어두세요.',
    careerAdvice: '치열한 경쟁 구도에서 과감한 실행력이 빛나며, 새로운 시장이나 역할을 선점하기 좋습니다.',
    loveAdvice: '자존심 싸움보다 한 걸음 먼저 배려하면 불필요한 오해가 빠르게 풀립니다.',
  },
  식신: {
    keyword: '풍요 · 전문성',
    headline: '꾸준히 쌓아온 실력이 알찬 결실과 여유로 이어지는 달',
    wealthAdvice: '생산성과 부가가치가 높아져 실속 있는 수익 증가와 의외의 복록이 기대됩니다.',
    careerAdvice: '콘텐츠, 기획, 기술 등 본인의 전문 영역에서 완성도 높은 결과물을 내놓기 좋습니다.',
    loveAdvice: '따뜻하고 다정한 분위기가 살아나며, 함께 식사하고 취미를 나누는 자리에서 인연이 깊어집니다.',
  },
  상관: {
    keyword: '창의 · 변혁',
    headline: '틀을 깨는 발상과 유려한 언변으로 새 길을 여는 달',
    wealthAdvice: '아이디어와 재능을 활용한 부수입·기획 수익은 좋으나 계약 문구 점검은 필수입니다.',
    careerAdvice: '프레젠테이션, 마케팅, 개선 프로젝트에서 돋보이되 윗사람과의 화법은 부드럽게 조율하세요.',
    loveAdvice: '솔직한 매력으로 시선을 끌기 좋지만, 날카로운 말 한마디가 서운함을 남기지 않도록 유의하세요.',
  },
  편재: {
    keyword: '기회 · 확장',
    headline: '활동 반경이 넓어지며 큰 물줄기의 재물 기회가 스치는 달',
    wealthAdvice: '영업, 거래, 자산 운용에서 활발한 흐름이 열리니 회전율과 손절 기준을 함께 정해두세요.',
    careerAdvice: '대외 미팅, 출장, 신규 거래처 개척 등 바쁘게 움직일수록 값진 인맥과 성과가 따라옵니다.',
    loveAdvice: '사교 모임이나 이동 중에 유쾌한 인연을 만나기 쉽고, 이벤트가 관계를 환기해 줍니다.',
  },
  정재: {
    keyword: '안정 · 결실',
    headline: '성실한 노력이 정직한 보상과 탄탄한 자산으로 모이는 달',
    wealthAdvice: '고정 수입과 저축·적립식 자산 관리에 매우 유리하며, 꼼꼼한 예산 운용이 빛을 발합니다.',
    careerAdvice: '마감 준수와 실무 완성도로 신뢰를 얻어, 실속 있는 평가와 책임 있는 자리가 주어집니다.',
    loveAdvice: '현실적이고 진중한 만남이 이어지며, 미래를 함께 설계하는 안정적인 대화가 잘 풀립니다.',
  },
  편관: {
    keyword: '책임 · 돌파',
    headline: '묵직한 과제를 맡아 단단한 역량을 증명하고 위상을 높이는 달',
    wealthAdvice: '단기 수익보다 평판과 직결된 거래를 택하세요. 과도한 레버리지나 무리한 확장은 피하는 편이 좋습니다.',
    careerAdvice: '긴장감 있는 프로젝트나 중요한 결정을 주도하게 되며, 완수 시 큰 도약의 발판이 됩니다.',
    loveAdvice: '바쁜 일정으로 소홀해지기 쉬우니 짧은 안부라도 꾸준히 전하며 온기를 지켜가세요.',
  },
  정관: {
    keyword: '명예 · 질서',
    headline: '원칙과 신뢰를 바탕으로 인정받고 자리가 반듯해지는 달',
    wealthAdvice: '규칙적인 소득과 제도권 내 금융·계약이 순조로우며, 장기적인 신용도가 올라갑니다.',
    careerAdvice: '승진, 합격, 공공·대외 평가 등에서 긍정적인 소식이 기대되며 공식적인 책임이 커집니다.',
    loveAdvice: '예의와 품격을 갖춘 진중한 인연이 찾아오거나, 관계가 한 단계 더 안정적으로 자리 잡습니다.',
  },
  편인: {
    keyword: '통찰 · 독창',
    headline: '남다른 직관과 깊은 사유로 남들이 못 보는 해법을 찾는 달',
    wealthAdvice: '즉각적인 현금보다 지식·자격·지적 재산에 투자하면 하반기 이후 큰 값어치로 돌아옵니다.',
    careerAdvice: '연구, 기획, 전략 수립, 디자인 등 깊이 있는 몰입이 필요한 과업에서 탁월한 성과를 냅니다.',
    loveAdvice: '속마음을 겉으로 잘 드러내지 않아 거리가 느껴질 수 있으니 작은 감정이라도 말로 표현해 보세요.',
  },
  정인: {
    keyword: '귀인 · 학업',
    headline: '주변의 따뜻한 지원과 배움 속에서 기반이 단단해지는 달',
    wealthAdvice: '문서·계약·부동산 관련 검토에 유리하며, 조언자의 도움을 받아 실수를 줄일 수 있습니다.',
    careerAdvice: '자격 취득, 교육, 멘토링의 덕이 크고, 윗사람이나 선배의 추천으로 좋은 기회를 잡기 쉽습니다.',
    loveAdvice: '포근하고 배려 깊은 보살핌 속에서 마음이 편안해지며, 가족·가까운 지인의 응원도 따릅니다.',
  },
};

const SEASON_METADATA = [
  { quarter: 1, label: '1분기 (1월~3월)', seasonTitle: '해빙과 입춘의 개시 · 봄의 설계', monthsRange: '1~3월' },
  { quarter: 2, label: '2분기 (4월~6월)', seasonTitle: '만개와 확장의 여름 초입 · 도약기', monthsRange: '4~6월' },
  { quarter: 3, label: '3분기 (7월~9월)', seasonTitle: '결실과 정련의 가을 전환 · 수확기', monthsRange: '7~9월' },
  { quarter: 4, label: '4분기 (10월~12월)', seasonTitle: '갈무리와 내실의 겨울 초입 · 비축기', monthsRange: '10~12월' },
];

function computeMonthlyScores({ monthInfo, natal, yearFortune, nameAnalysis }) {
  const dayStemIdx = natal.pillars.day.stemIndex;
  const stemTenGod = getTenGod(dayStemIdx, monthInfo.pillar.stem.element, monthInfo.pillar.stem.yinYang);
  const mainBranchStem = getBranchMainStem(monthInfo.pillar.branch);
  const branchTenGod = getTenGod(dayStemIdx, mainBranchStem.element, mainBranchStem.yinYang);
  const twelveStage = getTwelveStage(dayStemIdx, monthInfo.pillar.branchIndex);

  const natalBranches = {
    year: natal.pillars.year.branch,
    month: natal.pillars.month.branch,
    day: natal.pillars.day.branch,
    hour: natal.pillars.hour ? natal.pillars.hour.branch : null,
  };
  const relations = analyzeBranchRelations(monthInfo.pillar.branchIndex, natalBranches);

  let base = 68;

  // 1. 용신 / 희신 / 기신 alignment
  if (monthInfo.pillar.stem.element === natal.yongsin) base += 8;
  else if (monthInfo.pillar.stem.element === natal.heesin) base += 5;
  else if (monthInfo.pillar.stem.element === natal.gisin) base -= 6;

  if (mainBranchStem.element === natal.yongsin) base += 10;
  else if (mainBranchStem.element === natal.heesin) base += 5;
  else if (mainBranchStem.element === natal.gisin) base -= 8;

  // 2. Branch interactions
  let relationWealthDelta = 0;
  let relationCareerDelta = 0;
  let relationLoveDelta = 0;
  let relationHealthDelta = 0;

  for (const rel of relations) {
    if (rel.valence === 'positive') {
      base += rel.slot === 'day' ? 7 : 5;
      relationLoveDelta += rel.slot === 'day' ? 6 : 3;
      relationCareerDelta += 3;
      relationWealthDelta += 2;
    } else if (rel.type === '충') {
      base -= rel.slot === 'day' ? 8 : 6;
      relationHealthDelta -= 6;
      relationLoveDelta -= rel.slot === 'day' ? 5 : 2;
      relationCareerDelta += 1; // movement / change stimulus
    } else {
      base -= 4;
      relationHealthDelta -= 4;
      relationLoveDelta -= 2;
    }
  }

  // 3. Twelve Stage (12운성)
  base += twelveStage.scoreDelta;

  // 4. Annual Seun (세운) resonance with monthly pillar
  if (monthInfo.pillar.stem.element === yearFortune.pillar.stem.element && monthInfo.pillar.stem.element === natal.yongsin) {
    base += 2;
  }
  if (monthInfo.pillar.branchIndex === yearFortune.pillar.branchIndex) {
    base += mainBranchStem.element === natal.yongsin ? 2 : -2;
  }
  if (nameAnalysis.complementsYongsin && mainBranchStem.element === natal.yongsin) {
    base += 1;
  }

  // 5. Domain-specific modifiers from Ten Gods (천간 45% + 지지 55% feel)
  const tenGodBoost = (tg, map) => map[tg.group] ?? 0;

  const wealthDelta =
    tenGodBoost(branchTenGod, { 재성: 8, 식상: 5, 인성: 2, 비겁: -3, 관성: 1 }) +
    tenGodBoost(stemTenGod, { 재성: 5, 식상: 3, 비겁: -2 }) +
    relationWealthDelta;

  const careerDelta =
    tenGodBoost(branchTenGod, { 관성: 8, 인성: 5, 식상: 3, 비겁: 2, 재성: 2 }) +
    tenGodBoost(stemTenGod, { 관성: 5, 인성: 3, 식상: 2 }) +
    relationCareerDelta;

  const loveDelta =
    tenGodBoost(branchTenGod, { 재성: 4, 관성: 4, 식상: 3, 인성: 2, 비겁: -1 }) +
    (twelveStage.name === '목욕' ? 4 : 0) +
    relationLoveDelta;

  const healthDelta =
    (mainBranchStem.element === natal.yongsin ? 6 : mainBranchStem.element === natal.gisin ? -5 : 1) +
    (twelveStage.scoreDelta >= 3 ? 4 : twelveStage.scoreDelta <= -3 ? -4 : 0) +
    relationHealthDelta;

  const wealth = clamp(base + wealthDelta, 48, 96);
  const career = clamp(base + careerDelta, 48, 96);
  const love = clamp(base + loveDelta, 48, 96);
  const health = clamp(base + healthDelta, 48, 96);

  const totalScore = clamp(wealth * 0.27 + career * 0.28 + love * 0.23 + health * 0.22, 48, 96);

  return {
    stemTenGod,
    branchTenGod,
    twelveStage,
    relations,
    scores: {
      total: totalScore,
      wealth,
      career,
      love,
      health,
    },
  };
}

function buildHealthAdvice(mainBranchElement, natal, relations, twelveStage) {
  const cautionHit = relations.some((r) => r.valence === 'caution');
  const yongsinInfo = ELEMENTS[natal.yongsin];
  const monthElInfo = ELEMENTS[mainBranchElement];

  if (cautionHit) {
    return `지지 변동수가 있는 달이므로 ${monthElInfo.organ} 컨디션을 세심히 살피세요. 무리한 야근보다 충분한 수면과 가벼운 스트레칭으로 리듬을 지키는 편이 좋습니다.`;
  }
  if (twelveStage.scoreDelta <= -2) {
    return `체력을 아끼며 내실을 다져야 하는 시기입니다. ${yongsinInfo.label} 기운을 보충하는 식습관과 산책으로 ${yongsinInfo.organ}의 균형을 챙겨 보세요.`;
  }
  return `전반적인 활력이 안정적입니다. ${monthElInfo.organ}에 부담이 가지 않도록 규칙적인 수분 섭취와 주 2~3회 유산소 루틴을 이어가면 최상의 컨디션을 유지할 수 있습니다.`;
}

function buildMonthlyCopy({ fullName, monthInfo, natal, analysis, targetYear }) {
  const { stemTenGod, branchTenGod, twelveStage, relations, scores } = analysis;
  const primaryTheme = TEN_GOD_MONTH_THEMES[branchTenGod.name];
  const stemTheme = TEN_GOD_MONTH_THEMES[stemTenGod.name];
  const mainBranchEl = getBranchMainStem(monthInfo.pillar.branch).element;
  const isYongsinMonth =
    monthInfo.pillar.stem.element === natal.yongsin || mainBranchEl === natal.yongsin;
  const isHeesinMonth =
    monthInfo.pillar.stem.element === natal.heesin || mainBranchEl === natal.heesin;
  const positiveRel = relations.find((r) => r.valence === 'positive');
  const cautionRel = relations.find((r) => r.valence === 'caution');

  let overviewParts = [];
  overviewParts.push(
    `${targetYear}년 ${monthInfo.calendarMonth}월(${monthInfo.pillar.hangul}월 · ${monthInfo.pillar.hanja})은 ${fullName} 님의 원국에서 천간 ${stemTenGod.name}과 지지 ${branchTenGod.name}, 12운성 '${twelveStage.name}(${twelveStage.hanja})'이 함께 흐르는 시기입니다.`
  );

  if (isYongsinMonth) {
    overviewParts.push(
      `특히 ${fullName} 님에게 가장 필요한 용신(${ELEMENTS[natal.yongsin].label}) 기운이 월운에 강하게 들어와 막혔던 일이 순조롭게 풀리고 조력자가 모이기 좋습니다.`
    );
  } else if (isHeesinMonth) {
    overviewParts.push(
      `원국을 돕는 희신(${ELEMENTS[natal.heesin].label})의 기운이 바탕에 깔려 있어 안정감 속에 점진적인 성과를 거둘 수 있습니다.`
    );
  } else {
    overviewParts.push(
      `${twelveStage.meaning}을 참고해 속도를 조절하면 헛된 소모 없이 원하는 바를 챙길 수 있습니다.`
    );
  }

  if (positiveRel) {
    overviewParts.push(positiveRel.description);
  }
  if (cautionRel) {
    overviewParts.push(cautionRel.description);
  }

  const luckyEl = isYongsinMonth
    ? ELEMENTS[natal.yongsin]
    : ELEMENTS[ELEMENT_GENERATED_BY[natal.yongsin]] || ELEMENTS[natal.yongsin];
  const luckyColor = luckyEl.luckyColors[(monthInfo.calendarMonth - 1) % luckyEl.luckyColors.length];
  const luckyNumber = luckyEl.luckyNumbers[(monthInfo.calendarMonth - 1) % luckyEl.luckyNumbers.length];

  const actionTip = cautionRel
    ? `변동이 큰 결정은 ${monthInfo.solarTermName} 절입 직후 3~4일 여유를 두고 진행하면 실수를 줄일 수 있습니다.`
    : isYongsinMonth
      ? `새로운 제안·지원·계약을 미루지 말고 적극적으로 실행에 옮기면 기대 이상의 호응을 얻습니다.`
      : `${stemTheme.keyword.split(' · ')[0]}의 강점을 살려 월초에 우선순위 3가지를 정해 차분히 완수해 보세요.`;

  const keywords = [
    primaryTheme.keyword.split(' · ')[0],
    twelveStage.name,
    isYongsinMonth ? `용신 ${ELEMENTS[natal.yongsin].key} 도약` : stemTenGod.name,
  ];

  return {
    headline: primaryTheme.headline,
    keywords,
    overview: overviewParts.join(' '),
    categories: {
      wealth: {
        score: scores.wealth,
        advice: primaryTheme.wealthAdvice,
      },
      career: {
        score: scores.career,
        advice: primaryTheme.careerAdvice,
      },
      love: {
        score: scores.love,
        advice: primaryTheme.loveAdvice,
      },
      health: {
        score: scores.health,
        advice: buildHealthAdvice(mainBranchEl, natal, relations, twelveStage),
      },
    },
    lucky: {
      color: luckyColor,
      direction: luckyEl.direction,
      number: luckyNumber,
      actionTip,
    },
  };
}

function buildQuarterSynthesis(meta, months, fullName, natal, targetYear) {
  const [m1, m2, m3] = months;

  const avg = (getter) => Math.round((getter(m1) + getter(m2) + getter(m3)) / 3);

  const totalScore = avg((m) => m.score);
  const wealthScore = avg((m) => m.categories.wealth.score);
  const careerScore = avg((m) => m.categories.career.score);
  const loveScore = avg((m) => m.categories.love.score);
  const healthScore = avg((m) => m.categories.health.score);

  const sortedByScore = [...months].sort((a, b) => b.score - a.score);
  const bestMonth = sortedByScore[0];
  const cautionMonth = sortedByScore[sortedByScore.length - 1];

  const diffEndStart = m3.score - m1.score;
  let trajectory;
  if (diffEndStart >= 6) {
    trajectory = '상승세';
  } else if (m2.score < m1.score && m3.score > m2.score && m3.score >= m1.score) {
    trajectory = '후반 반등';
  } else if (diffEndStart <= -6) {
    trajectory = '초반 강세';
  } else if (Math.max(m1.score, m2.score, m3.score) - Math.min(m1.score, m2.score, m3.score) <= 5) {
    trajectory = '안정 흐름';
  } else {
    trajectory = '내실 조정';
  }

  const grade = scoreToGrade(totalScore);
  const yongsinLabel = ELEMENTS[natal.yongsin].label;

  const domainPairs = [
    { key: 'wealth', label: '재물운', score: wealthScore },
    { key: 'career', label: '직업·학업운', score: careerScore },
    { key: 'love', label: '대인·애정운', score: loveScore },
    { key: 'health', label: '건강운', score: healthScore },
  ];
  const strongestDomain = [...domainPairs].sort((a, b) => b.score - a.score)[0];

  const themeHeadline = `${meta.seasonTitle.split(' · ')[0]} · ${bestMonth.month}월 중심 ${strongestDomain.label} 도약기`;

  const overview =
    `${targetYear}년 ${meta.label}은 ${m1.pillar.hangul}·${m2.pillar.hangul}·${m3.pillar.hangul}월이 이어지며 전반적으로 '${trajectory}' 곡선을 그립니다. ` +
    `${fullName} 님의 분기 평균 운세 지수는 ${totalScore}점(${grade.label})이며, 특히 ${bestMonth.month}월(${bestMonth.score}점)에 ${bestMonth.branchTenGod.name}·${bestMonth.twelveStage.name}의 기세가 가장 높게 열립니다. ` +
    `${cautionMonth.month}월(${cautionMonth.score}점)에는 무리한 확장보다 속도 조절에 힘쓰고, ${yongsinLabel} 기운을 일상에 배치하면 분기 전체의 성과가 한층 탄탄해집니다.`;

  const strategies = [
    `핵심 승부처: ${bestMonth.month}월(${bestMonth.pillar.hangul}월)에 중요한 제안·계약·실행 일정을 배치하세요.`,
    `리스크 관리: ${cautionMonth.month}월(${cautionMonth.pillar.hangul}월)에는 지출 상한선과 건강 휴식 루틴을 미리 확보하세요.`,
    `오행 보완: 용신인 ${yongsinLabel}의 방위(${ELEMENTS[natal.yongsin].direction})와 컬러(${ELEMENTS[natal.yongsin].luckyColors[0]})를 활용하면 분기 흐름이 안정됩니다.`,
  ];

  return {
    quarter: meta.quarter,
    label: meta.label,
    monthsRange: meta.monthsRange,
    seasonTitle: meta.seasonTitle,
    themeHeadline,
    score: totalScore,
    grade,
    trajectory,
    bestMonth: {
      month: bestMonth.month,
      score: bestMonth.score,
      pillar: bestMonth.pillar.hangul,
    },
    cautionMonth: {
      month: cautionMonth.month,
      score: cautionMonth.score,
      pillar: cautionMonth.pillar.hangul,
    },
    overview,
    strategies,
    categorySummaries: {
      wealth: {
        score: wealthScore,
        summary: `${bestMonth.month}월을 전후로 수익과 기회 포착이 유리하며, ${cautionMonth.month}월에는 고정비 점검이 실속을 지킵니다.`,
      },
      career: {
        score: careerScore,
        summary: `${m1.branchTenGod.name}에서 ${m3.branchTenGod.name}으로 이어지는 흐름 속에서 ${strongestDomain.key === 'career' ? '주도권과 평가가 크게 오르는 분기입니다.' : '차분히 실적을 누적하기 좋은 분기입니다.'}`,
      },
      love: {
        score: loveScore,
        summary: `${months.some((m) => m.relations.some((r) => r.valence === 'positive')) ? '원국과의 합(合) 기운이 작용해 인연운과 협업의 온기가 따뜻합니다.' : '서로의 일정과 감정을 배려하는 꾸준한 소통이 관계를 단단히 지켜줍니다.'}`,
      },
      health: {
        score: healthScore,
        summary: `${ELEMENTS[natal.yongsin].organ} 관리와 함께 계절 변화에 맞춘 수면·운동 리듬을 유지하는 것이 핵심입니다.`,
      },
    },
    months,
  };
}

/**
 * Generate the complete Saju report including Natal Chart, Name Elements,
 * 12 Monthly Fortunes, and 4 Quarterly Fortunes.
 */
export function generateSajuReport({
  lastName,
  firstName,
  birthDate,
  birthTime = '12:00',
  timeUnknown = false,
  calendarType = 'solar',
  gender = 'none',
  targetYear = 2026,
}) {
  const cleanLast = String(lastName || '').trim();
  const cleanFirst = String(firstName || '').trim();
  if (!cleanLast || !cleanFirst) {
    throw new Error('성과 이름을 모두 입력해 주세요.');
  }

  const parsedInputDate = parsePlainDate(birthDate);
  const parsedTime = timeUnknown ? null : parsePlainTime(birthTime);

  let solarDate;
  let lunarDate;

  if (calendarType === 'lunar' || calendarType === 'lunar-leap') {
    const isLeap = calendarType === 'lunar-leap';
    const converted = lunarToSolar(parsedInputDate.year, parsedInputDate.month, parsedInputDate.day, isLeap);
    solarDate = {
      ...converted,
      iso: formatIsoDate(converted.year, converted.month, converted.day),
    };
    lunarDate = {
      year: parsedInputDate.year,
      month: parsedInputDate.month,
      day: parsedInputDate.day,
      isLeap,
    };
  } else {
    solarDate = {
      year: parsedInputDate.year,
      month: parsedInputDate.month,
      day: parsedInputDate.day,
      iso: parsedInputDate.toString(),
    };
    lunarDate = solarToLunar(solarDate.year, solarDate.month, solarDate.day);
  }

  const fourPillars = calculateFourPillars({
    year: solarDate.year,
    month: solarDate.month,
    day: solarDate.day,
    hour: parsedTime ? parsedTime.hour : 12,
    minute: parsedTime ? parsedTime.minute : 0,
    timeUnknown: Boolean(timeUnknown),
  });

  const natal = analyzeNatalChart(fourPillars);
  const fullName = `${cleanLast}${cleanFirst}`;
  const nameAnalysis = analyzeNameElements(cleanLast, cleanFirst, natal);

  const yearNum = Number(targetYear);
  const yearPillar = getYearPillar(yearNum);
  const yearDayStemIdx = natal.pillars.day.stemIndex;
  const yearStemTenGod = getTenGod(yearDayStemIdx, yearPillar.stem.element, yearPillar.stem.yinYang);
  const yearBranchMain = getBranchMainStem(yearPillar.branch);
  const yearBranchTenGod = getTenGod(yearDayStemIdx, yearBranchMain.element, yearBranchMain.yinYang);
  const yearTwelveStage = getTwelveStage(yearDayStemIdx, yearPillar.branchIndex);

  const yearFortune = {
    year: yearNum,
    pillar: yearPillar,
    stemTenGod: yearStemTenGod,
    branchTenGod: yearBranchTenGod,
    twelveStage: yearTwelveStage,
    isYongsinYear:
      yearPillar.stem.element === natal.yongsin || yearBranchMain.element === natal.yongsin,
  };

  const monthlyPillars = getYearMonthlyPillars(yearNum);

  const monthlyFortunes = monthlyPillars.map((monthInfo) => {
    const calc = computeMonthlyScores({
      monthInfo,
      natal,
      yearFortune,
      nameAnalysis,
    });
    const grade = scoreToGrade(calc.scores.total);
    const copy = buildMonthlyCopy({
      fullName,
      monthInfo,
      natal,
      analysis: calc,
      targetYear: yearNum,
    });

    return {
      month: monthInfo.calendarMonth,
      quarter: monthInfo.quarter,
      pillar: monthInfo.pillar,
      solarTermName: monthInfo.solarTermName,
      solarTermHanja: monthInfo.solarTermHanja,
      termRangeText: monthInfo.termRangeText,
      stemTenGod: calc.stemTenGod,
      branchTenGod: calc.branchTenGod,
      twelveStage: calc.twelveStage,
      relations: calc.relations,
      score: calc.scores.total,
      grade,
      ...copy,
    };
  });

  const quarterlyFortunes = SEASON_METADATA.map((meta) => {
    const qMonths = monthlyFortunes.filter((m) => m.quarter === meta.quarter);
    return buildQuarterSynthesis(meta, qMonths, fullName, natal, yearNum);
  });

  const avgScore = Math.round(
    monthlyFortunes.reduce((acc, m) => acc + m.score, 0) / monthlyFortunes.length
  );
  const sortedMonths = [...monthlyFortunes].sort((a, b) => b.score - a.score);
  const sortedQuarters = [...quarterlyFortunes].sort((a, b) => b.score - a.score);

  const annualSummary = {
    averageScore: avgScore,
    grade: scoreToGrade(avgScore),
    bestMonth: sortedMonths[0],
    cautionMonth: sortedMonths[sortedMonths.length - 1],
    bestQuarter: sortedQuarters[0],
    yearPillar,
    yearHeadline: `${yearNum}년(${yearPillar.hangul}년 · ${yearPillar.hanja}) ${yearStemTenGod.name}·${yearBranchTenGod.name}의 해`,
  };

  return {
    person: {
      lastName: cleanLast,
      firstName: cleanFirst,
      fullName,
      gender,
      calendarType,
      inputBirthDate: parsedInputDate.toString(),
      birthTime: parsedTime ? parsedTime.toString() : null,
      timeUnknown: Boolean(timeUnknown),
      solarDate,
      lunarDate,
    },
    targetYear: yearNum,
    fourPillars,
    natal,
    nameAnalysis,
    yearFortune,
    annualSummary,
    monthlyFortunes,
    quarterlyFortunes,
  };
}
