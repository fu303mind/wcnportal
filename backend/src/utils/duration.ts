type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week';

const UNIT_MAP: Record<string, TimeUnit> = {
  s: 'second',
  m: 'minute',
  h: 'hour',
  d: 'day',
  w: 'week'
};

export const parseDuration = (expression: string) => {
  const match = expression.trim().match(/^(\d+)([smhdw])$/i);
  if (!match) {
    throw new Error(`Invalid duration: ${expression}`);
  }
  const value = Number(match[1]);
  const unit = UNIT_MAP[match[2].toLowerCase()];
  if (!unit) {
    throw new Error(`Unsupported duration unit in ${expression}`);
  }
  return { value, unit } as const;
};
