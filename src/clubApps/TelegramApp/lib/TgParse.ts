/**
 * Returns command and it's param (or null if it doesn't exist).
 * E.g.:
 *   "/start DATA" -> ["start", "DATA"]
 *   "/start" -> ["start", ""];
 *
 * @param text
 */
export function getCommandAndParam(text: string): ICommandAndParam {
  const matches = text.match(/^(\/\S*)\s*(.*)$/);

  if (!matches) {
    return {command: '', param: ''}
  }

  const param = matches[2].trim();

  return {
    command: matches[1],
    param,
  };
}

export function splitParam(param: string): string[] {
  return param
    .split(/\s+/)
    .filter(v => v);
}

export interface ICommandAndParam {
  command: string
  param: string
  // params: string[],
}
