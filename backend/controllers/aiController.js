// AI Controller
const { getModel, isAIAvailable, withTimeout } = require('../utils/geminiClient');

const buildFallbackDescription = ({ product_name, category, features, price }) => {
  const featureText = features
    ? `Key highlights: ${features.split(',').map(f => f.trim()).filter(Boolean).slice(0, 3).join(', ')}. `
    : '';
  const categoryText = category ? `${category} ` : '';
  const priceText = price ? `Priced at $${price}, ` : '';

  return [
    `Introducing ${product_name}, a ${categoryText}essential designed for everyday performance.`,
    `${featureText}${product_name} is crafted with reliable materials and balanced ergonomics so it works the moment your customers unbox it.`,
    `${priceText}Perfect for shoppers who value practical quality without compromises.`
  ].join(' ').trim();
};

const buildPricingFallback = ({ cost, product_name }) => {
  const numericCost = parseFloat(cost) || 0;
  const basePrice = numericCost ? numericCost * 1.5 : 50;
  return {
    suggested_price: basePrice.toFixed(2),
    pricing_tiers: [
      {
        tier: 'low',
        price: (basePrice * 0.9).toFixed(2),
        reason: 'Entry tier for price-sensitive shoppers'
      },
      {
        tier: 'medium',
        price: basePrice.toFixed(2),
        reason: 'Balanced price-to-value positioning'
      },
      {
        tier: 'high',
        price: (basePrice * 1.2).toFixed(2),
        reason: 'Premium tier for bundled/value-add offers'
      }
    ],
    promotional_price: (basePrice * 0.85).toFixed(2),
    reasoning: `Fallback pricing suggestion for ${product_name || 'this product'} based on a healthy 50% margin.`
  };
};

const isTimeoutError = (error) =>
  typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout');

