import fs from 'fs';
import path from 'path';

export const saveBase64Image = (base64Str: string): string => {
  if (typeof base64Str !== 'string') {
    return '';
  }

  // If it is empty or already a URL or path, return it as is
  if (!base64Str || base64Str.startsWith('http://') || base64Str.startsWith('https://') || base64Str.startsWith('/uploads/')) {
    return base64Str;
  }

  // Check if it has a data URI prefix
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/) ||
                  base64Str.match(/^data:application\/octet-stream;base64,(.+)$/);

  let ext = 'jpg';
  let data = base64Str;

  if (matches) {
    if (matches.length === 3) {
      ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      data = matches[2];
    } else {
      data = matches[1];
    }
  } else {
    // Check if it is a raw base64 string
    try {
      const decoded = Buffer.from(base64Str, 'base64').toString('base64');
      if (decoded !== base64Str) {
        return base64Str;
      }
    } catch {
      return base64Str;
    }
  }

  const buffer = Buffer.from(data, 'base64');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
  const uploadDir = path.join(__dirname, '../../uploads');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
};
