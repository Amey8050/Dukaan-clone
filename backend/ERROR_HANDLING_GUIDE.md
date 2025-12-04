# Error Handling Guide

This document explains common errors you might see and how they're handled.

## 401 Unauthorized Error on `/api/auth/me`

### Why This Happens

The `/api/auth/me` endpoint returns a 401 (Unauthorized) error when:
- The user is not logged in (no token provided)
- The access token has expired
- The access token is invalid

### Is This a Problem?

**No, this is expected behavior!** The application handles this gracefully:

1. **During App Initialization**: 
   - The app checks if you're logged in by calling `/api/auth/me`
   - If you're not logged in (401), the app silently continues without error
   - The error is suppressed in the AuthContext

2. **Token Refresh**:
   - If your token expired, the API interceptor automatically tries to refresh it
   - If refresh succeeds, the request is retried
   - If refresh fails, you're redirected to login

### When You'll See This Error

You'll see this error in the browser console if:
- You're not logged in (normal - not a problem)
- Your session expired (normal - will auto-refresh or redirect)
- You're on a page that checks authentication status (expected)

### How It's Handled

```javascript
// Frontend handles 401s gracefully:
// 1. Tries to refresh token automatically
// 2. If refresh fails, clears auth and continues
// 3. Only redirects to login for protected routes
// 4. Suppresses 401 errors during auth initialization
```

**Action Required**: None. This is normal and expected behavior.

---

## 500 Internal Server Error on `/api/ai/generate-seo`

### Why This Happens

The SEO generation endpoint can return a 500 error if:
- AI API key is not configured
- AI API key is invalid
- AI API request times out
- AI API returns an error
- Network issues connecting to AI service

### Fix Applied

The endpoint now:
1. ✅ Checks if AI is available before attempting generation
2. ✅ Returns fallback SEO data if AI is not available
3. ✅ Handles all error types gracefully
4. ✅ Always returns a successful response (never fails)
5. ✅ Uses fallback SEO data on any error

### What Happens Now

**Before (Error)**:
```
❌ 500 Internal Server Error
   Failed to generate SEO keywords
```

**After (Fixed)**:
```
✅ 200 OK
   {
     "success": true,
     "data": {
       "keywords": ["product name", "buy online", ...],
       "seo_title": "Product Name - Best Category | Online Store",
       "seo_description": "Shop Product Name online..."
     },
     "fallback": true  // Indicates fallback was used
   }
```

### Fallback SEO Generation

If AI generation fails, the system automatically generates SEO data:
- **Keywords**: Product name, category, common e-commerce terms
- **SEO Title**: `{Product Name} - Best {Category} | Online Store`
- **SEO Description**: Generated from product name and description

### Common Scenarios

1. **AI Not Configured**:
   - ✅ Returns fallback SEO immediately
   - ⚠️ Shows warning in console (not an error)

2. **AI API Key Invalid**:
   - ✅ Returns fallback SEO
   - ⚠️ Logs warning

3. **AI API Timeout**:
   - ✅ Returns fallback SEO after 12 seconds
   - ⚠️ Logs timeout warning

4. **AI API Error**:
   - ✅ Returns fallback SEO
   - ⚠️ Logs error details

**Action Required**: None. The endpoint now always succeeds with fallback data.

---

## Other Common Errors

### 400 Bad Request
- **Cause**: Missing or invalid request parameters
- **Solution**: Check request body/query parameters

### 403 Forbidden
- **Cause**: User doesn't have permission
- **Solution**: Verify user has required role/permissions

### 404 Not Found
- **Cause**: Resource doesn't exist
- **Solution**: Check if ID/resource exists

### 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Solution**: Wait a moment and retry

### 503 Service Unavailable
- **Cause**: Service temporarily unavailable (e.g., AI not configured)
- **Solution**: Check service status or configuration

---

## Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "details": "Detailed error information",
    "code": "ERROR_CODE"
  }
}
```

---

## Debugging Tips

1. **Check Browser Console**: Look for detailed error messages
2. **Check Server Logs**: Backend logs have detailed error information
3. **Check Network Tab**: See the exact request/response
4. **Check Environment Variables**: Ensure all required keys are set
5. **Check Authentication**: Verify tokens are valid and not expired

---

## Need Help?

If you encounter errors that aren't explained here:
1. Check the error message in the browser console
2. Check the server logs for detailed error information
3. Verify all required environment variables are set
4. Check if the service/feature is properly configured

