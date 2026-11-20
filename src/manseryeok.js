/**
 * Astronomical Korean Manseryeok (만세력) Engine.
 * Calculates accurate Four Pillars (사주팔자: 연주·월주·일주·시주) using
 * Jean Meeus solar apparent ecliptic longitude for the 12 Jieqi (절기) boundaries,
 * exact integer Julian Day Numbers for the Sexagenary Day Cycle, and
 * 30-minute Korean Standard Time (UTC+9 vs 135°E/127.5°E) solar-time correction for 12 Sijin.
 */

export const HEAVENLY_STEMS = [
  { index: 0, hangul: '갑', hanja: '甲', element: '목', yinYang: '양', nature: '큰 나무 · 거목', description: '곧게 뻗는 기상과 개척정신, 책임감이 강한 리더 기질' },
  { index: 1, hangul: '을', hanja: '乙', element: '목', yinYang: '음', nature: '덩굴 · 화초', description: '유연한 적응력과 끈기, 섬세한 감각과 친화력' },
  { index: 2, hangul: '병', hanja: '丙', element: '화', yinYang: '양', nature: '태양 · 큰 불', description: '밝고 따뜻한 열정, 솔직한 표현력과 추진력' },
  { index: 3, hangul: '정', hanja: '丁', element: '화', yinYang: '음', nature: '촛불 · 등불', description: '깊은 통찰과 집중력, 은은하게 사람을 이끄는 배려' },
  { index: 4, hangul: '무', hanja: '戊', element: '토', yinYang: '양', nature: '큰 산 · 대지', description: '묵직한 신뢰감과 포용력, 중심을 지키는 안정감' },
  { index: 5, hangul: '기', hanja: '己', element: '토', yinYang: '음', nature: '논밭 · 비옥한 흙', description: '실속 있는 현실 감각, 꼼꼼한 조율과 양육의 힘' },
  { index: 6, hangul: '경', hanja: '庚', element: '금', yinYang: '양', nature: '원석 · 강철', description: '결단력과 정의감, 난관을 돌파하는 강인한 의지' },
  { index: 7, hangul: '신', hanja: '辛', element: '금', yinYang: '음', nature: '보석 · 정교한 칼', description: '예리한 심미안과 완벽주의, 자존감과 섬세한 분별력' },
  { index: 8, hangul: '임', hanja: '壬', element: '수', yinYang: '양', nature: '바다 · 큰 강', description: '지혜와 포용의 흐름, 변화에 능한 전략적 사고' },
  { index: 9, hangul: '계', hanja: '癸', element: '수', yinYang: '음', nature: '단비 · 맑은 샘', description: '직관력과 창의성, 상황을 스며들듯 읽는 감수성' },
];

export const EARTHLY_BRANCHES = [
  { index: 0, hangul: '자', hanja: '子', animal: '쥐', element: '수', yinYang: '양', timeLabel: '자시(子時)', timeRange: '23:30~01:29', representativeTime: '00:30', hiddenStems: [8, 9] },
  { index: 1, hangul: '축', hanja: '丑', animal: '소', element: '토', yinYang: '음', timeLabel: '축시(丑時)', timeRange: '01:30~03:29', representativeTime: '02:30', hiddenStems: [9, 7, 5] },
  { index: 2, hangul: '인', hanja: '寅', animal: '호랑이', element: '목', yinYang: '양', timeLabel: '인시(寅時)', timeRange: '03:30~05:29', representativeTime: '04:30', hiddenStems: [4, 2, 0] },
  { index: 3, hangul: '묘', hanja: '卯', animal: '토끼', element: '목', yinYang: '음', timeLabel: '묘시(卯時)', timeRange: '05:30~07:29', representativeTime: '06:30', hiddenStems: [0, 1] },
  { index: 4, hangul: '진', hanja: '辰', animal: '용', element: '토', yinYang: '양', timeLabel: '진시(辰時)', timeRange: '07:30~09:29', representativeTime: '08:30', hiddenStems: [1, 9, 4] },
  { index: 5, hangul: '사', hanja: '巳', animal: '뱀', element: '화', yinYang: '음', timeLabel: '사시(巳時)', timeRange: '09:30~11:29', representativeTime: '10:30', hiddenStems: [4, 6, 2] },
  { index: 6, hangul: '오', hanja: '午', animal: '말', element: '화', yinYang: '양', timeLabel: '오시(午時)', timeRange: '11:30~13:29', representativeTime: '12:30', hiddenStems: [2, 5, 3] },
  { index: 7, hangul: '미', hanja: '未', animal: '양', element: '토', yinYang: '음', timeLabel: '미시(未時)', timeRange: '13:30~15:29', representativeTime: '14:30', hiddenStems: [3, 1, 5] },
  { index: 8, hangul: '신', hanja: '申', animal: '원숭이', element: '금', yinYang: '양', timeLabel: '신시(申時)', timeRange: '15:30~17:29', representativeTime: '16:30', hiddenStems: [4, 8, 6] },
  { index: 9, hangul: '유', hanja: '酉', animal: '닭', element: '금', yinYang: '음', timeLabel: '유시(酉時)', timeRange: '17:30~19:29', representativeTime: '18:30', hiddenStems: [6, 7] },
  { index: 10, hangul: '술', hanja: '戌', animal: '개', element: '토', yinYang: '양', timeLabel: '술시(戌時)', timeRange: '19:30~21:29', representativeTime: '20:30', hiddenStems: [7, 3, 4] },
  { index: 11, hangul: '해', hanja: '亥', animal: '돼지', element: '수', yinYang: '음', timeLabel: '해시(亥時)', timeRange: '21:30~23:29', representativeTime: '22:30', hiddenStems: [4, 0, 8] },
];