const aiController = {
  // Generate product description
  generateDescription: async (req, res, next) => {
    try {
      if (!isAIAvailable()) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'AI features are not available',
            details: 'GEMINI_API_KEY is not configured. Add it to your .env file.',
            help: 'Get your free API key from: https://makersuite.google.com/app/apikey'
          }
        });
      }

      const { product_name, category, features, price } = req.body;

      if (!product_name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product name is required'
          }
        });
      }

      const model = getModel();

      // Optimized prompt - shorter and more direct
      const prompt = `Write a professional product description (100-200 words) for:
${product_name}${category ? `\nCategory: ${category}` : ''}${features ? `\nFeatures: ${features}` : ''}${price ? `\nPrice: $${price}` : ''}

Make it SEO-friendly, highlight benefits, and use persuasive language.`;

      const startTime = Date.now();
      
      let result, response, description;
      
      try {
        // Use timeout helper (15 seconds max)
        result = await withTimeout(model.generateContent(prompt), 15000);
        
        response = await result.response;
        
        // Check if response has text
        if (!response || !response.text) {
          throw new Error('Invalid response from AI API. Response does not contain text.');
        }
        
        description = response.text();
        
        if (!description || description.trim().length === 0) {
          throw new Error('AI generated empty description. Please try again.');
        }
        
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ AI description generated in ${duration}ms`);
        }
      } catch (apiError) {
        const duration = Date.now() - startTime;
        if (isTimeoutError(apiError)) {
          console.warn(`⚠️  AI description timeout after ${duration}ms. Using fallback copy.`);
          description = buildFallbackDescription({ product_name, category, features, price });
        } else {
          console.error('Gemini API error:', apiError.message);
          throw apiError;
        }
      }

      res.json({
        success: true,
        data: {
          description: description.trim()
        }
      });
    } catch (error) {
      console.error('\n========== AI DESCRIPTION GENERATION ERROR ==========');
      console.error('Timestamp:', new Date().toISOString());
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('=====================================================\n');

      // Check for specific Gemini API errors
      let errorMessage = 'Failed to generate product description';
      let errorDetails = error.message;

      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key')) {
        errorMessage = 'Invalid API key';
        errorDetails = 'The GEMINI_API_KEY in your .env file is invalid. Please check and update it.';
      } else if (error.message?.includes('QUOTA') || error.message?.includes('rate limit')) {
        errorMessage = 'API quota exceeded';
        errorDetails = 'You have exceeded the API rate limit. Please wait a moment and try again.';
      } else if (error.message?.includes('SAFETY') || error.message?.includes('blocked')) {
        errorMessage = 'Content blocked by safety filters';
        errorDetails = 'The generated content was blocked by safety filters. Try with different product details.';
      }

      res.status(500).json({
        success: false,
        error: {
          message: errorMessage,
          details: errorDetails,
          code: error.code || 'AI_ERROR',
          ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack
          })
        }
      });
    }
  },

  // Generate SEO keywords
  generateSEO: async (req, res, next) => {
    try {
      const { product_name, category, description } = req.body;

      if (!product_name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product name is required'
          }
        });
      }

      const model = getModel();

      // Optimized prompt - shorter and direct
      const prompt = `Generate SEO for: ${product_name}${category ? ` (${category})` : ''}
${description ? `\nDescription: ${description.substring(0, 200)}` : ''}

Return JSON: {"keywords": ["kw1","kw2"], "seo_title": "title", "seo_description": "desc"}`;

      const startTime = Date.now();
      
      // Use timeout helper (12 seconds for SEO)
      const result = await withTimeout(model.generateContent(prompt), 12000);
      const response = await result.response;
      const aiResponse = response.text();
      
      const duration = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ SEO generated in ${duration}ms`);
      }

      // Try to parse JSON response
      let seoData;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          seoData = JSON.parse(jsonMatch[0]);
        } else {
          seoData = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        // Fallback: extract keywords from text
        const keywords = aiResponse
          .split(/[,\n]/)
          .map(k => k.trim())
          .filter(k => k.length > 0)
          .slice(0, 10);

        seoData = {
          keywords: keywords,
          seo_title: `${product_name} - Best ${category || 'Product'} Online`,
          seo_description: `Buy ${product_name} online. ${description ? description.substring(0, 120) : 'High quality product with great features.'}`
        };
      }

      res.json({
        success: true,
        data: seoData
      });
    } catch (error) {
      console.error('AI SEO Generation Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate SEO keywords',
          details: error.message
        }
      });
    }
  },

  // Generate product recommendations
  generateRecommendations: async (req, res, next) => {
    try {
      const { product_id, user_id, store_id } = req.body;

      // This is a placeholder - in a real implementation, you would:
      // 1. Get user's purchase/view history
      // 2. Get similar products
      // 3. Use AI to generate personalized recommendations

      const model = getModel();

      const prompt = `Generate 5 product recommendations for an e-commerce store customer.

Context:
- Store ID: ${store_id || 'N/A'}
- Product ID: ${product_id || 'N/A'}
- User ID: ${user_id || 'Guest'}

Generate recommendations based on:
- Similar products
- Popular items
- Trending products
- Complementary items

Return a JSON array of product recommendations with reasons:
[
  {
    "product_id": "uuid",
    "reason": "Customers who bought this also bought..."
  }
]`;

      // For now, return a simple response
      // In production, this would analyze user behavior and product data
      res.json({
        success: true,
        data: {
          recommendations: [],
          message: 'Recommendation engine will analyze user behavior and product data'
        }
      });
    } catch (error) {
      console.error('AI Recommendations Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate recommendations',
          details: error.message
        }
      });
    }
  },

  // Generate pricing suggestions
  generatePricingSuggestions: async (req, res, next) => {
    try {
      const { product_name, category, cost, competitor_prices } = req.body;

      if (!product_name || !cost) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Product name and cost are required'
          }
        });
      }

      const model = getModel();

      // Optimized prompt - shorter and direct
      const prompt = `Suggest pricing for: ${product_name}${category ? ` (${category})` : ''}
Cost: $${cost}${competitor_prices ? `\nCompetitors: ${competitor_prices.join(', ')}` : ''}

Return JSON: {"suggested_price": X, "pricing_tiers": [{"tier":"low","price":X},...], "reasoning": "..."}`;

      const startTime = Date.now();
      
      let pricingData;
      try {
        const result = await withTimeout(model.generateContent(prompt), 12000);
        const response = await result.response;
        const aiResponse = response.text();
        
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Pricing suggestions generated in ${duration}ms`);
        }

        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            pricingData = JSON.parse(jsonMatch[0]);
          } else {
            pricingData = JSON.parse(aiResponse);
          }
        } catch (parseError) {
          pricingData = buildPricingFallback({ cost, product_name });
        }
      } catch (apiError) {
        const duration = Date.now() - startTime;
        if (isTimeoutError(apiError)) {
          console.warn(`⚠️  AI pricing timeout after ${duration}ms. Using fallback tiers.`);
          pricingData = buildPricingFallback({ cost, product_name });
        } else {
          throw apiError;
        }
      }

      res.json({
        success: true,
        data: pricingData
      });
    } catch (error) {
      console.error('AI Pricing Suggestions Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to generate pricing suggestions',
          details: error.message
        }
      });
    }
  },

  // Image cleanup/enhancement using Gemini Vision API
  cleanupImage: async (req, res, next) => {
    try {
      const { image_url, action = 'analyze' } = req.body;

      if (!image_url) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Image URL is required'
          }
        });
      }

      // Use Gemini Vision API to analyze the image
      const model = getModel('gemini-pro-vision');

      let prompt;
      switch (action) {
        case 'analyze':
          prompt = `Analyze this product image and provide:
1. A detailed description of the product
2. Image quality assessment (good/fair/poor)
3. Suggestions for improvement (lighting, background, angle)
4. Recommended image enhancements`;
          break;
        case 'description':
          prompt = `Generate a detailed product description based on this image. Include:
- Product type and category
- Key features visible in the image
- Color, size, and material details
- Overall product appearance`;
          break;
        case 'suggestions':
          prompt = `Analyze this product image and provide suggestions for:
1. Better lighting
2. Background improvements
3. Angle adjustments
4. Image composition
5. Overall quality improvements`;
          break;
        default:
          prompt = `Analyze this product image and provide insights about its quality and potential improvements.`;
      }

      try {
        // Fetch image from URL
        const axios = require('axios');
        const imageResponse = await axios.get(image_url, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
        const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

        // Use Gemini Vision API
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType
            }
          }
        ]);

        const response = await result.response;
        const analysis = response.text();

        res.json({
          success: true,
          data: {
            original_url: image_url,
            cleaned_url: image_url, // In production, integrate with image processing service
            analysis: analysis.trim(),
            action: action,
            message: 'Image analyzed successfully. For actual image processing, integrate with Cloudinary, Imgix, or similar service.'
          }
        });
      } catch (visionError) {
        // Fallback: return basic analysis without vision API
        console.warn('Gemini Vision API not available, using fallback:', visionError.message);
        
        res.json({
          success: true,
          data: {
            original_url: image_url,
            cleaned_url: image_url,
            analysis: 'Image URL received. For full image analysis, ensure Gemini Vision API is properly configured.',
            action: action,
            message: 'Image processing requires Gemini Vision API or external image processing service'
          }
        });
      }
    } catch (error) {
      console.error('AI Image Cleanup Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to process image',
          details: error.message
        }
      });
    }
  },

  // Analyze analytics data with AI
  analyzeAnalytics: async (req, res, next) => {
    try {
      if (!isAIAvailable()) {
        return res.status(503).json({
          success: false,
          error: {
            message: 'AI features are not available',
            details: 'GEMINI_API_KEY is not configured. Add it to your .env file.',
            help: 'Get your free API key from: https://makersuite.google.com/app/apikey'
          }
        });
      }

      const { salesData, trafficData, period = '30' } = req.body;

      if (!salesData && !trafficData) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Analytics data is required',
            details: 'Please provide salesData and/or trafficData'
          }
        });
      }

      const model = getModel();

      // Prepare data summary for AI analysis
      const salesSummary = salesData?.summary || salesData?.analytics?.overview || salesData?.overview || {};
      const trafficSummary = trafficData?.overview || trafficData?.analytics?.overview || {};
      const timeSeries = salesData?.time_series || salesData?.analytics?.time_series || [];
      const trafficTimeSeries = trafficData?.time_series || trafficData?.analytics?.time_series || [];
      const conversionRates = trafficData?.conversion_rates || trafficData?.analytics?.conversion_rates || {};

      // Build comprehensive prompt
      const prompt = `You are an expert e-commerce analytics analyst. Analyze the following store analytics data and provide actionable insights.

PERIOD: Last ${period} days

SALES METRICS:
- Total Revenue: $${salesSummary.total_revenue?.toFixed(2) || '0.00'}
- Total Orders: ${salesSummary.total_orders || 0}
- Average Order Value: $${salesSummary.average_order_value?.toFixed(2) || '0.00'}
- Revenue Trend: ${timeSeries.length > 0 ? 'Available' : 'No data'}
${timeSeries.length > 0 ? `- Recent trend: ${timeSeries.slice(-7).map(d => `$${parseFloat(d.revenue || 0).toFixed(2)}`).join(', ')}` : ''}

TRAFFIC METRICS:
- Total Views: ${trafficSummary.total_views || 0}
- Unique Visitors: ${trafficSummary.unique_visitors || 0}
- Unique Sessions: ${trafficSummary.unique_sessions || 0}
- Average Views per Session: ${trafficSummary.average_views_per_session?.toFixed(1) || '0.0'}
${conversionRates.cart_conversion ? `- Cart Conversion Rate: ${conversionRates.cart_conversion.toFixed(1)}%` : ''}
${conversionRates.purchase_conversion ? `- Purchase Conversion Rate: ${conversionRates.purchase_conversion.toFixed(1)}%` : ''}

EVENT BREAKDOWN:
${trafficData?.event_types ? Object.entries(trafficData.event_types || {}).map(([key, value]) => `- ${key.replace(/_/g, ' ').toUpperCase()}: ${value}`).join('\n') : 'No event data'}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief 2-3 sentence overview of overall performance",
  "keyInsights": [
    "3-5 key insights about the data"
  ],
  "trends": {
    "revenue": "Trend analysis for revenue (growing/declining/stable)",
    "traffic": "Trend analysis for traffic",
    "conversion": "Trend analysis for conversion rates"
  },
  "strengths": [
    "2-3 things performing well"
  ],
  "weaknesses": [
    "2-3 areas needing improvement"
  ],
  "recommendations": [
    "3-5 actionable recommendations to improve performance"
  ],
  "opportunities": [
    "2-3 growth opportunities identified"
  ],
  "alerts": [
    "Any concerning patterns or anomalies (if any)"
  ]
}

