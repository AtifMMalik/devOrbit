/**
 * Image processing utilities for devOrbit project icons and logos.
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
        } catch (err) {
          // Fallback to raw data URL if canvas manipulation fails
          resolve(e.target.result);
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
};