export const SIJIN_LIST = EARTHLY_BRANCHES.map((b) => ({
  branchIndex: b.index,
  hangul: b.hangul,
  hanja: b.hanja,
  label: `${b.hangul}시`,
  timeLabel: b.timeLabel,
  timeRange: b.timeRange,
  representativeTime: b.representativeTime,
}));

export const SOLAR_TERMS_12 = [
  { key: 'sohan', name: '소한', hanja: '小寒', targetLon: 285, approxMonth: 1, approxDay: 6, monthOrder: 11, calendarMonth: 1 },
  { key: 'ipchun', name: '입춘', hanja: '立春', targetLon: 315, approxMonth: 2, approxDay: 4, monthOrder: 0, calendarMonth: 2 },
  { key: 'gyeongchip', name: '경칩', hanja: '驚蟄', targetLon: 345, approxMonth: 3, approxDay: 6, monthOrder: 1, calendarMonth: 3 },
  { key: 'cheongmyeong', name: '청명', hanja: '淸明', targetLon: 15, approxMonth: 4, approxDay: 5, monthOrder: 2, calendarMonth: 4 },
  { key: 'ipha', name: '입하', hanja: '立夏', targetLon: 45, approxMonth: 5, approxDay: 6, monthOrder: 3, calendarMonth: 5 },
  { key: 'mangjong', name: '망종', hanja: '芒種', targetLon: 75, approxMonth: 6, approxDay: 6, monthOrder: 4, calendarMonth: 6 },
  { key: 'soseo', name: '소서', hanja: '小暑', targetLon: 105, approxMonth: 7, approxDay: 7, monthOrder: 5, calendarMonth: 7 },
  { key: 'ipchu', name: '입추', hanja: '立秋', targetLon: 135, approxMonth: 8, approxDay: 8, monthOrder: 6, calendarMonth: 8 },
  { key: 'baengno', name: '백로', hanja: '白露', targetLon: 165, approxMonth: 9, approxDay: 8, monthOrder: 7, calendarMonth: 9 },
  { key: 'hanro', name: '한로', hanja: '寒露', targetLon: 195, approxMonth: 10, approxDay: 8, monthOrder: 8, calendarMonth: 10 },
  { key: 'ipdong', name: '입동', hanja: '立冬', targetLon: 225, approxMonth: 11, approxDay: 7, monthOrder: 9, calendarMonth: 11 },
  { key: 'daeseol', name: '대설', hanja: '大雪', targetLon: 255, approxMonth: 12, approxDay: 7, monthOrder: 10, calendarMonth: 12 },
];

function mod(n, m) {
  return ((n % m) + m) % m;
}

function mod360(deg) {
  return ((deg % 360) + 360) % 360;
}

function signedAngleDiff(targetDeg, currentDeg) {
  let diff = mod360(targetDeg - currentDeg);
  if (diff >= 180) diff -= 360;
  return diff;
}

/**
 * Exact Fliegel-Van Flandern integer Julian Day Number (at 12:00 UT on Gregorian date).
 */
