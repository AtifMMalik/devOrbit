/**
 * devOrbit Intelligent Spell Checker Engine
 * Powered by comprehensive English lexicon (220,000+ words) and developer vocabulary.
 * Provides word verification, typo detection, Levenshtein distance suggestions,
 * and user-dictionary persistence (Google Docs-style).
 */

import { DICT_PACKED } from './englishDictionary.js';

const USER_DICT_KEY = 'devorbit_user_dictionary';

// Priority list of common English and developer words for suggestion ranking
export const COMMON_VOCABULARY = new Set([
  // Common verbs & nouns
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not',
  'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from',
  'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would',
  'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which',
  'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
  'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'us', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'does', 'did',
  'done', 'doing', 'shall', 'should', 'may', 'might', 'must', 'can', 'cannot',

  // Actions & Tasks
  'implement', 'implemented', 'implementing', 'implementation', 'feature', 'features',
  'bug', 'bugs', 'issue', 'issues', 'fix', 'fixes', 'fixed', 'fixing', 'update',
  'updates', 'updated', 'updating', 'create', 'creates', 'created', 'creating',
  'creation', 'delete', 'deletes', 'deleted', 'deleting', 'deletion', 'remove',
  'removes', 'removed', 'removing', 'add', 'adds', 'added', 'adding', 'save',
  'saves', 'saved', 'saving', 'edit', 'edits', 'edited', 'editing', 'cancel',
  'cancels', 'cancelled', 'canceling', 'discard', 'discards', 'discarded',
  'discarding', 'build', 'builds', 'built', 'building', 'test', 'tests', 'tested',
  'testing', 'verify', 'verifies', 'verified', 'verifying', 'verification',
  'deploy', 'deploys', 'deployed', 'deploying', 'deployment', 'check', 'checks',
  'checked', 'checking', 'checklist', 'checklists', 'task', 'tasks', 'project',
  'projects', 'idea', 'ideas', 'note', 'notes', 'doc', 'docs', 'document',
  'documents', 'documentation', 'specification', 'specifications', 'spec', 'specs',
  'priority', 'priorities', 'urgent', 'high', 'medium', 'low', 'critical',
  'status', 'current', 'later', 'done', 'open', 'closed', 'resolved', 'in-progress',
  'code', 'codes', 'coded', 'coding', 'review', 'reviews', 'reviewed', 'reviewing',
  'user', 'users', 'client', 'clients', 'server', 'servers', 'system', 'systems',
  'architecture', 'architectures', 'design', 'designs', 'designed', 'designing',
  'performance', 'speed', 'scale', 'scaling', 'scalable', 'scalability', 'security',
  'secure', 'secured', 'securing', 'login', 'logout', 'signin', 'signout', 'signup',
  'profile', 'profiles', 'setting', 'settings', 'preference', 'preferences',
  'option', 'options', 'custom', 'default', 'defaults', 'template', 'templates',
  'title', 'titles', 'description', 'descriptions', 'prompt', 'prompts', 'name',
  'names', 'label', 'labels', 'tag', 'tags', 'color', 'colors', 'deadline', 'deadlines',
  'date', 'dates', 'time', 'times', 'author', 'authors', 'link', 'links', 'url', 'urls',
  'repository', 'repositories', 'repo', 'repos', 'export', 'exports', 'exported',
  'exporting', 'import', 'imports', 'imported', 'importing', 'copy', 'copies',
  'copied', 'copying', 'cut', 'paste', 'pastes', 'pasted', 'pasting', 'clipboard',
  'drag', 'drop', 'draggable', 'droppable', 'mouse', 'keyboard', 'gesture', 'gestures',
  'click', 'clicks', 'clicked', 'clicking', 'hover', 'hovers', 'hovered', 'hovering',
  'focus', 'focused', 'focusing', 'blur', 'blurred', 'select', 'selects', 'selected',
  'selection', 'filter', 'filters', 'filtered', 'filtering', 'search', 'searches',
  'searched', 'searching', 'query', 'queries', 'keyword', 'keywords', 'find', 'finds',
  'found', 'match', 'matches', 'matched', 'matching', 'screen', 'screens', 'page',
  'pages', 'view', 'views', 'board', 'boards', 'column', 'columns', 'row', 'rows',
  'card', 'cards', 'item', 'items', 'list', 'lists', 'group', 'groups', 'order',
  'orders', 'ordered', 'ordering', 'reorder', 'reorders', 'reordered', 'reordering',
  'step', 'steps', 'phase', 'phases', 'stage', 'stages', 'level', 'levels',
  'error', 'errors', 'warning', 'warnings', 'info', 'success', 'fail', 'fails',
  'failed', 'failing', 'failure', 'retry', 'retries', 'retried', 'retrying',
  'handle', 'handles', 'handled', 'handling', 'handler', 'handlers', 'process',
  'processes', 'processed', 'processing', 'event', 'events', 'listener', 'listeners',
  'support', 'supports', 'supported', 'supporting', 'require', 'requires',
  'required', 'requirement', 'requirements', 'need', 'needs', 'needed', 'help',
  'helps', 'helped', 'clear', 'clears', 'cleared', 'clearing', 'reset', 'resets',
  'submit', 'submits', 'submitted', 'submitting', 'form', 'forms', 'input', 'inputs',
  'output', 'outputs', 'value', 'values', 'change', 'changes', 'changed', 'changing',
  'toggle', 'toggles', 'toggled', 'toggling', 'enable', 'enables', 'enabled',
  'disable', 'disables', 'disabled', 'active', 'inactive', 'valid', 'invalid',
  'complete', 'completes', 'completed', 'completing', 'completion', 'incomplete',
  'progress', 'rate', 'rates', 'count', 'counts', 'total', 'totals',
  'some', 'none', 'empty', 'full', 'blank', 'clean', 'dirty', 'fresh', 'raw',
  'ready', 'draft', 'drafts', 'exploring', 'converted', 'convert', 'converts',
  'converting', 'conversion', 'incubate', 'incubates', 'incubated', 'incubating',
  'concept', 'concepts', 'vision', 'roadmap', 'roadmaps', 'goal', 'goals',
  'scope', 'scopes', 'deliverable', 'deliverables', 'milestone', 'milestones',
  'procedure', 'procedures', 'policy', 'policies', 'rule', 'rules', 'guide',
  'guides', 'guideline', 'guidelines', 'standard', 'standards', 'best', 'practice',
  'practices', 'pattern', 'patterns', 'example', 'examples', 'sample', 'samples',
  'simple', 'modern', 'fast', 'smooth', 'sleek', 'responsive', 'mobile',
  'desktop', 'tablet', 'browser', 'browsers', 'window', 'windows', 'tab', 'tabs',
  'offline', 'online', 'sync', 'syncs', 'synced', 'syncing', 'synchronize',
  'storage', 'store', 'stores', 'stored', 'storing', 'persist', 'persists',
  'persisted', 'persisting', 'persistence', 'memory', 'cache', 'caches', 'cached',
  'caching', 'local', 'session', 'cookie', 'cookies', 'token', 'tokens',
  'correct', 'spelling', 'spellcheck', 'suggest', 'suggestion', 'suggestions',
  'mistake', 'mistakes', 'sentence', 'sentences',
  'dictionary', 'word', 'words', 'text', 'string', 'character', 'characters',

  // Engineering & Web Vitals terminology
  'lighthouse', 'audit', 'audits', 'auditing', 'audited', 'ensure', 'ensures', 'ensured', 'ensuring',
  'largest', 'contentful', 'paint', 'paints', 'remains', 'under', 'across', 'latency', 'seconds',
  'milliseconds', 'render', 'renders', 'rendering', 'speed', 'score', 'scores', 'metric', 'metrics',
  'lcp', 'cls', 'fid', 'inp', 'fcp', 'ttfb', 'seo', 'accessibility', 'viewport', 'responsive',
  'api', 'apis', 'auth', 'oauth', 'endpoint', 'endpoints', 'json', 'yaml', 'xml', 'csv', 'sql',
  'nosql', 'postgres', 'postgresql', 'mysql', 'redis', 'mongodb', 'sqlite', 'database', 'databases',
  'frontend', 'backend', 'fullstack', 'react', 'vue', 'angular', 'svelte', 'typescript', 'javascript',
  'python', 'golang', 'rust', 'docker', 'kubernetes', 'k8s', 'webhook', 'webhooks', 'middleware',
  'middlewares', 'refactor', 'refactoring', 'hotfix', 'hotfixes', 'subtask', 'subtasks', 'async',
  'await', 'promise', 'promises', 'github', 'git', 'commit', 'commits', 'pr', 'prs', 'ci', 'cd',
  'devops', 'workflow', 'workflows', 'kanban', 'scrum', 'sprint', 'sprints', 'uuid', 'regex',
  'href', 'dom', 'css', 'html', 'http', 'https', 'rest', 'restful', 'crud', 'cli', 'sdk', 'npm',
  'vite', 'vscode', 'config', 'configs', 'configuration', 'param', 'params', 'parameter', 'parameters',
  'arg', 'args', 'argument', 'arguments', 'payload', 'payloads', 'schema', 'schemas', 'migration',
  'migrations', 'lint', 'linter', 'linting', 'redux', 'graphql', 'webp', 'svg', 'png', 'jpg', 'jpeg',
  'boolean', 'integer', 'null', 'undefined', 'component', 'components', 'state', 'props', 'hook',
  'hooks', 'util', 'utils', 'utility', 'utilities', 'helper', 'helpers', 'service', 'services',
  'controller', 'controllers', 'route', 'routes', 'router', 'routers', 'routing', 'modal', 'modals',
  'dialog', 'dialogs', 'tooltip', 'tooltips', 'dropdown', 'dropdowns', 'sidebar', 'sidebars',
  'navbar', 'navbars', 'header', 'headers', 'footer', 'footers', 'layout', 'layouts', 'badge',
  'badges', 'avatar', 'avatars', 'checkbox', 'checkboxes', 'textarea', 'textareas', 'preloader',
  'preloaders', 'devorbit', 'workspace', 'workspaces', 'analytics', 'heatmap', 'overview',
  'incubator', 'orchestrator', 'telemetry', 'proxy', 'serverless', 'microservice', 'microservices',
  'monorepo', 'pipeline', 'pipelines', 'observability', 'bandwidth', 'throughput', 'concurrency',
  'mutex', 'thread', 'threads', 'daemon', 'cron', 'queue', 'queues', 'pubsub', 'kafka', 'rabbitmq',
  'websocket', 'websockets', 'sse', 'socket', 'sockets', 'jwt', 'cors', 'csrf', 'xss', 'ssl',
  'tls', 'ssh', 'dns', 'cdn', 's3', 'ec2', 'gcp', 'vercel', 'netlify', 'supabase', 'firebase',
  'prisma', 'typeorm', 'tailwind', 'zustand', 'pnpm', 'deno',

  // Contractions
  "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't", "hadn't",
  "doesn't", "didn't", "shouldn't", "wouldn't", "couldn't", "it's", "that's", "there's", "here's",
  "what's", "let's", "i'm", "you're", "he's", "she's", "we're", "they're", "i've", "you've", "we've",
  "they've", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "i'd", "you'd", "he'd", "she'd",
  "we'd", "they'd",
]);

