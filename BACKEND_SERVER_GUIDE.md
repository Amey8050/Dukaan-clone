# Backend Server Guide

## Error: ERR_CONNECTION_REFUSED

This error means the **backend server is not running**. The frontend is trying to connect to `http://localhost:5000` but can't reach it.

## Solution: Start the Backend Server

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Start the Server

**For Development (with auto-reload):**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

### Step 3: Verify Server is Running

You should see output like:
```
🚀 Server is running on port 5000
📝 Environment: development
🌐 CORS enabled for: http://localhost:3000
📍 Health check: http://localhost:5000/health
```

### Step 4: Test the Server

Open your browser and visit:
- http://localhost:5000/health
- http://localhost:5000/

You should see JSON responses.

## Common Issues

### Issue 1: Port 5000 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:** 
- Find and kill the process using port 5000:
  ```bash
  # Windows PowerShell
  netstat -ano | findstr :5000
  taskkill /PID <PID_NUMBER> /F
  ```
- Or change the port in `backend/.env`:
  ```
  PORT=5001
  ```
- Then update frontend API URL if needed

### Issue 2: Missing Dependencies

**Error:** `Cannot find module 'express'` or similar

**Solution:**
```bash
cd backend
npm install
```

### Issue 3: Missing .env File

**Error:** Configuration errors or database connection failures

**Solution:**
1. Check if `.env` file exists in `backend/` directory
2. If not, copy from template:
   ```bash
   cp env.template .env
   ```
3. Update `.env` with your Supabase credentials

### Issue 4: Node.js Version Too Old

**Error:** Server won't start or shows version warnings

**Solution:**
- Required: Node.js 18+ 
- Check version: `node --version`
- Update Node.js if needed: https://nodejs.org/

## Quick Start Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Server is listening on port 5000
- [ ] `.env` file exists with correct configuration
- [ ] Dependencies are installed (`npm install`)
- [ ] Frontend can connect to `http://localhost:5000`

## Running Both Frontend and Backend

You need **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Both should be running simultaneously for the app to work!

## Health Check Endpoints

- **Root:** http://localhost:5000/
- **Health:** http://localhost:5000/health
- **API Info:** Check console output when server starts

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

