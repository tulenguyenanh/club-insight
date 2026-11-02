export interface Change {
  /** current - previous. For rates this is in percentage points (as a fraction). */
  absolute: number;
  /** (current - previous) / previous. Null when previous is zero or the number is a rate. */
  relative: number | null;
}

/** Change in a count. Null when the previous period has nothing to compare against. */
export function countChange(current: number, previous: number, previousIsComparable: boolean): Change | null {
  if (!previousIsComparable) return null;
  return {
    absolute: current - previous,
    relative: previous === 0 ? null : (current - previous) / previous,
  };
}

/** Change in a rate. Null when either rate is unknown. */
export function rateChange(current: number | null, previous: number | null): Change | null {
  if (current === null || previous === null) return null;
  return { absolute: current - previous, relative: null };
}
