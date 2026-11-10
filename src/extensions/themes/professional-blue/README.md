# Professional Blue Theme

This theme was generated and exported from **Hue & View**.

## What's Included:
- `variables.css`: Design tokens (colors, fonts, radii, transitions, shadows)
- `lightMode.css`: Light mode variable mappings
- `darkMode.css`: Dark mode variable mappings with `[data-theme="dark"]` support
- `elements.css`: Clean styling for standard HTML elements (headings, inputs, buttons, tables)
- `components.css`: Ready-to-use utility and component classes (`.btn-primary`, `.card`, `.badge`, etc.)
- `theme.css`: Single master import file linking everything together

## How to Use in HTML/CSS:
Add this single line to your `<head>`:
```html
<link rel="stylesheet" href="./theme/theme.css" />
```

## How to Use in React / Vite / Next.js:
Import `theme.css` in your `main.jsx`, `index.jsx`, or `App.jsx`:
```javascript
import './theme/theme.css';
```

## How to Toggle Dark Mode:
Add `data-theme="dark"` to your `<html>` or `<body>` tag:
```javascript
// In React
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```