export function gregorianToJDN(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Convert KST (UTC+9) date & wall-clock time to Julian Day (UT).
 */
export function kstToJD(year, month, day, hour = 12, minute = 0) {
  const jdn = gregorianToJDN(year, month, day);
  return jdn + (hour - 9 - 12) / 24 + minute / 1440;
}

/**
 * Convert Julian Day (UT) back to KST { year, month, day, hour, minute }.
 */
export function jdToKstDate(jd) {
  const shifted = jd + 0.5 + 9 / 24;
  let z = Math.floor(shifted);
  const f = shifted - z;

  let totalMinutes = Math.round(f * 1440);
  if (totalMinutes >= 1440) {
    totalMinutes -= 1440;
    z += 1;
  }

  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;

  return { year, month, day, hour, minute };
}

/**
 * Jean Meeus apparent solar ecliptic longitude in degrees [0, 360).
 */
export function solarLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = mod360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = mod360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mrad = (M * Math.PI) / 180;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const trueLon = L0 + C;
  const omega = ((125.04 - 1934.136 * T) * Math.PI) / 180;
  const apparentLon = trueLon - 0.00569 - 0.00478 * Math.sin(omega);
  return mod360(apparentLon);
}

/**
 * Find exact Julian Day (UT) when the Sun reaches `targetLon` near (year, approxMonth, approxDay).
 */
export function findSolarTermJD(year, targetLon, approxMonth, approxDay) {
  let jd = kstToJD(year, approxMonth, approxDay, 12, 0);
  for (let i = 0; i < 8; i++) {
    const currentLon = solarLongitude(jd);
    const diff = signedAngleDiff(targetLon, currentLon);
    if (Math.abs(diff) < 1e-7) break;
    jd += diff / 0.9856474;
  }
  return jd;
}

const solarTermsYearCache = new Map();

/**
 * Get the 12 Jieqi (절기) timestamps in KST for a given Gregorian year.
 */
export function getYearSolarTerms(year) {
  if (solarTermsYearCache.has(year)) {
    return solarTermsYearCache.get(year);
  }
  const list = SOLAR_TERMS_12.map((term) => {
    const jd = findSolarTermJD(year, term.targetLon, term.approxMonth, term.approxDay);
    const kst = jdToKstDate(jd);
    return {
      ...term,
      jd,
      kst,
    };
  });
  const byKey = Object.fromEntries(list.map((t) => [t.key, t]));
  const result = { list, byKey };
  solarTermsYearCache.set(year, result);
  return result;
}

function buildPillar(stemIndex, branchIndex) {
  const s = HEAVENLY_STEMS[mod(stemIndex, 10)];
  const b = EARTHLY_BRANCHES[mod(branchIndex, 12)];
  return {
    stemIndex: s.index,
    branchIndex: b.index,
    stem: s,
    branch: b,
    hangul: `${s.hangul}${b.hangul}`,
    hanja: `${s.hanja}${b.hanja}`,
  };
}

export function getYearPillar(sajuYear) {
  const stemIndex = mod(sajuYear - 4, 10);
  const branchIndex = mod(sajuYear - 4, 12);
  return buildPillar(stemIndex, branchIndex);
}

/**
 * 오호둔법 (五虎遁法): Derive month stem from year stem & monthOrder (0=인월 .. 11=축월).
 */
export function getMonthPillar(yearStemIndex, monthOrder) {
  const baseStem = ((mod(yearStemIndex, 5) * 2) + 2) % 10;
  const stemIndex = (baseStem + monthOrder) % 10;
  const branchIndex = (2 + monthOrder) % 12;
  return buildPillar(stemIndex, branchIndex);
}

/**
 * Derive Sexagenary Day Pillar from Gregorian date (exact JDN cycle).
 */
export function getDayPillar(year, month, day, dayOffset = 0) {
  const jdn = gregorianToJDN(year, month, day) + dayOffset;
  const cycle = mod(jdn + 49, 60);
  return buildPillar(cycle % 10, cycle % 12);
}

/**
 * Map KST wall-clock time (hour, minute) to one of 12 Sijin branches using
 * 30-minute Korean solar-time adjustment (23:30 ~ 01:29 = 자시).
 */
