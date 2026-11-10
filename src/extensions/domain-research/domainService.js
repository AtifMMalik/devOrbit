/**
 * Domain Name Research Service
 * Provides domain verification, TLD expansion, and AI name suggestion generation.
 */

export const POPULAR_TLDS = [
  { tld: '.com', price: '$12.99/yr', popular: true },
  { tld: '.dev', price: '$14.99/yr', popular: true },
  { tld: '.io', price: '$39.99/yr', popular: true },
  { tld: '.ai', price: '$69.99/yr', popular: true },
  { tld: '.app', price: '$15.99/yr', popular: true },
  { tld: '.co', price: '$24.99/yr', popular: true },
];

const KNOWN_TAKEN = new Set([
  'google', 'apple', 'microsoft', 'github', 'amazon', 'facebook', 'twitter', 'stripe', 'vercel', 'devorbit'
]);

/**
 * Check availability for a search term across selected TLDs
 */
export function checkDomainAvailability(searchTerm, selectedTlds = ['.com', '.dev', '.io', '.ai', '.app', '.co']) {
  if (!searchTerm || !searchTerm.trim()) return [];

  const clean = searchTerm.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
  if (!clean) return [];

  return selectedTlds.map((tld) => {
    const domain = `${clean}${tld}`;
    const tldInfo = POPULAR_TLDS.find((t) => t.tld === tld) || { price: '$19.99/yr' };
    
    // Simulate deterministic realistic status
    const isTaken = KNOWN_TAKEN.has(clean) && (tld === '.com' || tld === '.io');
    const isShort = clean.length <= 4;
    const isPremium = isShort && !isTaken;

    return {
      domain,
      name: clean,
      tld,
      status: isTaken ? 'taken' : isPremium ? 'premium' : 'available',
      price: isPremium ? '$299.00/yr' : tldInfo.price,
      registrarUrl: `https://domains.google.com/registrar/search?searchTerm=${domain}`,
    };
  });
}

/**
 * AI-assisted domain suggestions generator based on project context
 */
export function generateAIDomainSuggestions(projectTitle = '', projectDescription = '') {
  const seed = (projectTitle + ' ' + projectDescription).toLowerCase();
  
  // Extract keywords
  const keywords = seed
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['and', 'for', 'the', 'with', 'this', 'that', 'project', 'app'].includes(w));

  const baseWord = keywords[0] || 'orbit';
  const secondWord = keywords[1] || 'flow';

  const prefixes = ['get', 'use', 'try', 'the', 'hyper', 'omni', 'go', 'open'];
  const suffixes = ['hq', 'app', 'hub', 'lab', 'stack', 'pulse', 'sync', 'craft', 'kit', 'pilot'];

  const suggestions = [
    `${baseWord}flow.dev`,
    `${baseWord}stack.io`,
    `get${baseWord}.app`,
    `${baseWord}${suffixes[Math.floor(Math.random() * suffixes.length)]}.ai`,
    `${prefixes[Math.floor(Math.random() * prefixes.length)]}${baseWord}.dev`,
    `${baseWord}${secondWord}.io`,
    `${secondWord}${baseWord}.app`,
    `open${baseWord}.dev`,
  ];

  // Return unique suggestions with metadata
  const unique = Array.from(new Set(suggestions));
  return unique.slice(0, 6).map((domain) => {
    const parts = domain.split('.');
    const tld = '.' + parts[1];
    const tldInfo = POPULAR_TLDS.find((t) => t.tld === tld) || { price: '$14.99/yr' };

    return {
      domain,
      name: parts[0],
      tld,
      status: 'available',
      price: tldInfo.price,
      aiGenerated: true,
      registrarUrl: `https://domains.google.com/registrar/search?searchTerm=${domain}`,
    };
  });
}

