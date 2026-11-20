/**
 * Location-agnostic date/time parsing and Solar <-> Korean/Chinese Lunar conversion utilities.
 * Uses Temporal PlainDate / PlainTime when available, with strict integer fallbacks to prevent
 * legacy Date timezone-offset drift.
 */

const CHINESE_LUNAR_FORMATTER = new Intl.DateTimeFormat('en-US-u-ca-chinese', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function pad2(n) {
  return String(n).padStart(2, '0');
}

function pad4(n) {
  return String(n).padStart(4, '0');
}

export function isGregorianLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInGregorianMonth(year, month) {
  switch (month) {
    case 2:
      return isGregorianLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function formatIsoDate(year, month, day) {
  return `${pad4(year)}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Parse a YYYY-MM-DD string into a frozen, location-agnostic date value.
 */
export function parsePlainDate(isoDateStr) {
  if (typeof isoDateStr !== 'string') {
    throw new Error('생년월일 형식이 올바르지 않습니다. (예: 1994-05-18)');
  }
  const trimmed = isoDateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    throw new Error('생년월일은 YYYY-MM-DD 형식으로 입력해 주세요.');
  }

  let year;
  let month;
  let day;

  if (typeof globalThis.Temporal !== 'undefined' && globalThis.Temporal.PlainDate) {
    try {
      const plain = globalThis.Temporal.PlainDate.from(trimmed);
      year = plain.year;
      month = plain.month;
      day = plain.day;
    } catch {
      throw new Error('존재하지 않는 날짜입니다. 연·월·일을 다시 확인해 주세요.');
    }
  } else {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
    if (year < 1800 || year > 2150 || month < 1 || month > 12) {
      throw new Error('생년월일 범위를 확인해 주세요. (1900~2035년 권장)');
    }
    const maxDay = daysInGregorianMonth(year, month);
    if (day < 1 || day > maxDay) {
      throw new Error(`${year}년 ${month}월은 ${maxDay}일까지 있습니다.`);
    }
  }

  const iso = formatIsoDate(year, month, day);
  return Object.freeze({
    year,
    month,
    day,
    toString() {
      return iso;
    },
  });
}

/**
 * Parse an HH:MM or HH:MM:SS wall-clock string into a frozen PlainTime-like object.
 */
export function parsePlainTime(timeStr) {
  if (typeof timeStr !== 'string') {
    throw new Error('태어난 시각 형식이 올바르지 않습니다.');
  }
  const trimmed = timeStr.trim();
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) {
    throw new Error('태어난 시각은 HH:MM 형식으로 입력해 주세요.');
  }

  let hour;
  let minute;

  if (typeof globalThis.Temporal !== 'undefined' && globalThis.Temporal.PlainTime) {
    try {
      const plain = globalThis.Temporal.PlainTime.from(trimmed);
      hour = plain.hour;
      minute = plain.minute;
    } catch {
      throw new Error('태어난 시각은 00:00 ~ 23:59 사이로 입력해 주세요.');
    }
  } else {
    hour = Number(match[1]);
    minute = Number(match[2]);
    const second = match[3] ? Number(match[3]) : 0;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
      throw new Error('태어난 시각은 00:00 ~ 23:59 사이로 입력해 주세요.');
    }
  }

  const formatted = `${pad2(hour)}:${pad2(minute)}`;
  return Object.freeze({
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
    toString() {
      return formatted;
    },
  });
}

/**
 * Get today's calendar date in the user's local calendar without UTC drift.
 */
export function getTodayPlainDate() {
  if (typeof globalThis.Temporal !== 'undefined' && globalThis.Temporal.Now) {
    const today = globalThis.Temporal.Now.plainDateISO();
    const iso = formatIsoDate(today.year, today.month, today.day);
    return Object.freeze({
      year: today.year,
      month: today.month,
      day: today.day,
      toString() {
        return iso;
      },
    });
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const iso = formatIsoDate(year, month, day);
  return Object.freeze({
    year,
    month,
    day,
    toString() {
      return iso;
    },
  });
}

function readLunarPartsFromUtcNoon(utcMillis) {
  const parts = CHINESE_LUNAR_FORMATTER.formatToParts(new Date(utcMillis));
  let yearNum = NaN;
  let monthRaw = '';
  let dayNum = NaN;

  for (const part of parts) {
    if (part.type === 'relatedYear' || part.type === 'year') {
      const parsed = parseInt(part.value, 10);
      if (!Number.isNaN(parsed)) {
        yearNum = parsed;
      }
    } else if (part.type === 'month') {
      monthRaw = part.value;
    } else if (part.type === 'day') {
      dayNum = parseInt(part.value, 10);
    }
  }

  const isLeap = /bis/i.test(monthRaw);
  const monthNum = parseInt(monthRaw, 10);

  return {
    year: yearNum,
    month: monthNum,
    day: dayNum,
    isLeap,
  };
}

/**
 * Convert a Gregorian solar date (YYYY, M, D) into its Chinese/Korean lunar date.
 */
export function solarToLunar(year, month, day) {
  const utcNoon = Date.UTC(year, month - 1, day, 12, 0, 0);
  const res = readLunarPartsFromUtcNoon(utcNoon);
  if (Number.isNaN(res.year) || Number.isNaN(res.month) || Number.isNaN(res.day)) {
    throw new Error('양력 날짜를 음력으로 변환할 수 없습니다.');
  }
  return res;
}

const MS_PER_DAY = 86_400_000;

/**
 * Convert a Lunar date (lunarYear, lunarMonth, lunarDay, isLeap) into Gregorian solar { year, month, day }.
 * Uses coarse 10-day jumps over the lunar year window followed by exact day offset lookup.
 */
export function lunarToSolar(lunarYear, lunarMonth, lunarDay, isLeap = false) {
  if (lunarMonth < 1 || lunarMonth > 12 || lunarDay < 1 || lunarDay > 30) {
    throw new Error('음력 날짜는 1~12월, 1~30일 범위여야 합니다.');
  }

  const startMs = Date.UTC(lunarYear, 0, 15, 12, 0, 0);
  const endMs = Date.UTC(lunarYear + 1, 1, 25, 12, 0, 0);

  let foundSameMonthMs = null;
  let sawTargetMonthInYear = false;
  let sawTargetYear = false;

  for (let ms = startMs; ms <= endMs; ms += 10 * MS_PER_DAY) {
    const info = readLunarPartsFromUtcNoon(ms);
    if (info.year === lunarYear) {
      sawTargetYear = true;
      if (info.month === lunarMonth) {
        sawTargetMonthInYear = true;
        if (info.isLeap === isLeap) {
          foundSameMonthMs = ms;
          break;
        }
      }
    }
  }

  // Because a 29-day month is nearly 3x 10-day steps, check fine step if a leap month sat tightly
  if (foundSameMonthMs === null && sawTargetYear) {
    for (let ms = startMs; ms <= endMs; ms += 5 * MS_PER_DAY) {
      const info = readLunarPartsFromUtcNoon(ms);
      if (info.year === lunarYear && info.month === lunarMonth) {
        sawTargetMonthInYear = true;
        if (info.isLeap === isLeap) {
          foundSameMonthMs = ms;
          break;
        }
      }
    }
  }

  if (foundSameMonthMs === null) {
    if (isLeap && sawTargetMonthInYear) {
      throw new Error(`${lunarYear}년 ${lunarMonth}월은 윤달이 존재하지 않습니다. 평달을 선택해 주세요.`);
    }
    if (isLeap) {
      throw new Error(`${lunarYear}년에는 음력 윤${lunarMonth}월이 존재하지 않습니다. 평달을 선택해 주세요.`);
    }
    throw new Error(`${lunarYear}년 음력 ${lunarMonth}월 ${lunarDay}일에 해당하는 양력 날짜를 찾을 수 없습니다.`);
  }

  const anchorInfo = readLunarPartsFromUtcNoon(foundSameMonthMs);
  const candidateMs = foundSameMonthMs + (lunarDay - anchorInfo.day) * MS_PER_DAY;
  const verify = readLunarPartsFromUtcNoon(candidateMs);

  if (
    verify.year !== lunarYear ||
    verify.month !== lunarMonth ||
    verify.isLeap !== isLeap ||
    verify.day !== lunarDay
  ) {
    throw new Error(
      `${lunarYear}년 음력 ${isLeap ? '윤' : ''}${lunarMonth}월 ${lunarDay}일은 존재하지 않는 날짜입니다.`
    );
  }

  const d = new Date(candidateMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}
