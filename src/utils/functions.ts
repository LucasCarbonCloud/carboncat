import { getTemplateSrv } from '@grafana/runtime';
import { DateTime, isDateTime, VariableOption } from '@grafana/data';
import dayjs from 'dayjs';
import { Filter, FilterOperation } from 'types/filters';

export function prettifyHeaderNames(name: string, displayLevel: boolean) {
  if (name.startsWith('labels.')) {
    return name.replace(/^labels\./, '');
  } else if (name === 'level' && !displayLevel) {
    return '\u200C';
  } else if (name === 'timestamp') {
    return 'date';
  } else if (name === 'body') {
    return 'message';
  }

  return name;
}

export function getValuesForVariable(name: string): string[] {
  const values: string[] = [];

  // Collects the values in an array.
  getTemplateSrv().replace(`$${name}`, {}, (value: string | string[]) => {
    if (Array.isArray(value)) {
      values.push(...value);
    } else {
      values.push(value);
    }

    // We don't really care about the string here.
    return '';
  });

  return values;
}

export function getOptionsForVariable(name: string): string[] {
  const variable = getTemplateSrv()
    .getVariables()
    .find((v) => v.name === name);

  if (!variable || !('options' in variable)) {
    return [];
  }

  const options = variable.options as VariableOption[];
  return options.map((opt) => String(opt.value));
}

export function truncateString(str: string, num: number) {
  if (str.length > num) {
    return str.slice(0, num) + '...';
  } else {
    return str;
  }
}

export function timeAgo(timestamp: string) {
  const now = dayjs();
  const then = dayjs(timestamp);
  const diffInSeconds = now.diff(then, 'second');

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }

  const diffInMinutes = now.diff(then, 'minute');
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = now.diff(then, 'hour');
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = now.diff(then, 'day');
  return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
}

export function stringToDarkColor(str: string): string {
  // Simple hash
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }

  // Generate RGB values
  const r = (hash & 0xff) % 100; // keep low for dark
  const g = ((hash >> 8) & 0xff) % 100;
  const b = ((hash >> 16) & 0xff) % 100;

  // Convert to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const generateFilterString = (filters: Filter[]) => {
  let outStr = '';
  for (let i = 0; i < filters.length; i++) {
    let key = filters[i].key;
    let operation = filters[i].operation;
    let value = filters[i].value;

    if (key.startsWith('labels.')) {
      let logKey = key.split('.').slice(1).join('.');
      key = `LogAttributes['${logKey}']`;
    }
    if (operation === '~') {
      outStr += ` AND ( ${key} ILIKE '%${value}%' )`;
    } else {
      outStr += ` AND ( ${key} ${operation} '${value}' )`;
    }
  }
  return outStr;
};

export function generateHLFilterString(key: string, cmps: string[]): string {
  if ( cmps.length === 0 ) {
    return ""
  }
  const formatted = `(${cmps.map(s => `'${s}'`).join(",")})`;
  return `AND ( ${key} IN ${formatted} )`
}

export function parseFilterString(str: string): Filter[] {
  const regex = /\(\s*(.*?)\s*\)/g;
  const matches = [...str.matchAll(regex)].map((m) => m[1]);

  const f = matches.map((fStr: string): Filter | undefined => {
    if (fStr.includes('LogAttributes[')) {
      const regex = /LogAttributes\['([^']+)'\]\s*(=|!=)\s*'([^']+)'/;
      const match = fStr.match(regex);

      if (match) {
        const [, key, operator, value] = match;
        return { key: 'labels.' + key, operation: operator as FilterOperation, value: value };
      }
    } else {
      const regex = /([^']+)\s*(=|!=)\s*'([^']+)'/;
      const match = fStr.match(regex);

      if (match) {
        const [, key, operator, value] = match;
        return { key: key, operation: operator as FilterOperation, value: value };
      }
    }
    return undefined;
  });

  return f.filter(function (element) {
    return element !== undefined;
  });
}

export function parseSelectedKeys(str: string): string[] {
  return str.split(',').map((s: string) => {
    return s.trim();
  });
}

export function getFieldNames(keys: string[], standardKeys: string[], labels: string[]): string[] {
  let outList: string[] = [];

  keys.forEach((k) => {
    if (standardKeys.includes(k)) {
      outList.push(k);
    }
  });

  if (outList.includes('body')) {
    return [...outList.filter((item) => item !== 'body'), ...labels, 'body'];
  }
  return [...outList, ...labels];
}


export function parseTimeRangeRaw(t: string | DateTime): string {
  if (isDateTime(t)) {
    return t.toISOString()
  } else {
    return t
  }
}
