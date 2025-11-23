# Frontend - Operations Tracker

React frontend application for the Operations Tracker.

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Local Development

```bash
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## Vercel Deployment

1. Set root directory to `frontend`
2. Framework preset: Create React App
3. Build command: `npm run build` (auto-detected)
4. Output directory: `build` (auto-detected)
5. Set environment variable: `REACT_APP_API_URL` pointing to your backend API

## Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.
