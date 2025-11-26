// Quick test script for Gemini API
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY || '';

console.log('\n========== AI API TEST ==========');
console.log('API Key configured:', apiKey ? `Yes (${apiKey.length} chars)` : 'NO');
console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'N/A');

if (!apiKey) {
  console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

if (apiKey.length < 20) {
  console.error('❌ ERROR: API key seems too short (should be 39+ characters)');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Test models - try different naming conventions
const modelsToTest = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    console.log('Model initialized, making API call...');
    const result = await model.generateContent('Say "Hello, AI is working!" in one sentence.');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ SUCCESS with ${modelName}`);
    console.log('Response:', text);
    return true;
  } catch (error) {
    console.error(`❌ FAILED with ${modelName}:`, error.message);
    if (error.message?.includes('API key')) {
      console.error('   → API key is invalid');
    }
    if (error.message?.includes('model')) {
      console.error('   → Model not available');
    }
    return false;
  }
}

async function runTests() {
  console.log('\nTesting all models...\n');
  
  for (const model of modelsToTest) {
    const success = await testModel(model);
    if (success) {
      console.log(`\n✅ At least one model works: ${model}`);
      process.exit(0);
    }
  }
  
  console.error('\n❌ All models failed. Check your API key.');
  process.exit(1);
}

runTests().catch(error => {
  console.error('\n❌ Test script error:', error);
  process.exit(1);
});

