# Waste2win Mobile App

Waste2win is a recycling rewards mobile app built with Expo React Native, an Express/MySQL backend, and local Python AI modules for chatbot intent detection and route optimization.

## Project structure

- `app/` Expo Router mobile screens
- `backend/` Express API and MySQL database schema
- `chatbot_ai/` local Python chatbot classifier used by the backend
- `smart_waste_ai/` local Python route optimization scripts
- `context/`, `services/`, `components/` shared mobile app code

## Requirements

- Node.js
- npm
- Expo Go or Android/iOS emulator
- MySQL
- Python 3

## Setup

1. Install mobile dependencies

   ```bash
   npm install
   ```

2. Install backend dependencies

   ```bash
   cd backend
   npm install
   cd ..
   ```

3. Install Python AI dependencies

   ```bash
   pip install -r chatbot_ai/requirements.txt
   pip install -r smart_waste_ai/requirements.txt
   ```

4. Create environment files

   ```bash
   copy .env.example .env
   copy backend\.env.example backend\.env
   ```

   If you run the app on a real phone using Expo Go, replace `localhost` in `.env` with your computer LAN IP, for example:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.9:5000/api
   ```

5. Create and seed the database

   Make sure MySQL is running, then update `backend/.env` if your username, password, or database name is different.

   ```bash
   cd backend
   npm run db:init
   cd ..
   ```

6. Start the backend

   ```bash
   cd backend
   npm run dev
   ```

7. Start the mobile app in another terminal

   ```bash
   npm start
   ```

## Test accounts

After database initialization, you can use:

- Admin: `admin@gmail.com` / `123456`
- Worker: `worker@gmail.com` / `123456`
- User: `user@gmail.com` / `123456`

## Useful scripts

- Mobile app:

  ```bash
  npm start
  npm run web
  npm run android
  npm run ios
  npm run lint
  ```

- Backend:

  ```bash
  cd backend
  npm run dev
  npm run db:init
  ```

## Notes

- Do not commit real `.env` files.
- Do not commit `node_modules`; run `npm install` instead.
- Uploaded runtime images in `backend/uploads/` are ignored by git.
- The chatbot model files are included in `chatbot_ai/`, so the backend can call the local classifier.
