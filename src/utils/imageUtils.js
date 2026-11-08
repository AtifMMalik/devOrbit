/**
 * Image processing utilities for devOrbit project icons, logos, and descriptions.
 */

/**
 * Extracts 1-2 uppercase initials from a project name.
 * e.g., "devOrbit Platform" -> "DP", "Mobile Client" -> "MC", "API" -> "AP"
 */
export const getProjectInitials = (name) => {
  if (!name || typeof name !== 'string') return 'P';
  const words = name.trim().split(/[\s-_]+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

/**
 * Resizes, crops to square, and optimizes an uploaded image file into a compact Base64 Data URL.
 * Keeps storage footprint lightweight (< 20KB per icon).
 *
 * @param {File} file - The uploaded image file
 * @param {Object} options - Configuration options
 * @param {number} options.maxSize - Maximum pixel dimension (default: 128px)
 * @param {number} options.quality - JPEG/WebP compression quality (default: 0.85)
 * @returns {Promise<string>} Base64 Data URL
 */
export const processProjectLogoFile = (file, options = {}) => {
  const { maxSize = 128, quality = 0.85 } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, SVG, WebP, GIF)'));
    }

    // Direct support for SVG (keep raw crisp vector data URL if under 60KB)
    if (file.type === 'image/svg+xml') {
      if (file.size > 60 * 1024) {
        return reject(new Error('SVG file is too large (max 60KB)'));
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read SVG file'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Determine square crop bounds
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          const targetDim = Math.min(maxSize, minDim);
          canvas.width = targetDim;
          canvas.height = targetDim;

          // Enable smooth anti-aliasing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped center square
          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetDim,
            targetDim
          );

          // Export as PNG for transparency support or WebP
          const dataUrl = canvas.toDataURL('image/png', quality);
          resolve(dataUrl);
        } catch (_err) {
          // Fallback to raw data URL if canvas manipulation fails
          resolve(e.target.result);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Optimizes an image for embedding directly into project descriptions or markdown.
 * Preserves aspect ratio, constrains max resolution, and compresses cleanly.
 *
 * @param {File} file
 * @param {Object} options
 * @returns {Promise<string>}
 */
export const processDescriptionImage = (file, options = {}) => {
  const { maxWidth = 1000, maxHeight = 700, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    if (!file.type.startsWith('image/')) return reject(new Error('Please select an image file'));

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch (_err) {
          resolve(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Regex to detect markdown images: ![alt](url)
export const MD_IMAGE_REGEX = /!\[(.*?)\]\(((?:data:image\/[^)]+)|(?:https?:\/\/[^)\s]+))\)/g;

// Regex to detect standalone image URLs with common extensions or query params
export const RAW_IMAGE_URL_REGEX = /(?<!src=[\x27\x22]|href=[\x27\x22]|!\[.*?\]\()https?:\/\/[^\s<>\x27\x22()]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff)(?:\?[^\s<>\x27\x22()]*)?(?:#[^\s<>\x27\x22()]*)?/gi;

/**
 * Checks whether a string is a valid image URL (http/https with image extension) or data URL.
 * @param {string} url
 * @returns {boolean}
 */
export const isImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (clean.startsWith('data:image/')) return true;
  return (
    /^https?:\/\/[^\s<>\x27\x22()]+\.(?:png|jpe?g|gif|webp|svg|bmp|ico|avif|tiff)(?:\?[^\s<>\x27\x22()]*)?(?:#[^\s<>\x27\x22()]*)?$/i.test(clean) ||
    /^https?:\/\/(?:images\.unsplash\.com|i\.imgur\.com|imgur\.com)\/[^\s<>\x27\x22()]+$/i.test(clean)
  );
};

/**
 * Extracts a human-friendly name/caption from an image URL.
 * e.g., "https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png" -> "salesrephero"
 * @param {string} url
 * @returns {string}
 */
export const extractImageNameFromUrl = (url) => {
  if (!url || typeof url !== 'string') return 'Image';
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    const clean = filename.replace(/\.[^/.]+$/, '').replace(/[-_+%20]+/g, ' ').trim();
    if (clean && clean.length <= 40) return clean;
    return 'Web Image';
  } catch (_e) {
    return 'Web Image';
  }
};

/**
 * Parses markdown string into blocks of text and images.
 * Keeps data URLs and web image URLs out of the editable textareas and represents them visually.
 * Automatically detects both markdown images ![alt](url) and standalone image URLs like
 * "https://img6.wsimg.com/serpimg/img/solutionsimg/dbs/salesrephero.png".
 *
 * @param {string} markdown
 * @returns {Array<{ id: string, type: 'text'|'image', content?: string, url?: string, alt?: string }>}
 */
export const parseMarkdownToBlocks = (markdown = '') => {
  if (!markdown) {
    return [{ id: 'b-' + Math.random().toString(36).substr(2, 9), type: 'text', content: '' }];
  }

  const items = [];
  let match;

  // 1. Detect standard markdown images ![alt](url)
  MD_IMAGE_REGEX.lastIndex = 0;
  while ((match = MD_IMAGE_REGEX.exec(markdown)) !== null) {
    items.push({
      start: match.index,
      end: match.index + match[0].length,
      alt: match[1] || 'Attached Image',
      url: match[2],
    });
  }

  // 2. Detect standalone image URLs not already inside a markdown image tag
  RAW_IMAGE_URL_REGEX.lastIndex = 0;
  while ((match = RAW_IMAGE_URL_REGEX.exec(markdown)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    const overlaps = items.some((it) => start >= it.start && end <= it.end);
    if (!overlaps) {
      items.push({
        start,
        end,
        alt: extractImageNameFromUrl(match[0]),
        url: match[0],
      });
    }
  }

  // Sort items in sequential document order
  items.sort((a, b) => a.start - b.start);

  const blocks = [];
  let lastIndex = 0;
  let counter = 1;

  for (const item of items) {
    const textBefore = markdown.slice(lastIndex, item.start);
    if (textBefore.length > 0 || blocks.length === 0) {
      blocks.push({
        id: `block-${counter++}-${Date.now()}`,
        type: 'text',
        content: textBefore,
      });
    }

    blocks.push({
      id: `img-${counter++}-${Date.now()}`,
      type: 'image',
      alt: item.alt,
      url: item.url,
    });

    lastIndex = item.end;
  }

  const textAfter = markdown.slice(lastIndex);
  if (textAfter.length > 0 || blocks.length === 0 || blocks[blocks.length - 1].type === 'image') {
    blocks.push({
      id: `block-${counter++}-${Date.now()}`,
      type: 'text',
      content: textAfter,
    });
  }

  if (blocks.length === 0) {
    blocks.push({ id: 'b-' + Date.now(), type: 'text', content: '' });
  }

  return blocks;
};

/**
 * Serializes block list back into standard Markdown format with embedded data URLs.
 *
 * @param {Array<{ id: string, type: 'text'|'image', content?: string, url?: string, alt?: string }>} blocks
 * @returns {string}
 */
export const serializeBlocks = (blocks = []) => {
  return blocks
    .map((b) => {
      if (b.type === 'image') {
        const alt = (b.alt || 'Attached Image').trim();
        return `\n\n![${alt}](${b.url})\n\n`;
      }
      return b.content || '';
    })
    .join('')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Merges consecutive text blocks after an image is deleted.
 *
 * @param {Array<{ id: string, type: 'text'|'image', content?: string, url?: string, alt?: string }>} blocks
 * @returns {Array<{ id: string, type: 'text'|'image', content?: string, url?: string, alt?: string }>}
 */
export const mergeAdjacentTextBlocks = (blocks = []) => {
  const merged = [];
  for (const b of blocks) {
    if (b.type === 'text' && merged.length > 0 && merged[merged.length - 1].type === 'text') {
      const prev = merged[merged.length - 1];
      const glue = prev.content.endsWith('\n') || b.content.startsWith('\n') ? '' : '\n\n';
      prev.content = (prev.content + glue + b.content).trim();
    } else {
      merged.push({ ...b });
    }
  }
  if (merged.length === 0) {
    merged.push({ id: 'b-' + Date.now(), type: 'text', content: '' });
  }
  return merged;
};
