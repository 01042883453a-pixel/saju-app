/**
 * Classical Korean Saju (명리학) Analyzer & Hangul Name Element (성명 음령오행) Engine.
 */

import { HEAVENLY_STEMS } from './manseryeok.js';

export const ELEMENT_KEYS = ['목', '화', '토', '금', '수'];

export const ELEMENTS = {
  목: {
    key: '목',
    hanja: '木',
    label: '목(木)',
    token: 'wood',
    season: '봄',
    direction: '동쪽',
    luckyColors: ['청록색', '에메랄드 그린', '연두색'],
    luckyNumbers: [3, 8],
    organ: '간 · 담 · 신경계',
    keywords: ['성장', '기획', '창의', '추진'],
  },
  화: {
    key: '화',
    hanja: '火',
    label: '화(火)',
    token: 'fire',
    season: '여름',
    direction: '남쪽',
    luckyColors: ['주홍색', '산호빛', '버건디'],
    luckyNumbers: [2, 7],
    organ: '심장 · 혈액순환 · 시력',
    keywords: ['열정', '표현', '확장', '명예'],
  },
  토: {
    key: '토',
    hanja: '土',
    label: '토(土)',
    token: 'earth',
    season: '환절기',
    direction: '중앙 · 남서쪽',
    luckyColors: ['황토색', '베이지', '카멜 브라운'],
    luckyNumbers: [5, 10],
    organ: '위장 · 소화기 · 비장',
    keywords: ['신뢰', '중재', '안정', '기반'],
  },
  금: {
    key: '금',
    hanja: '金',
    label: '금(金)',
    token: 'metal',
    season: '가을',
    direction: '서쪽',
    luckyColors: ['아이보리', '실버', '슬레이트 그레이'],
    luckyNumbers: [4, 9],
    organ: '폐 · 호흡기 · 피부',
    keywords: ['결단', '원칙', '수확', '정교'],
  },
  수: {
    key: '수',
    hanja: '水',
    label: '수(水)',
    token: 'water',
    season: '겨울',
    direction: '북쪽',
    luckyColors: ['쪽빛 네이비', '먹색', '딥 블루'],
    luckyNumbers: [1, 6],
    organ: '신장 · 방광 · 순환계',
    keywords: ['지혜', '유연', '통찰', '저장'],
  },
};

export const ELEMENT_GENERATES = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

export const ELEMENT_GENERATED_BY = {
  목: '수',
  화: '목',
  토: '화',
  금: '토',
  수: '금',
};

export const ELEMENT_CONTROLS = {
  목: '토',
  화: '금',
  토: '수',
  금: '목',
  수: '화',
};

export const ELEMENT_CONTROLLED_BY = {
  목: '금',
  화: '수',
  토: '목',
  금: '화',
  수: '토',
};

const TEN_GOD_INFO = {
  비견: { name: '비견', hanja: '比肩', group: '비겁', shortMeaning: '주체성 · 동등한 협력' },
  겁재: { name: '겁재', hanja: '劫財', group: '비겁', shortMeaning: '경쟁 돌파 · 도전 의지' },
  식신: { name: '식신', hanja: '食神', group: '식상', shortMeaning: '풍요로운 생산 · 전문성' },
  상관: { name: '상관', hanja: '傷官', group: '식상', shortMeaning: '재기발랄한 표현 · 변화' },
  편재: { name: '편재', hanja: '偏財', group: '재성', shortMeaning: '유동 재물 · 넓은 시야' },
  정재: { name: '정재', hanja: '正財', group: '재성', shortMeaning: '안정 수익 · 성실한 결실' },
  편관: { name: '편관', hanja: '偏官', group: '관성', shortMeaning: '강한 추진 · 책임 압박' },
  정관: { name: '정관', hanja: '正官', group: '관성', shortMeaning: '명예 · 질서와 승진' },
  편인: { name: '편인', hanja: '偏印', group: '인성', shortMeaning: '독창적 직관 · 연구 몰입' },
  정인: { name: '정인', hanja: '正印', group: '인성', shortMeaning: '학업 성취 · 귀인의 도움' },
};

/**
 * Derive Ten God (십성) relative to Day Stem (일간).
 */
