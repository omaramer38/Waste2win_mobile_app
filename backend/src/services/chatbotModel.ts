import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

type Prediction = {
  text: string;
  label: string;
  response: string;
};

const resolveChatbotDir = () => {
  const candidates = [
    path.resolve(process.cwd(), 'chatbot_ai'),
    path.resolve(process.cwd(), '..', 'chatbot_ai'),
  ];

  const chatbotDir = candidates.find((candidate) =>
    fs.existsSync(path.join(candidate, 'predict_model.py'))
  );

  if (!chatbotDir) {
    throw new Error('Chatbot model folder was not found');
  }

  return chatbotDir;
};

export const predictChatbotIntent = (text: string): Promise<Prediction> =>
  new Promise((resolve, reject) => {
    const chatbotDir = resolveChatbotDir();
    const scriptPath = path.join(chatbotDir, 'predict_model.py');
    const child = spawn('python', [scriptPath], {
      cwd: chatbotDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Chatbot model timed out'));
    }, 15000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        reject(new Error(stderr || 'Chatbot model failed'));
        return;
      }

      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error('Chatbot model returned invalid JSON'));
      }
    });

    child.stdin.write(JSON.stringify({ text }));
    child.stdin.end();
  });
