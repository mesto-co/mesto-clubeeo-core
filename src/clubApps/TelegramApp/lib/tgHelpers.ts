import {sanitizeHtmlDefault} from '../../../lib/sanitize'

export const cleanupTgMessage = (text: string) => {
  return sanitizeHtmlDefault(text);
}

export const tgI = (text: string) => {
  return `<i>${cleanupTgMessage(text)}</i>`;
}
