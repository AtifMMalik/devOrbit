import { describe, it } from 'node:test';
import assert from 'node:assert';

function splitByKeyword(text, keyword) {
  if (!text || !keyword || !keyword.trim()) return [text];
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text).split(new RegExp(`(${escaped})`, 'gi'));
}

describe('Search & In-Page Keyword Highlight Logic', () => {
  it('correctly splits string by search keyword preserving original casing', () => {
    const text = 'Implement React 19 Kanban with Fast Search and Markdown';
    const parts = splitByKeyword(text, 'kanban');

    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[0], 'Implement React 19 ');
    assert.strictEqual(parts[1], 'Kanban');
    assert.strictEqual(parts[2], ' with Fast Search and Markdown');
  });

  it('handles multiple occurrences of search keyword', () => {
    const text = 'Fix searchbar bug in search modal and search input';
    const parts = splitByKeyword(text, 'search');

    assert.strictEqual(parts.length, 7); // [ 'Fix ', 'search', 'bar bug in ', 'search', ' modal and ', 'search', ' input' ]
    const matchedParts = parts.filter((p) => p.toLowerCase() === 'search');
    assert.strictEqual(matchedParts.length, 3);
  });

  it('handles special regex characters safely in search query', () => {
    const text = 'Check [CRITICAL] regex? (test+case) *now*';
    const parts = splitByKeyword(text, '(test+case)');

    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[1], '(test+case)');
  });

  it('correctly computes next and previous index in match cycling', () => {
    const totalMatches = 5;

    // Next from -1 (initial) -> 0
    let current = -1;
    let next = current < 0 ? 0 : (current + 1) % totalMatches;
    assert.strictEqual(next, 0);

    // Next from 0 -> 1
    current = 0;
    next = (current + 1) % totalMatches;
    assert.strictEqual(next, 1);

    // Next from 4 (wrap around) -> 0
    current = 4;
    next = (current + 1) % totalMatches;
    assert.strictEqual(next, 0);

    // Prev from 0 (wrap around) -> 4
    current = 0;
    let prev = current <= 0 ? totalMatches - 1 : (current - 1) % totalMatches;
    assert.strictEqual(prev, 4);
  });
});

