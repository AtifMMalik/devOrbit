import { describe, it } from 'node:test';
import assert from 'node:assert';
import { analyzeTextSpelling, ignoreWordForSession } from '../src/utils/spellChecker.js';
import { parseMarkdownToBlocks, serializeBlocks, isImageUrl, extractImageNameFromUrl } from '../src/utils/imageUtils.js';

describe('Spell Checker Engine & Word-Style Inline Detection', () => {
  it('detects misspelled words and provides suggestions', () => {
    const text = 'This is a mistack in the setence.';
    const errors = analyzeTextSpelling(text);

    assert.ok(errors.length >= 2, 'Should detect misspelled words');
    const mistakeErr = errors.find((e) => e.word.toLowerCase() === 'mistack');
    assert.ok(mistakeErr, 'Should detect "mistack"');
    assert.ok(mistakeErr.suggestions.includes('mistake'), 'Should suggest "mistake"');
    assert.strictEqual(mistakeErr.start, 10);
    assert.strictEqual(mistakeErr.end, 17);
  });

  it('respects ignored words during session', () => {
    ignoreWordForSession('mycustomframework');
    const errors = analyzeTextSpelling('We use mycustomframework for tests');
    const found = errors.find((e) => e.word.toLowerCase() === 'mycustomframework');
    assert.strictEqual(found, undefined, 'Ignored word should not be reported as error');
  });

  it('does not flag common developer technical terms', () => {
    const devText = 'async await websocket backend frontend redux graphql kubernetes vite webp';
    const errors = analyzeTextSpelling(devText);
    assert.strictEqual(errors.length, 0, 'Technical developer terms should be accepted');
  });

  it('correctly validates complex real-world text with Web Vitals, metrics, and units', () => {
    const sampleText = 'Run lighthouse audit and ensure Largest Contentful Paint (LCP) remains under 1.2s across';
    const errors = analyzeTextSpelling(sampleText);
    assert.strictEqual(errors.length, 0, 'Valid sentence with LCP, units (1.2s), and Web Vitals should produce 0 false errors');

    const typosText = 'Run lighthous audit and ensur Largest Contentful Paint (LCP) remayns undr 1.2s acros';
    const typoErrors = analyzeTextSpelling(typosText);
    const misspelledWords = typoErrors.map((e) => e.word.toLowerCase());
    assert.ok(misspelledWords.includes('lighthous'), 'Flags lighthous');
    assert.ok(misspelledWords.includes('ensur'), 'Flags ensur');
    assert.ok(misspelledWords.includes('remayns'), 'Flags remayns');
    assert.ok(misspelledWords.includes('undr'), 'Flags undr');
    assert.ok(misspelledWords.includes('acros'), 'Flags acros');
    assert.strictEqual(misspelledWords.includes('lcp'), false, 'Does not flag acronym LCP');
  });
});

describe('Issue Image Markdown Format', () => {
  it('formats image markdown tag with data-URL cleanly', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const alt = 'Architecture Diagram';
    const imageMarkdown = `\n\n![${alt}](${dataUrl})\n\n`;

    assert.ok(imageMarkdown.includes(`![${alt}](${dataUrl})`));
    // Test that image regex matches
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const match = imageMarkdown.match(imgRegex);
    assert.ok(match, 'Regex should match markdown image');
    assert.strictEqual(match[1], alt);
    assert.strictEqual(match[2], dataUrl);
  });

  it('parses markdown with base64 data URL into visual image blocks and clean text blocks', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const markdown = `Bug description overview.\n\n![Screenshot 1](${dataUrl})\n\nExpected behavior note.`;

    const blocks = parseMarkdownToBlocks(markdown);
    assert.strictEqual(blocks.length, 3, 'Should parse into text, image, and text blocks');
    assert.strictEqual(blocks[0].type, 'text');
    assert.ok(blocks[0].content.includes('Bug description overview.'));
    // Ensure raw data URL is NOT inside the text block content
    assert.strictEqual(blocks[0].content.includes('data:image/'), false);

    assert.strictEqual(blocks[1].type, 'image');
    assert.strictEqual(blocks[1].alt, 'Screenshot 1');
    assert.strictEqual(blocks[1].url, dataUrl);

    assert.strictEqual(blocks[2].type, 'text');
    assert.ok(blocks[2].content.includes('Expected behavior note.'));
    assert.strictEqual(blocks[2].content.includes('data:image/'), false);

    const serialized = serializeBlocks(blocks);
    assert.ok(serialized.includes(`![Screenshot 1](${dataUrl})`));
  });

  it('automatically detects standalone image URLs like web PNGs and converts them to image blocks', () => {
    const rawUrl = 'https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png';
    const text = `Check out the new design banner:\n${rawUrl}\nLooks awesome!`;

    assert.strictEqual(isImageUrl(rawUrl), true, 'isImageUrl should recognize web PNG URL');
    assert.strictEqual(extractImageNameFromUrl(rawUrl), 'salesrephero', 'Should extract clean filename as image title');

    const blocks = parseMarkdownToBlocks(text);
    assert.strictEqual(blocks.length, 3, 'Should parse into text, image, and text blocks');

    assert.strictEqual(blocks[0].type, 'text');
    assert.ok(blocks[0].content.includes('Check out the new design banner:'));
    assert.strictEqual(blocks[0].content.includes(rawUrl), false, 'Raw URL should not remain in text block');

    assert.strictEqual(blocks[1].type, 'image');
    assert.strictEqual(blocks[1].alt, 'salesrephero');
    assert.strictEqual(blocks[1].url, rawUrl);

    assert.strictEqual(blocks[2].type, 'text');
    assert.ok(blocks[2].content.includes('Looks awesome!'));

    const serialized = serializeBlocks(blocks);
    assert.ok(serialized.includes(`![salesrephero](${rawUrl})`), 'Serializes as markdown image');
  });
});

