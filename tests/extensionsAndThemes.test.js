import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  checkDomainAvailability,
  generateAIDomainSuggestions,
} from '../src/extensions/domain-research/domainService.js';
import {
  saveSketchIllustration,
  getSketchIllustration,
  deleteSketchIllustration,
} from '../src/extensions/sketchboard/sketchStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Theme Architecture & Pure Token Enforcement', () => {
  it('src/theme contains all 7 mandatory Hue & View files', () => {
    const requiredFiles = [
      'variables.css',
      'lightMode.css',
      'darkMode.css',
      'elements.css',
      'components.css',
      'theme.css',
      'README.md',
    ];

    const themeDir = path.join(rootDir, 'src', 'theme');
    assert.ok(fs.existsSync(themeDir), 'src/theme directory must exist');

    for (const file of requiredFiles) {
      const filePath = path.join(themeDir, file);
      assert.ok(fs.existsSync(filePath), `Required theme file ${file} must exist in src/theme`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 0, `${file} must not be empty`);
    }
  });

  it('src/index.css strictly imports ./theme/theme.css and contains zero hardcoded colors', () => {
    const indexPath = path.join(rootDir, 'src', 'index.css');
    assert.ok(fs.existsSync(indexPath), 'src/index.css must exist');
    const content = fs.readFileSync(indexPath, 'utf-8');

    // Must import ./theme/theme.css
    assert.ok(
      content.includes("@import './theme/theme.css';") || content.includes('@import "./theme/theme.css";'),
      'src/index.css must import theme.css from ./theme/'
    );

    // Must not contain hardcoded hex colors (#xxx or #xxxxxx) outside comments
    const lines = content.split('\n');
    const violations = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.endsWith('*/')) return;
      if (/#([0-9a-fA-F]{3,8})\b/.test(line)) {
        violations.push({ line: idx + 1, content: line });
      }
    });

    assert.strictEqual(
      violations.length,
      0,
      `Found hardcoded color values in src/index.css: ${JSON.stringify(violations)}`
    );
  });
});