// Full in-memory dictionary Set initialized from DICT_PACKED
let dictionarySet = null;
let wordsByLength = null;

function ensureDictionary() {
  if (!dictionarySet) {
    const rawWords = DICT_PACKED.split(' ');
    dictionarySet = new Set(rawWords);
    // Add all common vocabulary words
    for (const w of COMMON_VOCABULARY) {
      dictionarySet.add(w.toLowerCase());
    }

    // Build length buckets for sub-10ms suggestion lookups
    wordsByLength = {};
    for (const w of dictionarySet) {
      const len = w.length;
      if (!wordsByLength[len]) wordsByLength[len] = [];
      wordsByLength[len].push(w);
    }
  }
}

// In-memory set of ignored words during this active session
const ignoredWords = new Set();

/**
 * Load user custom dictionary from localStorage.
 * @returns {Set<string>}
 */
export const getUserDictionary = () => {
  try {
    const raw = localStorage.getItem(USER_DICT_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map((w) => String(w).toLowerCase().trim()));
      }
    }
  } catch (_e) {
    // Ignore storage parse errors
  }
  return new Set();
};

/**
 * Add a word to the user dictionary and persist it.
 * @param {string} word
 */
export const addToUserDictionary = (word) => {
  if (!word || typeof word !== 'string') return;
  const clean = word.toLowerCase().trim();
  if (!clean) return;

  const current = getUserDictionary();
  current.add(clean);
  try {
    localStorage.setItem(USER_DICT_KEY, JSON.stringify([...current]));
  } catch (_e) {
    // Ignore storage quota errors
  }
};