export function getTenGod(dayStemIndex, targetElement, targetYinYang) {
  const dayStem = HEAVENLY_STEMS[dayStemIndex];
  const dayEl = dayStem.element;
  const samePolarity = dayStem.yinYang === targetYinYang;

  if (targetElement === dayEl) {
    return samePolarity ? TEN_GOD_INFO.비견 : TEN_GOD_INFO.겁재;
  }
  if (ELEMENT_GENERATES[dayEl] === targetElement) {
    return samePolarity ? TEN_GOD_INFO.식신 : TEN_GOD_INFO.상관;
  }
  if (ELEMENT_CONTROLS[dayEl] === targetElement) {
    return samePolarity ? TEN_GOD_INFO.편재 : TEN_GOD_INFO.정재;
  }
  if (ELEMENT_CONTROLS[targetElement] === dayEl) {
    return samePolarity ? TEN_GOD_INFO.편관 : TEN_GOD_INFO.정관;
  }
  return samePolarity ? TEN_GOD_INFO.편인 : TEN_GOD_INFO.정인;
}

export function getBranchMainStem(branch) {
  const hidden = branch.hiddenStems;
  return HEAVENLY_STEMS[hidden[hidden.length - 1]];
}

const TWELVE_STAGES = [
  { name: '장생', hanja: '長生', energyLevel: '상승', scoreDelta: 4, meaning: '새로운 기운이 싹트고 귀인의 도움으로 시작하는 흐름' },
  { name: '목욕', hanja: '沐浴', energyLevel: '변동', scoreDelta: 0, meaning: '매력과 주목도가 높아지나 감정 기복을 다스려야 하는 시기' },
  { name: '관대', hanja: '冠帶', energyLevel: '성장', scoreDelta: 4, meaning: '자격과 직위를 갖추고 자신감 있게 무대에 오르는 때' },
  { name: '건록', hanja: '建祿', energyLevel: '왕성', scoreDelta: 5, meaning: '스스로의 실력으로 탄탄한 기반과 결실을 쌓는 흐름' },
  { name: '제왕', hanja: '帝旺', energyLevel: '정점', scoreDelta: 5, meaning: '기세가 정점에 달해 주도권을 쥐지만 겸손이 필요한 때' },
  { name: '쇠', hanja: '衰', energyLevel: '원숙', scoreDelta: 1, meaning: '무리한 확장보다 노련함과 경험으로 실속을 챙기는 시기' },
  { name: '병', hanja: '病', energyLevel: '휴식', scoreDelta: -3, meaning: '몸과 마음의 피로를 살피고 기획과 구상에 집중할 때' },
  { name: '사', hanja: '死', energyLevel: '집중', scoreDelta: -4, meaning: '외부 활동보다 내면의 정리와 깊이 있는 사유가 유리한 시기' },
  { name: '묘', hanja: '墓', energyLevel: '저장', scoreDelta: -1, meaning: '에너지를 비축하고 자산을 안전하게 갈무리하는 흐름' },
  { name: '절', hanja: '絕', energyLevel: '전환', scoreDelta: -4, meaning: '묵은 흐름을 끊고 새로운 전환점을 준비하는 변곡점' },
  { name: '태', hanja: '胎', energyLevel: '잉태', scoreDelta: 1, meaning: '새로운 아이디어와 계획이 조용히 자리 잡는 출발선' },
  { name: '양', hanja: '養', energyLevel: '안정', scoreDelta: 2, meaning: '차분하게 실력을 기르며 다음 도약을 보살피는 시기' },
];

// 장생 branch index for stems 0..9 (갑..계)
const JANGSAENG_START_BRANCH = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

/**
 * Derive 12 Unseong (십이운성) for a given Day Stem & Earthly Branch.
 */
export function getTwelveStage(dayStemIndex, branchIndex) {
  const start = JANGSAENG_START_BRANCH[dayStemIndex];
  const isYang = dayStemIndex % 2 === 0;
  const offset = isYang
    ? ((branchIndex - start) % 12 + 12) % 12
    : ((start - branchIndex) % 12 + 12) % 12;
  return TWELVE_STAGES[offset];
}

const YUKHAP_PAIRS = new Map([
  ['0-1', '자축합(토)'], ['1-0', '자축합(토)'],
  ['2-11', '인해합(목)'], ['11-2', '인해합(목)'],
  ['3-10', '묘술합(화)'], ['10-3', '묘술합(화)'],
  ['4-9', '진유합(금)'], ['9-4', '진유합(금)'],
  ['5-8', '사신합(수)'], ['8-5', '사신합(수)'],
  ['6-7', '오미합(화·토)'], ['7-6', '오미합(화·토)'],
]);

