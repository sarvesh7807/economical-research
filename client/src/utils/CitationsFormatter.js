/**
 * CitationsFormatter — formats cited sources into APA, MLA, Chicago, and Harvard academic styles.
 */

export function formatAPA(src) {
  const domain = src.domain || 'source';
  const title = src.title || 'Economic Indicators Research Brief';
  const date = src.date || 'n.d.';
  const year = date.split('-')[0] || 'n.d.';
  return `${domain.toUpperCase()}. (${year}). ${title}. Retrieved from https://${domain}`;
}

export function formatMLA(src) {
  const domain = src.domain || 'source';
  const title = src.title || 'Economic Indicators Research Brief';
  const date = src.date || 'n.d.';
  return `"${title}." ${domain.toUpperCase()}, ${date}, https://${domain}.`;
}

export function formatChicago(src) {
  const domain = src.domain || 'source';
  const title = src.title || 'Economic Indicators Research Brief';
  const date = src.date || 'n.d.';
  return `"${title}." ${domain.toUpperCase()}. Last modified ${date}. https://${domain}.`;
}

export function formatHarvard(src) {
  const domain = src.domain || 'source';
  const title = src.title || 'Economic Indicators Research Brief';
  const date = src.date || 'n.d.';
  const year = date.split('-')[0] || 'n.d.';
  return `${domain.toUpperCase()}, ${year}. ${title}. [online] Available at: <https://${domain}>.`;
}

/**
 * Compile all citations into a single text packet for file downloading.
 */
export function compileBibliographyText(sources = []) {
  if (!sources.length) return 'No sources cited in this report.';

  let text = 'ECONOMICAL RESEARCH AI — BIBLIOGRAPHY REFERENCE PACKET\n';
  text += `Generated: ${new Date().toLocaleDateString()}\n`;
  text += '==================================================\n\n';

  sources.forEach((src, idx) => {
    text += `[${idx + 1}] Domain: ${src.domain}\n`;
    text += `APA:     ${formatAPA(src)}\n`;
    text += `MLA:     ${formatMLA(src)}\n`;
    text += `Chicago: ${formatChicago(src)}\n`;
    text += `Harvard: ${formatHarvard(src)}\n`;
    text += '--------------------------------------------------\n\n';
  });

  return text;
}