export function getHourBranchFromTime(hour, minute, useSolarCorrection = true) {
  const totalMin = hour * 60 + minute;
  if (!useSolarCorrection) {
    const branchIndex = Math.floor(((totalMin + 60) % 1440) / 120);
    return { branchIndex, advancesDay: totalMin >= 23 * 60 };
  }
  const branchIndex = Math.floor(((totalMin + 30) % 1440) / 120);
  return {
    branchIndex,
    advancesDay: totalMin >= 23 * 60 + 30,
  };
}

/**
 * 오서둔법 (五鼠遁法): Derive hour stem from day stem & hour branch index.
 */
export function getHourPillar(dayStemIndex, hourBranchIndex) {
  const baseStem = (mod(dayStemIndex, 5) * 2) % 10;
  const stemIndex = (baseStem + hourBranchIndex) % 10;
  return buildPillar(stemIndex, hourBranchIndex);
}

/**
 * Calculate the complete Korean Four Pillars (사주팔자) for a given solar date & KST time.
 */
export function calculateFourPillars({ year, month, day, hour = 12, minute = 0, timeUnknown = false }) {
  const checkHour = timeUnknown ? 12 : hour;
  const checkMinute = timeUnknown ? 0 : minute;
  const birthJD = kstToJD(year, month, day, checkHour, checkMinute);
  const terms = getYearSolarTerms(year);

  let sajuYear;
  let monthOrder;

  if (birthJD < terms.byKey.ipchun.jd) {
    sajuYear = year - 1;
    monthOrder = birthJD >= terms.byKey.sohan.jd ? 11 : 10;
  } else {
    sajuYear = year;
    monthOrder = 0;
    for (let i = terms.list.length - 1; i >= 1; i--) {
      if (birthJD >= terms.list[i].jd) {
        monthOrder = terms.list[i].monthOrder;
        break;
      }
    }
  }

  const yearPillar = getYearPillar(sajuYear);
  const monthPillar = getMonthPillar(yearPillar.stemIndex, monthOrder);

  let dayAdvancedByJaSi = false;
  let sijin = null;
  if (!timeUnknown) {
    const hourInfo = getHourBranchFromTime(hour, minute, true);
    dayAdvancedByJaSi = hourInfo.advancesDay;
    sijin = EARTHLY_BRANCHES[hourInfo.branchIndex];
  }

  const dayPillar = getDayPillar(year, month, day, dayAdvancedByJaSi ? 1 : 0);
  const hourPillar = timeUnknown ? null : getHourPillar(dayPillar.stemIndex, sijin.index);

  return {
    sajuYear,
    monthOrder,
    solarDate: { year, month, day },
    timeUnknown,
    dayAdvancedByJaSi,
    sijin,
    ipchunKst: terms.byKey.ipchun.kst,
    pillars: {
      year: yearPillar,
      month: monthPillar,
      day: dayPillar,
      hour: hourPillar,
    },
  };
}

function formatKstShort(kst) {
  return `${kst.month}.${kst.day}`;
}

/**
 * Build the 12 monthly pillars (월운 1~12월) for a target Gregorian year.
 * Month 1 corresponds to 축월 (소한 ~ 입춘 전, belonging to targetYear - 1 Saju year),
 * and Months 2..12 correspond to 인월..자월 of targetYear.
 */
export function getYearMonthlyPillars(targetYear) {
  const prevYearStem = getYearPillar(targetYear - 1).stemIndex;
  const currYearStem = getYearPillar(targetYear).stemIndex;
  const terms = getYearSolarTerms(targetYear);
  const nextTerms = getYearSolarTerms(targetYear + 1);

  return terms.list.map((term, idx) => {
    const calendarMonth = idx + 1;
    const isJanuary = calendarMonth === 1;
    const pillar = getMonthPillar(isJanuary ? prevYearStem : currYearStem, term.monthOrder);
    const nextTerm = idx < terms.list.length - 1 ? terms.list[idx + 1] : nextTerms.byKey.sohan;

    return {
      calendarMonth,
      quarter: Math.ceil(calendarMonth / 3),
      pillar,
      solarTermName: term.name,
      solarTermHanja: term.hanja,
      solarTermKst: term.kst,
      nextSolarTermName: nextTerm.name,
      nextSolarTermKst: nextTerm.kst,
      termRangeText: `${term.name}(${formatKstShort(term.kst)}) ~ ${nextTerm.name}(${formatKstShort(nextTerm.kst)}) 전`,
    };
  });
}