const YUKCHUNG_PAIRS = new Map([
  ['0-6', '자오충'], ['6-0', '자오충'],
  ['1-7', '축미충'], ['7-1', '축미충'],
  ['2-8', '인신충'], ['8-2', '인신충'],
  ['3-9', '묘유충'], ['9-3', '묘유충'],
  ['4-10', '진술충'], ['10-4', '진술충'],
  ['5-11', '사해충'], ['11-5', '사해충'],
]);

const SAMHAP_GROUPS = [
  { branches: [8, 0, 4], label: '신자진 수국' },
  { branches: [11, 3, 7], label: '해묘미 목국' },
  { branches: [2, 6, 10], label: '인오술 화국' },
  { branches: [5, 9, 1], label: '사유축 금국' },
];

const HYEONG_PAIRS = new Set([
  '2-5', '5-2', '5-8', '8-5', '2-8', '8-2',
  '1-10', '10-1', '10-7', '7-10', '1-7', '7-1',
  '0-3', '3-0',
  '4-4', '6-6', '9-9', '11-11',
]);

const HAE_PAIRS = new Set([
  '0-7', '7-0', '1-6', '6-1', '2-5', '5-2',
  '3-4', '4-3', '8-11', '11-8', '9-10', '10-9',
]);

/**
 * Analyze Earthly Branch interactions (합·충·형·해) between a target month/year branch
 * and the natal Four Pillars branches.
 */
export function analyzeBranchRelations(targetBranchIndex, natalBranches) {
  const pillarNames = {
    year: '년지',
    month: '월지',
    day: '일지',
    hour: '시지',
  };

  const results = [];
  const presentSet = new Set();

  for (const [slot, branch] of Object.entries(natalBranches)) {
    if (!branch) continue;
    presentSet.add(branch.index);
    const key = `${targetBranchIndex}-${branch.index}`;
    const targetPillarLabel = pillarNames[slot];

    if (YUKHAP_PAIRS.has(key)) {
      results.push({
        type: '육합',
        label: YUKHAP_PAIRS.get(key),
        valence: 'positive',
        slot,
        targetPillarLabel,
        description: `${targetPillarLabel}(${branch.hangul})과 육합을 이루어 협력이 원활합니다.`,
      });
    } else if (YUKCHUNG_PAIRS.has(key)) {
      results.push({
        type: '충',
        label: YUKCHUNG_PAIRS.get(key),
        valence: 'caution',
        slot,
        targetPillarLabel,
        description: `${targetPillarLabel}(${branch.hangul})과 충이 발생해 변화·이동수가 따릅니다.`,
      });
    } else if (HYEONG_PAIRS.has(key)) {
      results.push({
        type: '형',
        label: `${branch.hangul}형`,
        valence: 'caution',
        slot,
        targetPillarLabel,
        description: `${targetPillarLabel}(${branch.hangul})과 형살이 닿아 세심한 조율이 필요합니다.`,
      });
    } else if (HAE_PAIRS.has(key)) {
      results.push({
        type: '해',
        label: `${branch.hangul}해`,
        valence: 'caution',
        slot,
        targetPillarLabel,
        description: `${targetPillarLabel}(${branch.hangul})과 육해가 있어 오해를 줄이는 소통이 좋습니다.`,
      });
    }
  }

  for (const group of SAMHAP_GROUPS) {
    if (!group.branches.includes(targetBranchIndex)) continue;
    const others = group.branches.filter((b) => b !== targetBranchIndex && presentSet.has(b));
    if (others.length === 2) {
      results.push({
        type: '삼합',
        label: `${group.label} 삼합`,
        valence: 'positive',
        slot: 'chart',
        targetPillarLabel: '원국 전체',
        description: `원국과 함께 ${group.label} 삼합이 완성되어 큰 추진력이 생깁니다.`,
      });
    } else if (others.length === 1 && !results.some((r) => r.type === '육합')) {
      results.push({
        type: '반합',
        label: `${group.label} 반합`,
        valence: 'positive',
        slot: 'chart',
        targetPillarLabel: '원국 지지',
        description: `원국 지지와 ${group.label} 반합을 이루어 조력자를 얻기 좋습니다.`,
      });
    }
  }

  return results;
}

