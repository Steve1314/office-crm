/**
 * Client-Side Image Compressor using HTML5 Canvas
 * Resizes large mobile camera photos (8MB-15MB) to high-quality compressed JPEGs (~150KB-300KB).
 * Prevents "413 Payload Too Large" server errors and keeps MongoDB documents lean.
 */

export const compressImageFile = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve(null);
    }

    // If it's not an image (e.g. PDF document), fallback to standard FileReader
    if (!file.type || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const {
      maxWidth = 1280,
      maxHeight = 1280,
      quality = 0.8
    } = options;

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        // Fallback to uncompressed if image element decoding fails
        resolve(event.target.result);
      };
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas 2D context unavailable
          return resolve(event.target.result);
        }

        // Draw image on canvas and compress to JPEG
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

export default compressImageFile;
