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

      // Build fallback SEO data
      const buildFallbackSEO = () => {
        const keywords = [
          product_name.toLowerCase(),
          ...(category ? [category.toLowerCase()] : []),
          'buy online',
          'best price',
          'free shipping'
        ].filter(Boolean);
        
        return {
          keywords: keywords.slice(0, 10),
          seo_title: `${product_name}${category ? ` - Best ${category}` : ''} | Online Store`,
          seo_description: `Shop ${product_name} online. ${description ? description.substring(0, 120) : 'High quality product with great features and best prices.'}`
        };
      };

      // Check if AI is available
      if (!isAIAvailable()) {
        console.warn('AI not available, using fallback SEO generation');
        return res.json({
          success: true,
          data: buildFallbackSEO(),
          fallback: true
        });
      }

      // Get model with error handling
      let model;
      try {
        model = getModel();
      } catch (modelError) {
        console.warn('Failed to get AI model, using fallback SEO:', modelError.message);
        return res.json({
          success: true,
          data: buildFallbackSEO(),
          fallback: true,
          warning: 'AI model initialization failed'
        });
      }

      // Optimized prompt - shorter and direct
      const prompt = `Generate SEO for: ${product_name}${category ? ` (${category})` : ''}
${description ? `\nDescription: ${description.substring(0, 200)}` : ''}

Return JSON: {"keywords": ["kw1","kw2"], "seo_title": "title", "seo_description": "desc"}`;

      const startTime = Date.now();
      
      let seoData;
      
      try {
        // Use timeout helper (12 seconds for SEO)
        const result = await withTimeout(model.generateContent(prompt), 12000);
        const response = await result.response;
        
        // Check if response has text
        if (!response || !response.text) {
          throw new Error('Invalid response from AI API. Response does not contain text.');
        }
        
        const aiResponse = response.text();
        
        const duration = Date.now() - startTime;
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ SEO generated in ${duration}ms`);
        }

        // Try to parse JSON response
        try {
          // Extract JSON from markdown code blocks if present
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            seoData = JSON.parse(jsonMatch[0]);
          } else {
            seoData = JSON.parse(aiResponse);
          }
          
          // Validate SEO data structure
          if (!seoData.keywords || !Array.isArray(seoData.keywords)) {
            throw new Error('Invalid SEO data format');
          }
        } catch (parseError) {
          // Fallback: extract keywords from text
          const keywords = aiResponse
            .split(/[,\n]/)
            .map(k => k.trim())
            .filter(k => k.length > 0 && k.length < 50)
            .slice(0, 10);

          seoData = buildFallbackSEO();
          if (keywords.length > 0) {
            seoData.keywords = [...new Set([...keywords, ...seoData.keywords])].slice(0, 10);
          }
        }
      } catch (apiError) {
        const duration = Date.now() - startTime;
        
        // Handle specific error types
        if (isTimeoutError(apiError)) {
          console.warn(`⚠️  AI SEO generation timeout after ${duration}ms. Using fallback SEO.`);
          seoData = buildFallbackSEO();
        } else if (apiError.message?.includes('API_KEY_INVALID') || apiError.message?.includes('invalid API key')) {
          console.warn('Invalid AI API key, using fallback SEO');
          seoData = buildFallbackSEO();
        } else if (apiError.message?.includes('QUOTA') || apiError.message?.includes('quota')) {
          console.warn('AI API quota exceeded, using fallback SEO');
          seoData = buildFallbackSEO();
        } else {
          console.error('AI SEO Generation Error:', apiError.message);
          // Use fallback on any error
          seoData = buildFallbackSEO();
        }
      }

      res.json({
        success: true,
        data: seoData
      });
    } catch (error) {
      console.error('\n========== AI SEO GENERATION ERROR ==========');
      console.error('Timestamp:', new Date().toISOString());
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('=============================================\n');
      
      // Always return fallback SEO data instead of failing
      const { product_name, category, description } = req.body;
      const fallbackSEO = {
        keywords: [
          product_name?.toLowerCase() || 'product',
          ...(category ? [category.toLowerCase()] : []),
          'buy online',
          'best price'
        ].filter(Boolean).slice(0, 10),
        seo_title: `${product_name || 'Product'}${category ? ` - Best ${category}` : ''} | Online Store`,
        seo_description: `Shop ${product_name || 'this product'} online. ${description ? description.substring(0, 120) : 'High quality product with great features.'}`
      };

      res.json({
        success: true,
        data: fallbackSEO,
        fallback: true,
        warning: 'AI generation failed, using fallback SEO data'
      });
    }
  },

  // Generate product recommendations
  generateRecommendations: async (req, res, next) => {
    try {
      const { product_id, user_id, store_id } = req.body;

      if (!store_id) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      const { supabaseAdmin } = require('../utils/supabaseClient');

      // Get product details if product_id provided
      let product = null;
      if (product_id) {
        const { data: productData } = await supabaseAdmin
          .from('products')
          .select('id, name, category_id, tags, price, description')
          .eq('id', product_id)
          .eq('store_id', store_id)
          .single();
        
        product = productData;
      }

      // Get user's purchase/view history if user_id provided
      let purchasedProducts = [];
      let viewedProducts = [];
      
      if (user_id) {
        // Get purchase history
        const { data: orders } = await supabaseAdmin
          .from('orders')
          .select(`
            order_items (
              product_id,
              products (id, name, category_id, tags)
            )
          `)
          .eq('store_id', store_id)
          .eq('user_id', user_id)
          .eq('status', 'delivered')
          .limit(10);

        if (orders) {
          orders.forEach(order => {
            order.order_items?.forEach(item => {
              if (item.products && !purchasedProducts.find(p => p.id === item.products.id)) {
                purchasedProducts.push(item.products);
              }
            });
          });
        }

        // Get viewed products from analytics
        const { data: views } = await supabaseAdmin
          .from('analytics_events')
          .select('product_id, products(id, name, category_id, tags)')
          .eq('store_id', store_id)
          .eq('user_id', user_id)
          .eq('event_type', 'product_view')
          .order('created_at', { ascending: false })
          .limit(20);

        if (views) {
          views.forEach(view => {
            if (view.products && !viewedProducts.find(p => p.id === view.products.id)) {
              viewedProducts.push(view.products);
            }
          });
        }
      }

      // Get all active products from the store
      const { data: allProducts } = await supabaseAdmin
        .from('products')
        .select('id, name, description, category_id, tags, price, images, featured')
        .eq('store_id', store_id)
        .eq('status', 'active')
        .limit(100);

      if (!allProducts || allProducts.length === 0) {
        return res.json({
          success: true,
          data: {
            recommendations: [],
            message: 'No products available for recommendations'
          }
        });
      }

      // Filter out already purchased/viewed products
      const excludedIds = new Set([
        product_id,
        ...purchasedProducts.map(p => p.id),
        ...viewedProducts.map(p => p.id)
      ].filter(Boolean));

      const candidateProducts = allProducts.filter(p => !excludedIds.has(p.id));

      // Use AI to generate recommendations if available
      if (isAIAvailable() && candidateProducts.length > 0) {
        try {
          const model = getModel();
          
          const context = product 
            ? `User is viewing: ${product.name}${product.description ? `. ${product.description.substring(0, 200)}` : ''}`
            : user_id && purchasedProducts.length > 0
            ? `User has purchased: ${purchasedProducts.map(p => p.name).join(', ')}`
            : user_id && viewedProducts.length > 0
            ? `User has viewed: ${viewedProducts.map(p => p.name).join(', ')}`
            : 'New customer';

          const productList = candidateProducts
            .slice(0, 30)
            .map(p => `${p.name} ($${p.price})${p.tags && p.tags.length > 0 ? ` - Tags: ${p.tags.join(', ')}` : ''}`)
            .join('\n');

          const prompt = `Analyze e-commerce product recommendations for a customer.

${context}

Available Products (candidate recommendations):
${productList}

Generate 5-8 product recommendations. Consider:
1. Similar products (same category/tags)
2. Complementary products
3. Popular/trending items
4. Products in similar price range
5. Featured products

Return JSON array with product names (exact match from list above) and reasons:
[
  {"product_name": "Exact Product Name", "reason": "Why recommend this"},
  ...
]`;

          const result = await withTimeout(model.generateContent(prompt), 15000);
          const response = await result.response;
          const aiResponse = response.text();

          // Extract JSON from response
          let recommendedNames = [];
          try {
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              recommendedNames = Array.isArray(parsed) 
                ? parsed.map(item => typeof item === 'string' ? item : item.product_name || item.name).filter(Boolean)
                : [];
            }
          } catch (parseError) {
            // Fallback: extract product names from text
            recommendedNames = aiResponse
              .split('\n')
              .map(line => {
                const match = line.match(/"product_name":\s*"([^"]+)"/i) || 
                             line.match(/"name":\s*"([^"]+)"/i) ||
                             line.match(/- (.+?)(?:\s*\(|\s*$)/);
                return match ? match[1] : null;
              })
              .filter(Boolean)
              .slice(0, 8);
          }

          // Match recommended names to actual products
          const recommendations = recommendedNames
            .map(name => {
              const matchedProduct = candidateProducts.find(p => 
                p.name.toLowerCase() === name.toLowerCase() ||
                p.name.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(p.name.toLowerCase())
              );
              return matchedProduct;
            })
            .filter(Boolean)
            .slice(0, 8)
            .map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              images: p.images,
              featured: p.featured
            }));

          return res.json({
            success: true,
            data: {
              recommendations: recommendations,
              count: recommendations.length,
              method: 'ai_powered',
              based_on: {
                product: product ? product.name : null,
                purchases: purchasedProducts.length,
                views: viewedProducts.length
              }
            }
          });
        } catch (aiError) {
          console.warn('AI recommendation failed, using fallback:', aiError.message);
        }
      }

      // Fallback: Generate recommendations based on category/tags/popularity
      let recommendations = [];
      
      if (product) {
        // Find similar products by category/tags
        const similarProducts = candidateProducts
          .filter(p => 
            p.category_id === product.category_id ||
            (p.tags && product.tags && p.tags.some(tag => product.tags.includes(tag)))
          )
          .slice(0, 5);
        
        recommendations.push(...similarProducts);
      }

      // Add popular/featured products
      const popularProducts = candidateProducts
        .filter(p => p.featured || !recommendations.find(r => r.id === p.id))
        .slice(0, 8 - recommendations.length);

      recommendations.push(...popularProducts);
      recommendations = recommendations.slice(0, 8);

      res.json({
        success: true,
        data: {
          recommendations: recommendations.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            images: p.images,
            featured: p.featured
          })),
          count: recommendations.length,
          method: 'algorithmic',
          based_on: {
            product: product ? product.name : null,
            purchases: purchasedProducts.length,
            views: viewedProducts.length
          }
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

        // Extract structured insights from analysis
        const analysisText = analysis.trim();
        const qualityKeywords = {
          'excellent': 'excellent',
          'good': 'good',
          'fair': 'fair',
          'poor': 'poor',
          'needs improvement': 'needs_improvement'
        };
        
        let qualityScore = 'needs_improvement';
        for (const [keyword, score] of Object.entries(qualityKeywords)) {
          if (analysisText.toLowerCase().includes(keyword)) {
            qualityScore = score;
            break;
          }
        }
        
        // Extract recommendations
        const recommendations = analysisText
          .split('\n')
          .filter(line => {
            const lower = line.toLowerCase();
            return lower.includes('suggestion') || 
                   lower.includes('recommend') ||
                   lower.includes('improve') ||
                   lower.includes('should') ||
                   lower.includes('better') ||
                   /^\d+\./.test(line.trim()); // Numbered list items
          })
          .slice(0, 10)
          .map(line => line.trim().replace(/^\d+\.\s*/, ''))
          .filter(line => line.length > 10);

        res.json({
          success: true,
          data: {
            original_url: image_url,
            enhanced_url: image_url, // Enhanced URL (same as original unless processing service integrated)
            analysis: analysisText,
            action: action,
            quality_score: qualityScore,
            recommendations: recommendations.length > 0 ? recommendations : [
              'Ensure proper lighting for product visibility',
              'Use a clean, neutral background',
              'Take photos from multiple angles',
              'Ensure product is in focus',
              'Consider using high-resolution images'
            ],
            message: 'Image analyzed successfully. Analysis includes quality assessment and enhancement recommendations.',
            note: 'For actual image processing/enhancement (resize, crop, filters), integrate with Cloudinary, Imgix, or similar service in production. Current implementation provides analysis and recommendations.'
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

