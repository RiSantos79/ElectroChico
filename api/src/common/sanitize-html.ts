import sanitizeHtml from 'sanitize-html';

// Descrições de produto vêm de um editor de texto rico no admin e podem
// incluir HTML colado de outros sites — nunca guardamos isso sem filtrar,
// mesmo vindo de uma conta de admin autenticada.
export function sanitizeDescription(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: { a: ['href', 'rel', 'target'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
    },
  });
}