/**
 * Ignore a word for the current session.
 * @param {string} word
 */
export const ignoreWordForSession = (word) => {
  if (!word) return;
  ignoredWords.add(word.toLowerCase().trim());
};

/**
 * Computes Levenshtein edit distance between two strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export const getEditDistance = (a, b) => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

/**
 * Get top spelling suggestions for a misspelled word.
 * @param {string} word
 * @param {number} maxSuggestions
 * @returns {string[]}
 */
export const getSpellingSuggestions = (word, maxSuggestions = 3) => {
  const norm = word.toLowerCase().trim();
  if (norm.length < 2) return [];

  ensureDictionary();
  const userDict = getUserDictionary();

  // Search length-bounded candidates (length - 1, length, length + 1)
  const candidates = [];
  for (let l = norm.length - 1; l <= norm.length + 1; l++) {
    if (wordsByLength[l]) candidates.push(...wordsByLength[l]);
  }
  for (const w of userDict) {
    if (Math.abs(w.length - norm.length) <= 1) candidates.push(w);
  }

  const matches = [];

  for (const candidate of candidates) {
    // Only check candidate if length diff <= 1
    if (Math.abs(candidate.length - norm.length) > 1) continue;

    const dist = getEditDistance(norm, candidate);
    if (dist <= 2) {
      const isCommon = COMMON_VOCABULARY.has(candidate);
      const firstSame = candidate[0] === norm[0];
      matches.push({ word: candidate, dist, isCommon, firstSame });
    }
  }

  matches.sort((a, b) => {
    // Prioritize common vocabulary words if within 1 edit of best
    if (a.dist !== b.dist) {
      if (a.isCommon && a.dist <= b.dist + 1) return -1;
      if (b.isCommon && b.dist <= a.dist + 1) return 1;
      return a.dist - b.dist;
    }
    if (a.isCommon !== b.isCommon) return a.isCommon ? -1 : 1;
    if (a.firstSame !== b.firstSame) return a.firstSame ? -1 : 1;
    return a.word.length - b.word.length;
  });

  // Preserve initial capitalization if user capitalized word
  const isCapitalized = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();

  return matches.slice(0, maxSuggestions).map((m) => {
    if (isCapitalized) {
      return m.word.charAt(0).toUpperCase() + m.word.slice(1);
    }
    return m.word;
  });
};