const DAY_MASTER_PROFILES = {
  갑: {
    title: '큰 숲을 이끄는 거목, 갑목(甲木)',
    summary: '곧고 바른 소신과 개척정신이 돋보입니다. 스스로 기준을 세우고 앞장설 때 가장 빛나며, 꾸준한 성장을 통해 큰 그늘을 만드는 타입입니다.',
  },
  을: {
    title: '바람에 흔들려도 꺾이지 않는 화초, 을목(乙木)',
    summary: '유연한 처세와 섬세한 감각이 강점입니다. 환경 변화에 빠르게 적응하며 사람 사이를 부드럽게 연결해 현실적인 성과를 만들어냅니다.',
  },
  병: {
    title: '온 세상을 비추는 태양, 병화(丙火)',
    summary: '밝은 에너지와 솔직한 카리스마를 지녔습니다. 열정이 붙으면 주변까지 끌어올리는 추진력이 강하며, 공정함과 명예가 중요한 동기입니다.',
  },
  정: {
    title: '어둠을 밝히는 정교한 등불, 정화(丁火)',
    summary: '따뜻한 배려 속에 날카로운 통찰과 집중력을 품고 있습니다. 한 분야를 깊이 파고들어 전문성을 세우고 진심으로 사람의 마음을 움직입니다.',
  },
  무: {
    title: '중심을 지키는 거대한 산, 무토(戊土)',
    summary: '듬직한 포용력과 변치 않는 신뢰감이 자산입니다. 큰 흐름을 관망하다가 결정적 순간에 묵직하게 판을 안정시키는 힘을 갖추었습니다.',
  },
  기: {
    title: '생명을 기르는 비옥한 대지, 기토(己土)',
    summary: '실속 있는 현실 감각과 세밀한 관리 능력이 탁월합니다. 흩어진 자원을 모아 알차게 키워내며, 주변을 실질적으로 돕는 조율가입니다.',
  },
  경: {
    title: '단련될수록 빛나는 원석, 경금(庚金)',
    summary: '명확한 결단력과 흔들리지 않는 원칙이 강점입니다. 어려운 문제도 회피하지 않고 정면으로 돌파해 깔끔하게 매듭짓는 승부사 기질이 있습니다.',
  },
  신: {
    title: '빛을 가다듬은 보석, 신금(辛金)',
    summary: '높은 심미안과 예리한 분별력을 지녔습니다. 완성도를 중시하고 자존감이 분명하며, 세밀한 감각이 필요한 분야에서 독보적인 가치를 드러냅니다.',
  },
  임: {
    title: '만물을 품고 흐르는 바다, 임수(壬水)',
    summary: '넓은 시야와 전략적 유연함이 돋보입니다. 한 곳에 고이지 않고 시대의 흐름을 읽으며 큰 그림을 설계할 때 가장 큰 역량이 발휘됩니다.',
  },
  계: {
    title: '대지를 적시는 맑은 단비, 계수(癸水)',
    summary: '섬세한 직관력과 깊은 공감 능력을 지녔습니다. 조용하지만 스며드는 설득력으로 위기를 기회로 바꾸고, 창의적인 아이디어가 풍부합니다.',
  },
};

function enrichPillar(pillar, dayStemIndex, isDayPillar = false) {
  if (!pillar) return null;
  const stemTenGod = isDayPillar
    ? { name: '일간(나)', hanja: '日元', group: '일간', shortMeaning: '사주의 중심 주체' }
    : getTenGod(dayStemIndex, pillar.stem.element, pillar.stem.yinYang);
  const mainHidden = getBranchMainStem(pillar.branch);
  const branchTenGod = getTenGod(dayStemIndex, mainHidden.element, mainHidden.yinYang);
  const twelveStage = getTwelveStage(dayStemIndex, pillar.branchIndex);

  return {
    ...pillar,
    stemTenGod,
    branchTenGod,
    twelveStage,
  };
}

/**
 * Perform full Natal Saju Analysis (원국 오행·신강약·용신·십성·12운성).
 */
