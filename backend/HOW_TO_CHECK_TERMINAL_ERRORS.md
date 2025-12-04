# How to Check Terminal Errors - Quick Guide

## 🔍 What to Look For

When you see errors in your Node.js terminal, look for these patterns:

### 1. **Syntax Errors**
```
SyntaxError: Unexpected token
❌ Means: Code has a typo or wrong syntax
```

### 2. **Module Not Found**
```
Error: Cannot find module 'xyz'
❌ Means: Missing package or wrong import
```

### 3. **Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
❌ Means: Port 5000 is already taken
```

### 4. **Database Connection Error**
```
Error: connect ECONNREFUSED
❌ Means: Can't connect to database
```

### 5. **Environment Variable Missing**
```
Error: GEMINI_API_KEY is not defined
❌ Means: Missing .env variable
```

### 6. **Type Errors**
```
TypeError: Cannot read property 'x' of undefined
❌ Means: Trying to access something that doesn't exist
```

## 📋 Common Terminal Error Locations

1. **Backend Terminal** (Node.js server)
   - Look for red error messages
   - Usually starts with "Error:" or "TypeError:"

2. **Frontend Terminal** (React dev server)
   - Look for compilation errors
   - Usually shows file name and line number

## 💡 Quick Fix Guide

| Error Type | Quick Fix |
|-----------|-----------|
| Port in use | Change port or kill process using port 5000 |
| Module not found | Run `npm install` in backend folder |
| Syntax error | Check the file mentioned in error |
| Database error | Check Supabase connection |
| Environment error | Check `.env` file has all required variables |

## 🔎 Next Steps

**Please copy the exact error message from your terminal** and share it, then I can:
1. Tell you exactly what's wrong
2. Explain it in simple terms
3. Fix it for you

---

**Tip**: Copy the entire error block (from "Error:" to the end of stack trace) for best help!

