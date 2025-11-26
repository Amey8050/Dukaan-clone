# Fix Invalid API Key Error

## Error Message
```
API key not valid. Please pass a valid API key.
```

## Quick Fix Steps

### Step 1: Verify Your API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Check if you have an API key created
4. If not, click "Get API Key" → "Create API key"
5. Copy the **entire** API key (should be ~39+ characters)

### Step 2: Check Your .env File

**Location:** `backend/.env`

**Make sure:**
1. The file exists in the `backend` folder (not root folder)
2. The line looks exactly like this (no quotes, no spaces):
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
3. **NO spaces** around the `=` sign
4. **NO quotes** around the API key
5. The key is on a single line (no line breaks)

### Step 3: Common Mistakes to Avoid

❌ **WRONG:**
```env
GEMINI_API_KEY = "AIzaSy..."  # Has spaces and quotes
GEMINI_API_KEY=AIzaSy...      # Incomplete key (too short)
GEMINI_API_KEY=               # Empty value
```

✅ **CORRECT:**
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 4: Restart Your Backend Server

**IMPORTANT:** After updating `.env`, you **MUST** restart your backend server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### Step 5: Verify It's Working

1. Check backend console - you should see:
   ```
   ✅ GEMINI_API_KEY found: AIza...XXXX (length: 39)
   ```

2. Test the API:
   ```
   GET http://localhost:5000/api/ai/test
   ```

## Still Not Working?

### Check 1: Is the .env file in the right place?
```
backend/
  ├── .env          ← Should be HERE
  ├── index.js
  ├── config/
  └── ...
```

### Check 2: Is dotenv loading the file?
The `config/config.js` file loads dotenv. Make sure it's being required.

### Check 3: Get a Fresh API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Delete old API key (if exists)
3. Create a new one
4. Copy the **entire** key
5. Paste into `.env` file
6. Restart server

### Check 4: Verify API Key Format
Gemini API keys:
- Start with `AIzaSy`
- Are typically 39 characters long
- Contain letters, numbers, and hyphens

Example format:
```
AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789
```

## Debug Commands

### Check if API key is loaded:
```bash
# In backend directory
node -e "require('dotenv').config(); console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found (' + process.env.GEMINI_API_KEY.length + ' chars)' : 'NOT FOUND');"
```

### Test API key directly:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

## Still Having Issues?

1. **Double-check** the `.env` file location and format
2. **Restart** your backend server after changes
3. **Verify** the API key at https://makersuite.google.com/app/apikey
4. **Check** backend console for error messages

The API key should work once it's correctly formatted in the `.env` file and the server is restarted!