export function analyzeNatalChart(fourPillars) {
  const { pillars } = fourPillars;
  const dayStemIndex = pillars.day.stemIndex;
  const dayElement = pillars.day.stem.element;

  const enrichedPillars = {
    year: enrichPillar(pillars.year, dayStemIndex, false),
    month: enrichPillar(pillars.month, dayStemIndex, false),
    day: enrichPillar(pillars.day, dayStemIndex, true),
    hour: enrichPillar(pillars.hour, dayStemIndex, false),
  };

  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const slots = [
    { pillar: pillars.year, stemWeight: 1.0, branchWeight: 1.1 },
    { pillar: pillars.month, stemWeight: 1.2, branchWeight: 2.0 },
    { pillar: pillars.day, stemWeight: 1.4, branchWeight: 1.5 },
    ...(pillars.hour ? [{ pillar: pillars.hour, stemWeight: 1.0, branchWeight: 1.1 }] : []),
  ];

  for (const item of slots) {
    counts[item.pillar.stem.element] += item.stemWeight;
    const hidden = item.pillar.branch.hiddenStems;
    if (hidden.length === 2) {
      counts[HEAVENLY_STEMS[hidden[0]].element] += item.branchWeight * 0.3;
      counts[HEAVENLY_STEMS[hidden[1]].element] += item.branchWeight * 0.7;
    } else if (hidden.length === 3) {
      counts[HEAVENLY_STEMS[hidden[0]].element] += item.branchWeight * 0.2;
      counts[HEAVENLY_STEMS[hidden[1]].element] += item.branchWeight * 0.25;
      counts[HEAVENLY_STEMS[hidden[2]].element] += item.branchWeight * 0.55;
    } else {
      counts[item.pillar.branch.element] += item.branchWeight;
    }
  }

  const totalWeight = Object.values(counts).reduce((a, b) => a + b, 0);
  const percentages = {};
  for (const el of ELEMENT_KEYS) {
    percentages[el] = Math.round((counts[el] / totalWeight) * 100);
  }

  const sortedAsc = [...ELEMENT_KEYS].sort((a, b) => counts[a] - counts[b]);
  const sortedDesc = [...ELEMENT_KEYS].sort((a, b) => counts[b] - counts[a]);
  const weakest = sortedAsc[0];
  const strongest = sortedDesc[0];
  const missing = ELEMENT_KEYS.filter((el) => counts[el] < 0.25);

  const generatedByEl = ELEMENT_GENERATED_BY[dayElement];
  const generatesEl = ELEMENT_GENERATES[dayElement];
  const controlsEl = ELEMENT_CONTROLS[dayElement];
  const controlledByEl = ELEMENT_CONTROLLED_BY[dayElement];

  // Strength calculation excluding self base weight (1.4)
  const supportWeight = counts[dayElement] - 1.4 + counts[generatedByEl];
  const remainingWeight = totalWeight - 1.4;
  const monthBranchEl = getBranchMainStem(pillars.month.branch).element;
  const monthSupportBonus = monthBranchEl === dayElement || monthBranchEl === generatedByEl ? 0.12 : 0;
  const effectiveSupportRatio = supportWeight / remainingWeight + monthSupportBonus;

  let strength;
  if (effectiveSupportRatio >= 0.54) {
    strength = '신강';
  } else if (effectiveSupportRatio >= 0.39) {
    strength = '중화';
  } else {
    strength = '신약';
  }

  let yongsin;
  let heesin;
  let gisin;

  if (strength === '신강') {
    const drainCandidates = [generatesEl, controlsEl, controlledByEl];
    yongsin = [...drainCandidates].sort((a, b) => counts[a] - counts[b])[0];
    heesin = ELEMENT_GENERATES[yongsin] === dayElement ? controlsEl : ELEMENT_GENERATES[yongsin];
    if (heesin === yongsin || heesin === dayElement) {
      heesin = drainCandidates.find((el) => el !== yongsin) || controlsEl;
    }
    gisin = counts[dayElement] >= counts[generatedByEl] ? dayElement : generatedByEl;
  } else if (strength === '신약') {
    yongsin = counts[generatedByEl] <= counts[dayElement] ? generatedByEl : dayElement;
    heesin = yongsin === generatedByEl ? dayElement : generatedByEl;
    gisin = [controlledByEl, controlsEl, generatesEl].sort((a, b) => counts[b] - counts[a])[0];
  } else {
    yongsin = weakest;
    heesin = ELEMENT_GENERATED_BY[yongsin];
    gisin = strongest;
  }

  const dayMasterProfile = DAY_MASTER_PROFILES[pillars.day.stem.hangul];

  return {
    dayElement,
    dayMasterProfile,
    pillars: enrichedPillars,
    elementStats: {
      counts,
      percentages,
      totalWeight,
      strongest,
      weakest,
      missing,
    },
    strength,
    effectiveSupportRatio: Number(effectiveSupportRatio.toFixed(2)),
    yongsin,
    heesin,
    gisin,
  };
}

