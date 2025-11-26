# How to Add Gemini API Key - Step by Step

## 📍 Where to Add the API Key

**File Location:** `backend/.env`

This file should be in the `backend` folder (same folder as `index.js`, `package.json`, etc.)

## 🚀 Step-by-Step Instructions

### Step 1: Check if `.env` file exists

**Location:** `D:\edu\Projects\P1\Dukkan\backend\.env`

If the file doesn't exist, you need to create it.

### Step 2: Create `.env` file (if it doesn't exist)

**Option A: Copy from template**
1. Open `backend/env.template` file
2. Copy all its contents
3. Create a new file named `.env` in the `backend` folder
4. Paste the contents

**Option B: Create manually**
1. In the `backend` folder, create a new file named `.env` (no extension, just `.env`)
2. Add this content:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Razorpay Configuration (Optional)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Gemini AI Configuration (Optional - for AI features)
GEMINI_API_KEY=your-gemini-api-key

# JWT Secret (Optional)
JWT_SECRET=your-secret-key-change-in-production
```

### Step 3: Add Your Gemini API Key

1. Get your API key from: https://makersuite.google.com/app/apikey
2. Copy the entire API key (should be ~39 characters, starts with `AIzaSy`)
3. Open `backend/.env` file
4. Find this line:
   ```
   GEMINI_API_KEY=your-gemini-api-key
   ```
5. Replace `your-gemini-api-key` with your actual API key:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**IMPORTANT:**
- ✅ NO spaces around the `=` sign
- ✅ NO quotes around the API key
- ✅ The entire key on one line
- ✅ Replace the entire `your-gemini-api-key` part

### Step 4: Save the File

Save the `.env` file.

### Step 5: Restart Your Backend Server

**CRITICAL:** After adding/updating the API key, you MUST restart your backend server:

1. Stop the server (press `Ctrl+C` in the terminal where it's running)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```

### Step 6: Verify It's Working

When the server starts, check the console output. You should see:

```
========== AI Configuration Check ==========
✅ GEMINI_API_KEY: Configured
   Key: AIza...XXXX (39 characters)
==========================================
```

Then test it:
```
GET http://localhost:5000/api/ai/test
```

## 📝 Example `.env` File

Here's what your `.env` file should look like (with your actual values):

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789
```

## ⚠️ Common Mistakes

❌ **WRONG:**
```env
GEMINI_API_KEY = "AIzaSy..."     # Has spaces and quotes
GEMINI_API_KEY=AIzaSy...         # Incomplete key
GEMINI_API_KEY=                  # Empty
```

✅ **CORRECT:**
```env
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz123456789
```

## 🔍 File Structure

Your project should look like this:

```
Dukkan/
├── backend/
│   ├── .env              ← ADD API KEY HERE
│   ├── env.template      ← Template file (don't edit this)
│   ├── index.js
│   ├── package.json
│   └── ...
└── frontend/
    └── ...
```

## ✅ Quick Checklist

- [ ] `.env` file exists in `backend` folder
- [ ] API key added to `GEMINI_API_KEY=` line
- [ ] No spaces around `=`
- [ ] No quotes around the key
- [ ] Full API key (39+ characters)
- [ ] Backend server restarted
- [ ] Test endpoint works: `GET /api/ai/test`

That's it! Once you add the key and restart, AI features will work! 🚀

