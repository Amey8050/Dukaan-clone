# AI Features Setup Guide

This guide explains how to set up Google Gemini AI for AI-powered features.

## Prerequisites

1. Create a Google AI Studio account at [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Get your free API key

## Setup Steps

### Step 1: Get Gemini API Key

1. Go to Google AI Studio
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use existing one
5. Copy the API key

### Step 2: Update Environment Variables

Add the following to your `backend/.env` file:

```env
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Test AI Features

The AI features are now ready to use:

- **Product Description Generation**: Automatically generate product descriptions
- **SEO Keywords**: Generate SEO-optimized keywords and meta tags
- **Pricing Suggestions**: Get AI-powered pricing recommendations
- **Product Recommendations**: Get personalized product recommendations

## Available AI Features

### 1. Product Description Generation
- Generates compelling product descriptions
- SEO-friendly content
- Highlights key features and benefits

### 2. SEO Keywords Generation
- Generates relevant SEO keywords
- Creates SEO title and meta description
- Optimized for search engines

### 3. Pricing Suggestions
- Analyzes cost and competitor pricing
- Suggests optimal pricing tiers
- Provides profit margin recommendations

### 4. Product Recommendations
- Personalized product suggestions
- Based on user behavior and product data
- Improves customer experience

## API Endpoints

- `POST /api/ai/generate-description` - Generate product description
- `POST /api/ai/generate-seo` - Generate SEO keywords
- `POST /api/ai/pricing-suggestions` - Get pricing suggestions
- `POST /api/ai/recommendations` - Get recommendations

## Free Tier Limits

Google Gemini API free tier includes:
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)
- Sufficient for development and small-scale usage

## Notes

- The free tier is generous for development
- For production, consider upgrading if needed
- Image cleanup feature requires additional image processing service
- All AI features use optional authentication

