# Troubleshooting AI Features

## Current Status: 500 Error on Description Generation

If you're getting a 500 error, follow these steps:

## Step 1: Check Backend Console

**Look for this error log:**
```
========== AI DESCRIPTION GENERATION ERROR ==========
Error name: ...
Error message: ...
Error code: ...
=====================================================
```

**Common errors and fixes:**

### Error: "API key not valid"
**Fix:**
1. Get a fresh API key from: https://makersuite.google.com/app/apikey
2. Update `backend/.env`:
   ```
   GEMINI_API_KEY=your-new-api-key-here
   ```
3. Restart backend server

### Error: "Model not found" or "Model unavailable"
**Fix:**
- The code now tries multiple models automatically:
  - `gemini-1.5-flash` (preferred)
  - `gemini-1.5-pro` (fallback)
  - `gemini-pro` (legacy fallback)
- If all fail, check your API key permissions

### Error: "Rate limit exceeded"
**Fix:**
- Wait 1 minute
- Free tier: 15 requests/minute
- Try again

### Error: "Network error" or "Timeout"
**Fix:**
- Check internet connection
- Check firewall settings
- Try again later

## Step 2: Test API Key

**Test endpoint:**
```
GET http://localhost:5000/api/ai/test
```

**Expected response (success):**
```json
{
  "success": true,
  "message": "AI API key is configured and working!",
  "testResponse": "Hello, AI is working!"
}
```

**If test fails:**
- API key is invalid or not configured
- Check `.env` file
- Restart server

## Step 3: Verify Configuration

**Check backend console on startup:**
```
========== AI Configuration Check ==========
✅ GEMINI_API_KEY: Configured
   Key: AIza...XXXX (39 characters)
==========================================
```

**If you see:**
```
⚠️  GEMINI_API_KEY: NOT CONFIGURED
```
- The API key is not being read
- Check `.env` file location
- Check file format (no spaces, no quotes)

## Step 4: Manual Test

**Test with curl (replace YOUR_API_KEY):**
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}'
```

**If this works:** API key is valid, issue is in the code
**If this fails:** API key is invalid, get a new one

## Step 5: Check Request Body

**Make sure you're sending:**
```json
{
  "product_name": "Your Product Name",
  "category": "Electronics",  // optional
  "features": "Feature 1, Feature 2",  // optional
  "price": 99.99  // optional
}
```

**Required:** `product_name`

## Still Not Working?

1. **Share the exact error** from backend console
2. **Share the test endpoint result** (`/api/ai/test`)
3. **Confirm you restarted** the server after adding API key

The improved error handling should now show exactly what's wrong!

