/**
 * Returns command and it's param (or null if it doesn't exist).
 * E.g.:
 *   "/start DATA" -> ["start", "DATA"]
 *   "/start" -> ["start", ""];
 *
 * @param text
 */
export function getCommandAndParam(text: string) {
  const matches = text.match(/^(\/\S*)\s*(.*)$/);

  if (!matches) {
    return {command: '', param: ''}
  }

  return {
    command: matches[1],
    param: matches[2],
  };
}
