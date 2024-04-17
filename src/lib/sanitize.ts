import sanitizeHtml from 'sanitize-html';

// https://core.telegram.org/bots/api#html-style

const sanitizeOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 's', 'strike', 'u', 'ins', 'del', 'tg-spoiler', 'a', 'code', 'pre'],
  allowedAttributes: {
    'a': [ 'href' ],
    'code': ['class'],
    // 'span': ['class'], 'tg-spoiler'
  },
}

export const sanitizeHtmlTelegram = (messageText: string) => {
  return sanitizeHtml(
    messageText
      .replace(/<br\s?\/?>/g, "\n")
      .replace(/\n?<\/p>/g, "\n</p>")
    ,
    sanitizeOptions
  );
}

export const sanitizeHtmlDefault = (messageText: string) => {
  return sanitizeHtmlTelegram(messageText);
}
