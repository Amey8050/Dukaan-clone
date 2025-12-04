# Fix ERR_CONNECTION_REFUSED Error

## Problem

You're seeing this error in Chrome console:
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
:5000/api/auth/me:1  Failed to load resource: net::ERR_CONNECTION_REFUSED
```

This means **the backend server is not running** on port 5000.

## Solution

### Quick Fix: Start the Backend Server

1. **Open a new terminal/command prompt**

2. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **You should see:**
   ```
   🚀 Server is running on port 5000
   📝 Environment: development
   🌐 CORS enabled for: http://localhost:3000
   📍 Health check: http://localhost:5000/health
   ```

5. **Verify it's working:**
   - Open browser: http://localhost:5000/health
   - Should see: `{"status":"ok","timestamp":"...","uptime":...}`

6. **Refresh your frontend** - The errors should be gone!

## If Server Won't Start

### Check 1: Missing Dependencies
```bash
cd backend
npm install
```

### Check 2: Port Already in Use
If port 5000 is already taken:

**Windows PowerShell:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Or change port in `backend/.env`:**
```
PORT=5001
```

### Check 3: Missing .env File
Make sure `backend/.env` exists with required variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Check 4: Check for Errors
Look at the terminal output when starting the server. Common errors:
- Missing environment variables
- Database connection issues
- Port already in use

## Running Both Servers

You need **TWO terminal windows**:

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

Both must be running at the same time!

## Verify Connection

1. Backend running: http://localhost:5000/health
2. Frontend running: http://localhost:3000
3. No console errors in browser

## Still Having Issues?

1. **Check backend terminal** for error messages
2. **Check if port 5000 is listening:**
   ```bash
   netstat -ano | findstr :5000
   ```
3. **Verify .env file** has correct Supabase credentials
4. **Restart both servers** (Ctrl+C, then start again)