Be specific, data-driven, and actionable. Focus on business value.`;

      const startTime = Date.now();
      
      let result, response, analysisText;
      
      try {
        result = await withTimeout(model.generateContent(prompt), 20000);
        response = await result.response;
        
        if (!response || !response.text) {
          throw new Error('Invalid response from AI API. Response does not contain text.');
        }
        
        analysisText = response.text();
        
        // Try to parse JSON from the response
        let analysis;
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                           analysisText.match(/(\{[\s\S]*\})/);
          const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
          analysis = JSON.parse(jsonStr);
        } catch (parseError) {
          // If JSON parsing fails, create structured response from text
          console.warn('Failed to parse AI response as JSON, using text fallback:', parseError);
          analysis = {
            summary: analysisText.substring(0, 200),
            keyInsights: analysisText.split('\n').filter(line => line.trim().startsWith('-')).slice(0, 5),
            trends: {
              revenue: 'Analysis available',
              traffic: 'Analysis available',
              conversion: 'Analysis available'
            },
            strengths: [],
            weaknesses: [],
            recommendations: analysisText.split('\n').filter(line => line.trim().length > 20).slice(0, 5),
            opportunities: [],
            alerts: []
          };
        }

        const duration = Date.now() - startTime;

        res.json({
          success: true,
          data: {
            analysis: analysis,
            period: period,
            generated_at: new Date().toISOString(),
            processing_time_ms: duration
          }
        });
      } catch (apiError) {
        console.error('Gemini API Error:', apiError);
        
        // Check for specific error types
        if (apiError.message?.includes('API_KEY_INVALID') || apiError.message?.includes('invalid API key')) {
          return res.status(401).json({
            success: false,
            error: {
              message: 'Invalid AI API key',
              details: 'The GEMINI_API_KEY in your .env file is invalid or expired.',
              help: 'Get a new API key from: https://makersuite.google.com/app/apikey'
            }
          });
        }
        
        if (apiError.message?.includes('QUOTA') || apiError.message?.includes('quota')) {
          return res.status(429).json({
            success: false,
            error: {
              message: 'AI API quota exceeded',
              details: 'You have exceeded your API quota. Please try again later.',
              suggestion: 'Wait a few minutes before retrying or upgrade your API plan.'
            }
          });
        }
        
        if (apiError.message?.includes('SAFETY') || apiError.message?.includes('safety')) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Content blocked by safety filters',
              details: 'The AI API blocked the request due to safety concerns.',
              suggestion: 'Try rephrasing your request or check the input data.'
            }
          });
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('AI Analytics Analysis Error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to analyze analytics',
          details: error.message
        }
      });
    }
  }
};

module.exports = aiController;