// 훈민정음 초성 음령오행 (19 initial consonants)
const CHOSEONG_TO_ELEMENT = [
  '목', // ㄱ
  '목', // ㄲ
  '화', // ㄴ
  '화', // ㄷ
  '화', // ㄸ
  '화', // ㄹ
  '수', // ㅁ
  '수', // ㅂ
  '수', // ㅃ
  '금', // ㅅ
  '금', // ㅆ
  '토', // ㅇ
  '금', // ㅈ
  '금', // ㅉ
  '금', // ㅊ
  '목', // ㅋ
  '화', // ㅌ
  '수', // ㅍ
  '토', // ㅎ
];

const CHOSEONG_LABELS = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

function extractCharElements(text) {
  const tokens = [];
  for (const ch of text.trim()) {
    if (/\s/.test(ch)) continue;
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - 0xac00) / 588);
      tokens.push({
        char: ch,
        initial: CHOSEONG_LABELS[idx],
        element: CHOSEONG_TO_ELEMENT[idx],
      });
    } else {
      const fallbackEl = ELEMENT_KEYS[code % 5];
      tokens.push({
        char: ch,
        initial: ch,
        element: fallbackEl,
      });
    }
  }
  return tokens;
}

/**
 * Analyze Hangul Name Five Elements (성명 음령오행) and compare against the natal 용신/희신.
 */
export function analyzeNameElements(lastName, firstName, natalAnalysis) {
  const surnameTokens = extractCharElements(lastName || '');
  const givenNameTokens = extractCharElements(firstName || '');
  const allTokens = [...surnameTokens, ...givenNameTokens];

  const counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const t of allTokens) {
    counts[t.element] += 1;
  }

  let dominantElement = '토';
  let maxCount = -1;
  for (const el of ELEMENT_KEYS) {
    if (counts[el] > maxCount) {
      maxCount = counts[el];
      dominantElement = el;
    }
  }

  const hasYongsin = allTokens.some((t) => t.element === natalAnalysis.yongsin);
  const hasHeesin = allTokens.some((t) => t.element === natalAnalysis.heesin);
  const hasWeakest = allTokens.some((t) => t.element === natalAnalysis.elementStats.weakest);

  let harmonyScore = 72;
  if (hasYongsin) harmonyScore += 14;
  if (hasHeesin) harmonyScore += 8;
  if (hasWeakest) harmonyScore += 5;
  if (ELEMENT_GENERATES[dominantElement] === natalAnalysis.yongsin) harmonyScore += 5;
  if (dominantElement === natalAnalysis.gisin && !hasYongsin) harmonyScore -= 7;
  harmonyScore = Math.max(58, Math.min(98, harmonyScore));

  let summary;
  const fullName = `${lastName}${firstName}`;
  if (hasYongsin) {
    summary = `${fullName} 님의 이름 음령에 원국 용신인 ${ELEMENTS[natalAnalysis.yongsin].label} 기운이 담겨 있어, 부를수록 부족한 기운을 자연스럽게 보완해 줍니다.`;
  } else if (hasHeesin || hasWeakest) {
    summary = `${fullName} 님의 이름에 희신·보완 기운(${ELEMENTS[dominantElement].label})이 자리해 원국의 균형을 부드럽게 받쳐주는 구조입니다.`;
  } else {
    summary = `${fullName} 님의 성명 음령은 ${ELEMENTS[dominantElement].label} 기운이 중심을 이룹니다. 용신인 ${ELEMENTS[natalAnalysis.yongsin].label} 색상과 습관을 함께 활용하면 조화가 한층 깊어집니다.`;
  }

  return {
    fullName,
    surnameTokens,
    givenNameTokens,
    allTokens,
    counts,
    dominantElement,
    complementsYongsin: hasYongsin,
    complementsHeesin: hasHeesin,
    harmonyScore,
    summary,
  };
}
