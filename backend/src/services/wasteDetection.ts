import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

type WasteDetection = {
  class: string;
  material: string;
  confidence: number;
  weight_g: number;
  bbox: number[];
};

export type WasteDetectionResult = {
  detections: WasteDetection[];
  total_weight_g: number;
  total_weight_kg: number;
  items_count: number;
  material_counts: Record<string, number>;
  annotated_image?: string;
};

const repoRoot = path.resolve(__dirname, '../../..');
const modelDir = path.join(repoRoot, 'model 5');
const scriptPath = path.join(modelDir, 'api_detect.py');
const uploadDir = path.join(__dirname, '../../uploads/waste-detections');

const parseImage = (image: string) => {
  const dataUrlMatch = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  const extension = dataUrlMatch?.[1]?.replace('jpeg', 'jpg') || 'jpg';
  const base64Data = dataUrlMatch?.[2] || image;

  return {
    extension,
    buffer: Buffer.from(base64Data, 'base64'),
  };
};

export const detectWasteImage = async (image: string): Promise<WasteDetectionResult> => {
  if (!image || typeof image !== 'string') {
    throw new Error('Image is required');
  }

  await fs.mkdir(uploadDir, { recursive: true });

  const { extension, buffer } = parseImage(image);
  const imagePath = path.join(uploadDir, `${crypto.randomUUID()}.${extension}`);
  await fs.writeFile(imagePath, buffer);

  const pythonCommand = process.env.WASTE_MODEL_PYTHON || 'python';

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCommand, [scriptPath, imagePath], {
      cwd: modelDir,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `Waste detection failed with code ${code}`));
        return;
      }

      try {
        const jsonLine = stdout.trim().split(/\r?\n/).at(-1);
        if (!jsonLine) {
          throw new Error('Empty detection response');
        }
        resolve(JSON.parse(jsonLine) as WasteDetectionResult);
      } catch (error) {
        reject(error);
      }
    });
  });
};