/**
 * Checks whether a single word is spelled correctly.
 * @param {string} word
 * @param {string} [fullText='']
 * @param {number} [start=0]
 * @returns {boolean}
 */
export const isWordValid = (word, fullText = '', start = 0) => {
  if (!word) return true;

  // Preceding number check: units attached to numbers like 1.2s, 100ms, 500kb, 10px, 4rem
  if (start > 0 && fullText) {
    const prevChar = fullText[start - 1];
    if (/[\d.]/.test(prevChar)) {
      const sliceBefore = fullText.slice(Math.max(0, start - 6), start);
      if (/\d/.test(sliceBefore)) {
        return true;
      }
    }
  }

  // Single characters: 'a' and 'i' are valid English words
  if (word.length === 1) {
    const l = word.toLowerCase();
    return l === 'a' || l === 'i';
  }

  // Acronyms check: all-caps words of length 2-6 (e.g. LCP, API, SEO, PR, CI, CD, SQL, UUID, UI, UX)
  if (/^[A-Z0-9]+$/.test(word) && word.length <= 6) {
    return true;
  }

  const clean = word.toLowerCase().trim();

  // Pure numbers or alphanumeric identifiers like task_1, sha256, v2, h1
  if (/^\d+$/.test(clean) || /\d/.test(clean)) return true;

  // Hyphenated tech terms or flags like --port, pre-flight
  if (clean.startsWith('--') || clean.startsWith('-')) return true;

  // URLs, paths, or code variables with dots / slashes / underscores / colons
  if (clean.includes('/') || clean.includes('.') || clean.includes('_') || clean.includes(':')) {
    return true;
  }

  ensureDictionary();

  // Check dictionary
  if (dictionarySet.has(clean)) return true;

  // Check session ignored words
  if (ignoredWords.has(clean)) return true;

  // Check user custom dictionary
  const userDict = getUserDictionary();
  if (userDict.has(clean)) return true;

  // Suffix rules for English morphology
  if (clean.endsWith('s') && dictionarySet.has(clean.slice(0, -1))) return true;
  if (clean.endsWith('es') && (dictionarySet.has(clean.slice(0, -2)) || dictionarySet.has(clean.slice(0, -1)))) return true;
  if (clean.endsWith('ed') && (dictionarySet.has(clean.slice(0, -2)) || dictionarySet.has(clean.slice(0, -1)))) return true;
  if (clean.endsWith('ing') && (dictionarySet.has(clean.slice(0, -3)) || dictionarySet.has(clean.slice(0, -3) + 'e'))) return true;
  if (clean.endsWith('er') && (dictionarySet.has(clean.slice(0, -2)) || dictionarySet.has(clean.slice(0, -1)))) return true;
  if (clean.endsWith('est') && (dictionarySet.has(clean.slice(0, -3)) || dictionarySet.has(clean.slice(0, -2)))) return true;
  if (clean.endsWith('ly') && dictionarySet.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('able') && dictionarySet.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('ible') && dictionarySet.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('ment') && dictionarySet.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('ness') && dictionarySet.has(clean.slice(0, -4))) return true;
  if (clean.endsWith('ful') && dictionarySet.has(clean.slice(0, -3))) return true;
  if (clean.endsWith('less') && dictionarySet.has(clean.slice(0, -4))) return true;

  return false;
};

/**
 * Analyzes a full text string and returns all misspelled words with character ranges and suggestions.
 * @param {string} text
 * @returns {Array<{ word: string, start: number, end: number, suggestions: string[] }>}
 */
export const analyzeTextSpelling = (text) => {
  if (!text || typeof text !== 'string') return [];

  const results = [];
  // Match contiguous letters and apostrophes
  const regex = /[a-zA-Z]+(?:'[a-zA-Z]+)?/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    if (!isWordValid(word, text, start)) {
      const suggestions = getSpellingSuggestions(word);
      results.push({
        word,
        start,
        end,
        suggestions,
      });
    }
  }

  return results;
};