describe('Extensions System & Manifest Architecture', () => {
  it('extensions.json has valid structure and includes core extensions', () => {
    const manifestPath = path.join(rootDir, 'src', 'extensions', 'extensions.json');
    assert.ok(fs.existsSync(manifestPath), 'src/extensions/extensions.json must exist');
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw);

    assert.ok(Array.isArray(manifest), 'extensions.json must be an array');
    assert.ok(manifest.length >= 20, 'extensions.json must contain at least 20 extensions (16 themes + tools)');

    const expectedThemeSlugs = [
      'aggressive-red', 'black-forest', 'classy-kimono', 'cyberpunk-neon',
      'devorbit-default', 'emerald-forest', 'german-engineering', 'nordic-frost',
      'ocean-breeze', 'paper-pen', 'precision-blueprint', 'professional-blue',
      'solar-sunset', 'soothing-green', 'tokyo-vibes', 'winter-crystals'
    ];

    for (const slug of expectedThemeSlugs) {
      const themeId = `theme-${slug}`;
      const ext = manifest.find((e) => e.id === themeId);
      assert.ok(ext, `Theme extension "${themeId}" must exist in extensions.json`);
      assert.strictEqual(ext.type, 'theme', `Theme "${themeId}" must have type "theme"`);
      assert.strictEqual(ext.enabled, false, `Theme "${themeId}" must be disabled by default (Item 8)`);
    }

    const expectedTools = ['spellcheck', 'domain-research', 'sketchboard', 'pomodoro', 'markdown-exporter'];
    for (const id of expectedTools) {
      const ext = manifest.find((e) => e.id === id);
      assert.ok(ext, `Tool extension "${id}" must exist in extensions.json`);
      assert.strictEqual(ext.installed, true, `Tool "${id}" must be installed`);
      assert.strictEqual(ext.enabled, true, `Tool "${id}" must be enabled`);
    }
  });

  it('activity log maintains valid activity records', () => {
    const logPath = path.join(rootDir, 'src', 'extensions', 'logs', 'activity.log.json');
    assert.ok(fs.existsSync(logPath), 'activity.log.json must exist');
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));

    assert.ok(Array.isArray(logs), 'activity.log.json must be an array');
    assert.ok(logs.length > 0, 'activity.log.json must have initial entries');
    const first = logs[0];
    assert.ok(first.timestamp, 'Log entry must have timestamp');
    assert.ok(first.action, 'Log entry must have action (install, enable, etc.)');
    assert.ok(first.extensionId, 'Log entry must have extensionId');
  });

  it('theme extensions in src/extensions/themes contain all 16 themes with Hue & View 7-file structure', () => {
    const themes = [
      'aggressive-red', 'black-forest', 'classy-kimono', 'cyberpunk-neon',
      'devorbit-default', 'emerald-forest', 'german-engineering', 'nordic-frost',
      'ocean-breeze', 'paper-pen', 'precision-blueprint', 'professional-blue',
      'solar-sunset', 'soothing-green', 'tokyo-vibes', 'winter-crystals'
    ];
    const requiredFiles = [
      'variables.css',
      'lightMode.css',
      'darkMode.css',
      'elements.css',
      'components.css',
      'theme.css',
      'README.md',
    ];

    assert.strictEqual(themes.length, 16, 'Must contain all 16 themes');

    for (const themeId of themes) {
      const themeDir = path.join(rootDir, 'src', 'extensions', 'themes', themeId);
      assert.ok(fs.existsSync(themeDir), `Theme directory ${themeId} must exist in src/extensions/themes/`);
      for (const file of requiredFiles) {
        assert.ok(
          fs.existsSync(path.join(themeDir, file)),
          `Theme ${themeId} must contain ${file}`
        );
      }
    }
  });

  it('extensions/assets contains theme icon mappings', () => {
    const assetsDir = path.join(rootDir, 'src', 'extensions', 'assets');
    assert.ok(fs.existsSync(assetsDir), 'src/extensions/assets must exist');
    assert.ok(fs.existsSync(path.join(assetsDir, 'themeIcons.jsx')), 'themeIcons.jsx must exist');
    assert.ok(fs.existsSync(path.join(assetsDir, 'index.js')), 'index.js must exist');
  });
});

describe('Domain Name Research Extension Logic', () => {
  it('formats clean domain name and checks availability across selected TLDs', () => {
    const results = checkDomainAvailability('mytestapp', ['.com', '.dev', '.io']);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].domain, 'mytestapp.com');
    assert.strictEqual(results[0].tld, '.com');
    assert.strictEqual(results[0].status, 'available');
    assert.ok(results[0].price, 'Price must be provided');
  });

  it('detects taken domains correctly for well-known terms', () => {
    const results = checkDomainAvailability('google', ['.com']);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].status, 'taken');
  });

  it('suggests AI domain candidates for a project idea with keywords', () => {
    const suggestions = generateAIDomainSuggestions('AI Task Tracker', 'Intelligent productivity workflow app');
    assert.ok(suggestions.length > 0, 'Should return AI suggestions');
    for (const s of suggestions) {
      assert.ok(s.domain.includes('.'), 'Domain must have extension');
      assert.strictEqual(s.aiGenerated, true);
      assert.ok(s.price, 'Must have price');
    }
  });
});

describe('Sketchboard Illustration Storage Logic', () => {
  it('saves, retrieves, and clears sketch illustrations in extension storage', () => {
    // Mock localStorage for node test runner environment if undefined
    if (typeof globalThis.localStorage === 'undefined') {
      const store = {};
      globalThis.localStorage = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
      };
    }

    const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const saved = saveSketchIllustration('task_t123', testDataUrl);
    assert.strictEqual(saved, true);

    const retrieved = getSketchIllustration('task_t123');
    assert.strictEqual(retrieved, testDataUrl);

    deleteSketchIllustration('task_t123');
    assert.strictEqual(getSketchIllustration('task_t123'), null);
  });
});
