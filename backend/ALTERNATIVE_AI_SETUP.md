# Alternative AI Service Setup

## Current Setup
The codebase is currently configured for **Google Gemini AI**.

## Options

### Option 1: Disable AI Features
If you don't want to use AI features, simply:
1. Remove or comment out `GEMINI_API_KEY` in `backend/.env`
2. AI endpoints will return 503 (Service Unavailable)
3. Other features will work normally

### Option 2: Use Different Gemini Model
If you want to use a different Gemini model, update `backend/utils/geminiClient.js`:
```javascript
const getModel = (modelName = 'your-preferred-model') => {
  // ...
}
```

### Option 3: Switch to OpenAI
If you want to use OpenAI instead:

1. **Install OpenAI package:**
   ```bash
   cd backend
   npm install openai
   ```

2. **Add to `.env`:**
   ```env
   OPENAI_API_KEY=your-openai-api-key
   ```

3. **Update `utils/geminiClient.js`** to use OpenAI instead

### Option 4: Switch to Anthropic Claude
If you want to use Claude:

1. **Install Anthropic package:**
   ```bash
   cd backend
   npm install @anthropic-ai/sdk
   ```

2. **Add to `.env`:**
   ```env
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ```

## What do you want to do?

1. **Disable AI features** - Remove API key
2. **Use different Gemini model** - Tell me which one
3. **Switch to OpenAI** - I'll help set it up
4. **Switch to Claude** - I'll help set it up
5. **Something else** - Tell me what you need

Let me know which option you prefer!

