// Bulk Product Upload Controller
const XLSX = require('xlsx');
const { supabaseAdmin } = require('../utils/supabaseClient');
const { getModel, isAIAvailable, withTimeout } = require('../utils/geminiClient');

// Helper function to generate slug from name
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
};

// Helper function to make slug unique within a store (for products)
const makeSlugUnique = async (baseSlug, storeId) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Helper function to make category slug unique within a store
const makeCategorySlugUnique = async (baseSlug, storeId) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id')
      .eq('store_id', storeId)
      .eq('slug', slug)
      .single();
    
    if (error && error.code === 'PGRST116') {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Category name mapping - maps common category names to display names
const mapCategoryName = (categoryName) => {
  if (!categoryName || typeof categoryName !== 'string') {
    return null;
  }
  
  const normalized = categoryName.toLowerCase().trim();
  
  // Category mapping - maps common names to better display names
  const categoryMap = {
    'food': 'Eatable',
    'foods': 'Eatable',
    'eatable': 'Eatable',
    'eatables': 'Eatable',
    'drink': 'Beverages',
    'drinks': 'Beverages',
    'beverage': 'Beverages',
    'beverages': 'Beverages',
    'cloth': 'Clothing',
    'clothes': 'Clothing',
    'clothing': 'Clothing',
    'apparel': 'Clothing',
    'electronic': 'Electronics',
    'electronics': 'Electronics',
    'tech': 'Electronics',
    'technology': 'Electronics',
    'book': 'Books',
    'books': 'Books',
    'toy': 'Toys',
    'toys': 'Toys',
    'game': 'Games',
    'games': 'Games',
    'sport': 'Sports',
    'sports': 'Sports',
    'health': 'Health & Wellness',
    'wellness': 'Health & Wellness',
    'beauty': 'Beauty & Personal Care',
    'cosmetic': 'Beauty & Personal Care',
    'home': 'Home & Kitchen',
    'kitchen': 'Home & Kitchen',
    'furniture': 'Furniture',
    'decor': 'Home Decor',
    'decoration': 'Home Decor',
  };
  
  // Return mapped name if exists, otherwise capitalize the first letter of each word
  if (categoryMap[normalized]) {
    return categoryMap[normalized];
  }
  
  // Capitalize first letter of each word for unknown categories
  return categoryName
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Find or create category by name
const findOrCreateCategory = async (categoryName, storeId) => {
  if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
    return null;
  }
  
  // Map category name (e.g., "food" -> "Eatable")
  const mappedName = mapCategoryName(categoryName.trim());
  const categorySlug = generateSlug(mappedName);
  const uniqueSlug = await makeCategorySlugUnique(categorySlug, storeId);
  
  // First, try to find existing category by name (case-insensitive)
  const { data: existingCategory, error: findError } = await supabaseAdmin
    .from('categories')
    .select('id, name, slug')
    .eq('store_id', storeId)
    .ilike('name', mappedName)
    .single();
  
  if (existingCategory && !findError) {
    // Category exists, return it
    return existingCategory.id;
  }
  
  // Category doesn't exist, create it
  const { data: newCategory, error: createError } = await supabaseAdmin
    .from('categories')
    .insert({
      store_id: storeId,
      name: mappedName,
      slug: uniqueSlug,
      description: `Category for ${mappedName} products`
    })
    .select('id')
    .single();
  
  if (createError || !newCategory) {
    console.error(`Failed to create category "${mappedName}":`, createError?.message);
    return null;
  }
  
  console.log(`✅ Created new category: "${mappedName}" (${newCategory.id})`);
  return newCategory.id;
};

// Convert Google Drive share links to direct image URLs
const convertGoogleDriveLink = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Google Drive share link patterns:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?export=view&id=FILE_ID (already direct)
  
  // Extract file ID from various Google Drive URL formats
  let fileId = null;
  
  // Pattern 1: /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    fileId = fileMatch[1];
  }
  
  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      fileId = idMatch[1];
    }
  }
  
  // Pattern 3: Already a direct link (uc?export=view&id=)
  if (url.includes('drive.google.com/uc?export=view&id=')) {
    return url; // Already in correct format
  }
  
  // Convert to direct image URL if we found a file ID
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  // Return original URL if not a Google Drive link or couldn't parse
  return url;
};

// Parse Excel file and extract product data
const parseExcelFile = (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('Excel file is empty or has no data');
    }
    
    return jsonData;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

// Normalize Excel column names (handle different formats)
const normalizeColumnName = (key) => {
  const normalized = key.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Map common variations
  const columnMap = {
    'product_name': 'name',
    'name': 'name',
    'product_name': 'name',
    'title': 'name',
    'product_title': 'name',
    'price': 'price',
    'product_price': 'price',
    'selling_price': 'price',
    'cost': 'cost_per_item',
    'cost_per_item': 'cost_per_item',
    'unit_cost': 'cost_per_item',
    'description': 'description',
    'product_description': 'description',
    'short_description': 'short_description',
    'summary': 'short_description',
    'sku': 'sku',
    'product_sku': 'sku',
    'barcode': 'barcode',
    'inventory': 'inventory_quantity',
    'quantity': 'inventory_quantity',
    'stock': 'inventory_quantity',
    'inventory_quantity': 'inventory_quantity',
    'category': 'category',
    'tags': 'tags',
    'status': 'status',
    'weight': 'weight',
    'images': 'images',
    'image': 'images',
    'image_url': 'images',
    'image_urls': 'images',
    'product_images': 'images',
    'product_image': 'images',
    'photo': 'images',
    'photos': 'images',
    'picture': 'images',
    'pictures': 'images'
  };
  
  return columnMap[normalized] || normalized;
};

// Retry helper with exponential backoff for rate limit errors
const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 30000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || 
                         error.message?.includes('quota') || 
                         error.message?.includes('rate limit') ||
                         error.message?.includes('Too Many Requests');
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error; // Not a rate limit error or last attempt
      }
      
      // Extract retry delay from error if available (Gemini API provides this)
      const retryAfterMatch = error.message?.match(/Please retry in ([\d.]+)s/i);
      let retryDelay = baseDelay; // Default: 30 seconds
      
      if (retryAfterMatch) {
        retryDelay = parseFloat(retryAfterMatch[1]) * 1000 + 2000; // Add 2 second buffer
      } else {
        // Use exponential backoff: 30s, 60s
        retryDelay = baseDelay * Math.pow(2, attempt);
      }
      
      console.log(`⚠️ Rate limit hit. Waiting ${Math.round(retryDelay/1000)}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Build fallback description when AI is unavailable or fails
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

// Generate product description using AI
const generateDescriptionWithAI = async (productName, category = null, features = null, price = null) => {
  if (!isAIAvailable()) {
    // Return fallback description if AI is not available
    return buildFallbackDescription({ product_name: productName, category, features, price });
  }

  try {
    const model = getModel();
    
    const prompt = `Write a professional product description (100-200 words) for:
${productName}${category ? `\nCategory: ${category}` : ''}${features ? `\nFeatures: ${features}` : ''}${price ? `\nPrice: $${price}` : ''}

Make it SEO-friendly, highlight benefits, and use persuasive language.`;

    const result = await withTimeout(model.generateContent(prompt), 15000);
    const response = await result.response;
    const description = response.text();

    if (!description || description.trim().length === 0) {
      // Use fallback if AI returns empty
      return buildFallbackDescription({ product_name: productName, category, features, price });
    }

    return description.trim();
  } catch (error) {
    console.warn(`⚠️ AI description generation failed for "${productName}": ${error.message}. Using fallback description.`);
    // Return fallback description on error
    return buildFallbackDescription({ product_name: productName, category, features, price });
  }
};

// Analyze price using AI with rate limit handling
const analyzePriceWithAI = async (productName, price, cost = null) => {
  if (!isAIAvailable()) {
    return {
      original_price: price,
      ai_recommended_price: price,
      price_analysis: 'AI not available - using original price',
      confidence: 0
    };
  }

  try {
    const model = getModel();
    
    const prompt = `Analyze the price for an e-commerce product and provide recommendations.

Product Name: ${productName}
Original Price: $${price}
${cost ? `Cost per Item: $${cost}` : 'Cost per Item: Not provided'}

Please analyze:
1. Is the price competitive and reasonable for this product?
2. What would be an optimal recommended price?
3. Price analysis and reasoning
4. Margin analysis (if cost provided)

Return your analysis as JSON:
{
  "recommended_price": <number>,
  "original_price": ${price},
  "price_analysis": "<analysis text>",
  "margin_percentage": <number if cost provided>,
  "competitiveness": "high/medium/low",
  "confidence": <0-100>
}`;

    // Use retry logic for rate limit errors
    const result = await retryWithBackoff(async () => {
      return await withTimeout(model.generateContent(prompt), 15000);
    }, 3, 30000); // 3 retries, starting with 30 second delay
    
    const response = await result.response;
    const aiResponse = response.text();

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        original_price: parseFloat(price),
        ai_recommended_price: analysis.recommended_price || parseFloat(price),
        price_analysis: analysis.price_analysis || 'Analysis completed',
        margin_percentage: analysis.margin_percentage || null,
        competitiveness: analysis.competitiveness || 'medium',
        confidence: analysis.confidence || 50
      };
    }
    
    return {
      original_price: parseFloat(price),
      ai_recommended_price: parseFloat(price),
      price_analysis: 'AI analysis completed but could not parse response',
      confidence: 30
    };
  } catch (error) {
    console.error('AI price analysis error:', error.message);
    
    // Check if it's a rate limit error
    const isRateLimit = error.message?.includes('429') || 
                       error.message?.includes('quota') || 
                       error.message?.includes('rate limit');
    
    if (isRateLimit) {
      return {
        original_price: parseFloat(price),
        ai_recommended_price: parseFloat(price),
        price_analysis: 'AI rate limit exceeded. Free tier allows 2 requests per minute. Please wait and retry, or upload without AI analysis.',
        confidence: 0,
        rate_limited: true
      };
    }
    
    return {
      original_price: parseFloat(price),
      ai_recommended_price: parseFloat(price),
      price_analysis: `AI analysis failed: ${error.message}`,
      confidence: 0
    };
  }
};

// Transform Excel row to product data
const transformRowToProduct = async (row, storeId, useAI = false, generateDescription = false) => {
  const product = {};
  
  // Map all columns
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeColumnName(key);
    
    if (value !== undefined && value !== null && value !== '') {
      product[normalizedKey] = value;
    }
  }
  
  // Ensure required fields
  if (!product.name) {
    throw new Error('Product name is required');
  }
  
  if (!product.price) {
    throw new Error('Product price is required');
  }
  
  // Parse and validate price
  const originalPrice = parseFloat(product.price);
  if (isNaN(originalPrice) || originalPrice < 0) {
    throw new Error(`Invalid price: ${product.price}`);
  }

  // AI Description Generation - Auto-generate if description is missing
  // Check if description is missing (undefined, null, or empty string)
  const hasDescription = product.description && 
                         String(product.description).trim().length > 0;
  
  if (generateDescription && !hasDescription) {
    try {
      const aiDescription = await generateDescriptionWithAI(
        product.name,
        product.category || null,
        product.short_description || null,
        originalPrice
      );
      if (aiDescription) {
        product.description = aiDescription;
        console.log(`✅ Generated AI description for: ${product.name}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to generate description for "${product.name}":`, error.message);
      // Continue without description - will use null or fallback
    }
  }

  // AI Price Analysis
  let priceAnalysis = null;
  let finalPrice = originalPrice;

  if (useAI) {
    priceAnalysis = await analyzePriceWithAI(
      product.name,
      originalPrice,
      product.cost_per_item ? parseFloat(product.cost_per_item) : null
    );
    finalPrice = priceAnalysis.ai_recommended_price || originalPrice;
  }
  
  // Generate slug
  const baseSlug = generateSlug(product.name);
  const uniqueSlug = await makeSlugUnique(baseSlug, storeId);
  
  // Parse tags if string
  let tags = [];
  if (product.tags) {
    if (typeof product.tags === 'string') {
      tags = product.tags.split(',').map(t => t.trim()).filter(Boolean);
    } else if (Array.isArray(product.tags)) {
      tags = product.tags;
    }
  }
  
  // Parse images if string
  let images = [];
  if (product.images) {
    if (typeof product.images === 'string') {
      // Split by comma and clean up
      images = product.images.split(',').map(i => i.trim()).filter(Boolean);
    } else if (Array.isArray(product.images)) {
      images = product.images.filter(i => i && String(i).trim());
    }
    
    // Convert Google Drive links to direct image URLs and filter out invalid URLs
    images = images
      .map(imageUrl => {
        const cleaned = String(imageUrl).trim();
        return cleaned ? convertGoogleDriveLink(cleaned) : null;
      })
      .filter(Boolean); // Remove null/empty values
  }
  
  // Handle category - can be either category name (string) or category_id (UUID)
  let categoryId = null;
  if (product.category) {
    // Check if it's a UUID (category_id) or a category name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(product.category);
    
    if (isUUID) {
      // It's already a category_id (UUID), use it directly
      categoryId = product.category;
    } else {
      // It's a category name, find or create the category
      categoryId = await findOrCreateCategory(product.category, storeId);
    }
  } else if (product.category_id) {
    // Legacy support - category_id might be provided directly
    categoryId = product.category_id;
  }
  
  // Build product data
  const productData = {
    store_id: storeId,
    category_id: categoryId,
    name: product.name.toString().trim(),
    slug: uniqueSlug,
    description: product.description || null,
    short_description: product.short_description || null,
    price: finalPrice,
    compare_at_price: product.compare_at_price ? parseFloat(product.compare_at_price) : null,
    cost_per_item: product.cost_per_item ? parseFloat(product.cost_per_item) : null,
    sku: product.sku ? product.sku.toString() : null,
    barcode: product.barcode ? product.barcode.toString() : null,
    track_inventory: product.track_inventory !== undefined ? Boolean(product.track_inventory) : true,
    inventory_quantity: product.inventory_quantity ? parseInt(product.inventory_quantity) : 0,
    low_stock_threshold: product.low_stock_threshold ? parseInt(product.low_stock_threshold) : 5,
    weight: product.weight ? parseFloat(product.weight) : null,
    status: product.status && ['active', 'draft', 'archived'].includes(product.status.toLowerCase()) 
      ? product.status.toLowerCase() 
      : 'active',
    featured: product.featured ? Boolean(product.featured) : false,
    tags: tags,
    images: images
  };
  
  return {
    productData,
    priceAnalysis,
    originalPrice
  };
};

const bulkUploadController = {
  // Bulk upload products from Excel
  bulkUploadProducts: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No Excel file uploaded'
          }
        });
      }

      const { storeId } = req.body;
      // AI analysis is disabled by default - only enable if explicitly requested
      // FormData sends booleans as strings, so we need to check for both string and boolean
      const useAI = req.body.use_ai === 'true' || req.body.use_ai === true || req.body.use_ai === 'True';
      // Auto-generate descriptions if enabled (processes sequentially)
      const generateDescription = req.body.generate_description === 'true' || req.body.generate_description === true || req.body.generate_description === 'True';
      const userId = req.userId;

      // Debug logging to see what values were received
      console.log('\n🔍 Bulk Upload Request Parameters:');
      console.log(`   use_ai (raw): ${JSON.stringify(req.body.use_ai)} (type: ${typeof req.body.use_ai})`);
      console.log(`   generate_description (raw): ${JSON.stringify(req.body.generate_description)} (type: ${typeof req.body.generate_description})`);
      console.log(`   useAI (parsed): ${useAI}`);
      console.log(`   generateDescription (parsed): ${generateDescription}`);

      if (!storeId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Store ID is required'
          }
        });
      }

      // Verify store exists and user owns it
      const { data: store, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('id', storeId)
        .eq('owner_id', userId)
        .single();

      if (storeError || !store) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Store not found or you do not have permission'
          }
        });
      }

      // Parse Excel file
      let excelData;
      try {
        excelData = parseExcelFile(req.file.buffer);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          error: {
            message: parseError.message
          }
        });
      }

      if (excelData.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Excel file contains no data'
          }
        });
      }

      // Process products
      const results = {
        total: excelData.length,
        success: [],
        failed: [],
        priceAnalyses: []
      };

      console.log('\n' + '='.repeat(60));
      console.log(`📦 STARTING BULK UPLOAD`);
      console.log('='.repeat(60));
      console.log(`📄 Excel file parsed: ${excelData.length} products found`);
      console.log(`🏪 Store ID: ${storeId}`);
      console.log(`🤖 AI Price Analysis: ${useAI ? 'ENABLED ⚠️ (SLOW MODE)' : 'DISABLED ✅ (FAST MODE)'}`);
      console.log(`📝 Auto Description: ${generateDescription ? 'ENABLED ⚠️ (SEQUENTIAL MODE)' : 'DISABLED ✅ (FAST MODE)'}`);
      
      // Determine processing mode
      const sequentialMode = useAI || generateDescription;
      const modeDescription = sequentialMode 
        ? `Sequential (one by one - ${generateDescription ? 'with AI descriptions' : ''} ${useAI ? 'with price analysis' : ''})`
        : 'Parallel (FAST - all at once)';
      console.log(`⚡ Mode: ${modeDescription}`);
      console.log('='.repeat(60) + '\n');
      
      // Process products in batches - optimized for speed
      // For AI or description generation: Process one at a time with delays to respect rate limits (2 req/min for free tier)
      // For non-AI: Process ALL products in parallel for maximum speed (no rate limiting)
      const batchSize = sequentialMode ? 1 : excelData.length; // Process ALL at once when not using AI
      const aiDelay = 35000; // 35 seconds between AI requests (allows ~2 per minute)
      
      for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(excelData.length / batchSize);
        
        console.log(`📊 Processing batch ${currentBatch}/${totalBatches} (${batch.length} products)...`);
        
        // Process sequentially when using AI or description generation to avoid rate limits
        if (sequentialMode) {
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            const rowNumber = i + j + 2; // +2 because Excel rows start at 1 and we have headers
            
            console.log(`\n📦 Processing product ${rowNumber - 1}/${excelData.length}: ${row.name || row.product_name || row.title || 'Unknown'}`);
            if (generateDescription) {
              console.log(`   🔄 Generating AI description...`);
            }
            
            try {
              const { productData, priceAnalysis, originalPrice } = await transformRowToProduct(
                row,
                storeId,
                useAI,
                generateDescription
              );

              // Category is already handled in transformRowToProduct (auto-created if needed)
              // Insert product
              const { data: product, error: insertError } = await supabaseAdmin
                .from('products')
                .insert(productData)
                .select()
                .single();

              if (insertError) {
                throw new Error(insertError.message);
              }

              console.log(`   ✅ Product created: ${product.name} (ID: ${product.id})`);
              
              results.success.push({
                row: rowNumber,
                product_id: product.id,
                name: product.name,
                price: product.price,
                original_price: originalPrice
              });

              if (priceAnalysis) {
                results.priceAnalyses.push({
                  row: rowNumber,
                  product_name: product.name,
                  original_price: priceAnalysis.original_price,
                  ai_recommended_price: priceAnalysis.ai_recommended_price,
                  price_analysis: priceAnalysis.price_analysis,
                  competitiveness: priceAnalysis.competitiveness,
                  confidence: priceAnalysis.confidence
                });
              }
            } catch (error) {
              console.error(`   ❌ Failed: ${error.message}`);
              results.failed.push({
                row: rowNumber,
                product_name: row.name || row.product_name || row.title || 'Unknown',
                error: error.message
              });
            }
            
            // Progress update every 5 products (or every product if less than 20 total)
            const totalProcessed = i + j + 1;
            if (totalProcessed % 5 === 0 || totalProcessed === excelData.length || excelData.length < 20) {
              console.log(`\n📊 Progress: ${totalProcessed}/${excelData.length} products processed (${results.success.length} successful, ${results.failed.length} failed)`);
            }
            
            // Wait between AI requests to respect rate limits (35 seconds = ~2 requests/minute)
            // Wait after each product except the last one in the batch
            if (sequentialMode && (j < batch.length - 1 || i + batchSize < excelData.length)) {
              const delayReason = generateDescription ? 'description generation' : 'price analysis';
              console.log(`   ⏳ Waiting 35s before next product (rate limit: ${delayReason})...`);
              await new Promise(resolve => setTimeout(resolve, aiDelay));
            }
          }
        } else {
          // Process in parallel when not using AI - FAST MODE (no rate limiting)
          // Transform all rows to product data in parallel
          const transformPromises = batch.map(async (row, index) => {
            const rowNumber = i + index + 2;
            try {
              const { productData, priceAnalysis, originalPrice } = await transformRowToProduct(
                row,
                storeId,
                useAI,
                generateDescription // Pass generateDescription flag
              );
              return { rowNumber, productData, originalPrice, row, success: true };
            } catch (error) {
              return { rowNumber, error: error.message, row, success: false };
            }
          });

          const transformedResults = await Promise.all(transformPromises);
          
          // Categories are already handled in transformRowToProduct (auto-created if needed)
          // Prepare all product data for batch insert
          const productsToInsert = [];
          const productsWithErrors = [];

          transformedResults.forEach(result => {
            if (!result.success) {
              productsWithErrors.push(result);
              return;
            }

            // Category is already set and validated in transformRowToProduct
            productsToInsert.push({
              rowNumber: result.rowNumber,
              productData: result.productData,
              originalPrice: result.originalPrice,
              row: result.row
            });
          });

          // Add failed transforms to results
          productsWithErrors.forEach(result => {
            results.failed.push({
              row: result.rowNumber,
              product_name: result.row?.name || result.row?.product_name || result.row?.title || 'Unknown',
              error: result.error
            });
          });

          // Batch insert all products at once for maximum speed
          if (productsToInsert.length > 0) {
            try {
              const productDataArray = productsToInsert.map(p => p.productData);
              
              const { data: insertedProducts, error: insertError } = await supabaseAdmin
                .from('products')
                .insert(productDataArray)
                .select();

              if (insertError) {
                // If batch insert fails, fall back to individual inserts
                console.warn('⚠️ Batch insert failed, falling back to individual inserts:', insertError.message);
                
                // Process individually
                const individualPromises = productsToInsert.map(async (item) => {
                  try {
                    const { data: product, error: individualError } = await supabaseAdmin
                      .from('products')
                      .insert(item.productData)
                      .select()
                      .single();

                    if (individualError) {
                      throw new Error(individualError.message);
                    }

                    results.success.push({
                      row: item.rowNumber,
                      product_id: product.id,
                      name: product.name,
                      price: product.price,
                      original_price: item.originalPrice
                    });

                    return { success: true };
                  } catch (error) {
                    results.failed.push({
                      row: item.rowNumber,
                      product_name: item.row?.name || item.row?.product_name || item.row?.title || 'Unknown',
                      error: error.message
                    });
                    return { success: false };
                  }
                });

                await Promise.all(individualPromises);
              } else {
                // Batch insert succeeded - map results back to rows
                console.log(`✅ Batch insert successful! Inserted ${insertedProducts.length} products in one operation`);
                
                if (insertedProducts.length !== productsToInsert.length) {
                  console.warn(`⚠️ WARNING: Expected ${productsToInsert.length} products, but only ${insertedProducts.length} were inserted!`);
                }
                
                // Track which products were successfully inserted by matching names/slugs
                const insertedMap = new Map();
                insertedProducts.forEach(product => {
                  insertedMap.set(product.name, product);
                  insertedMap.set(product.slug, product);
                });
                
                // Match each product to insert with its database record
                productsToInsert.forEach((item) => {
                  const product = insertedMap.get(item.productData.name) || 
                                 insertedMap.get(item.productData.slug);
                  
                  if (product) {
                    results.success.push({
                      row: item.rowNumber,
                      product_id: product.id,
                      name: product.name,
                      price: product.price,
                      original_price: item.originalPrice
                    });
                  } else {
                    // Product wasn't found in inserted results - check if it exists
                    console.warn(`⚠️ Product from row ${item.rowNumber} (${item.productData.name}) was not found in batch insert results`);
                    results.failed.push({
                      row: item.rowNumber,
                      product_name: item.productData.name || 'Unknown',
                      error: 'Product was not returned from batch insert - may have failed silently'
                    });
                  }
                });
                
                // Final check: ensure all products are accounted for
                if (results.success.length + productsWithErrors.length !== productsToInsert.length) {
                  console.error(`❌ ERROR: Product count mismatch!`);
                  console.error(`   Products to insert: ${productsToInsert.length}`);
                  console.error(`   Successful: ${results.success.length}`);
                  console.error(`   Failed transforms: ${productsWithErrors.length}`);
                  console.error(`   Total accounted: ${results.success.length + productsWithErrors.length}`);
                }
              }
            } catch (error) {
              console.error('❌ Batch insert error:', error.message);
              // Fall back to individual inserts on error
              const individualPromises = productsToInsert.map(async (item) => {
                try {
                  const { data: product, error: individualError } = await supabaseAdmin
                    .from('products')
                    .insert(item.productData)
                    .select()
                    .single();

                  if (individualError) {
                    throw new Error(individualError.message);
                  }

                  results.success.push({
                    row: item.rowNumber,
                    product_id: product.id,
                    name: product.name,
                    price: product.price,
                    original_price: item.originalPrice
                  });
                } catch (error) {
                  results.failed.push({
                    row: item.rowNumber,
                    product_name: item.row?.name || item.row?.product_name || item.row?.title || 'Unknown',
                    error: error.message
                  });
                }
              });

              await Promise.all(individualPromises);
            }
          }
          
          // Progress update
          const totalProcessed = Math.min(i + batchSize, excelData.length);
          console.log(`✅ Progress: ${totalProcessed}/${excelData.length} products processed (${results.success.length} successful, ${results.failed.length} failed)`);
        }
      }

      // Final validation: Ensure all products are accounted for
      const totalProcessed = results.success.length + results.failed.length;
      const missingCount = results.total - totalProcessed;
      
      if (missingCount > 0) {
        console.warn(`⚠️ WARNING: ${missingCount} products were not processed! Expected ${results.total}, processed ${totalProcessed}`);
        // Add missing products to failed list
        for (let i = 0; i < excelData.length; i++) {
          const rowNumber = i + 2;
          const wasProcessed = results.success.some(p => p.row === rowNumber) || 
                               results.failed.some(p => p.row === rowNumber);
          if (!wasProcessed) {
            results.failed.push({
              row: rowNumber,
              product_name: excelData[i].name || excelData[i].product_name || excelData[i].title || 'Unknown',
              error: 'Product was not processed during upload'
            });
          }
        }
      }
      
      // Get product count BEFORE upload for comparison
      const { count: beforeCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId);
      
      console.log(`📊 Products in store before upload: ${beforeCount || 0}`);
      
      // Verify all products in database after upload
      console.log(`🔍 Verifying products in database...`);
      const { data: allStoreProducts, count: afterCount, error: verifyError } = await supabaseAdmin
        .from('products')
        .select('id, name, created_at, slug', { count: 'exact' })
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(200);
      
      const now = new Date();
      const recentlyCreated = allStoreProducts?.filter(product => {
        const created = new Date(product.created_at);
        return (now - created) < 300000; // Last 5 minutes
      }) || [];
      
      const actuallyAdded = (afterCount || 0) - (beforeCount || 0);
      
      console.log(`📊 Products in store after upload: ${afterCount || 0}`);
      console.log(`✅ Verified: ${recentlyCreated.length} products were created in the last 5 minutes`);
      console.log(`✅ Database shows ${actuallyAdded} new products added (${afterCount || 0} - ${beforeCount || 0})`);
      
      // Check for discrepancies
      if (actuallyAdded !== results.success.length) {
        console.warn(`⚠️ WARNING: Discrepancy detected!`);
        console.warn(`   Reported successful: ${results.success.length}`);
        console.warn(`   Actually in database: ${actuallyAdded}`);
        console.warn(`   Difference: ${Math.abs(actuallyAdded - results.success.length)}`);
      } else {
        console.log(`✅ Perfect match! Database count matches success count: ${actuallyAdded} products`);
      }
      
      // Comprehensive summary
      console.log('\n' + '='.repeat(60));
      console.log('📊 BULK UPLOAD SUMMARY');
      console.log('='.repeat(60));
      console.log(`📦 Total products in Excel: ${results.total}`);
      console.log(`✅ Successfully uploaded: ${results.success.length}`);
      console.log(`❌ Failed to upload: ${results.failed.length}`);
      console.log(`📈 Success rate: ${((results.success.length / results.total) * 100).toFixed(1)}%`);
      console.log(`🔍 Verified in database: ${recentlyCreated.length} recent products`);
      
      if (results.failed.length > 0) {
        console.log('\n❌ Failed Products:');
        results.failed.slice(0, 10).forEach(failed => {
          console.log(`   Row ${failed.row}: ${failed.product_name} - ${failed.error}`);
        });
        if (results.failed.length > 10) {
          console.log(`   ... and ${results.failed.length - 10} more failures`);
        }
      }
      
      if (results.success.length > 0) {
        console.log('\n✅ Sample of Successfully Uploaded Products:');
        results.success.slice(0, 5).forEach(success => {
          console.log(`   Row ${success.row}: ${success.name} (ID: ${success.product_id})`);
        });
        if (results.success.length > 5) {
          console.log(`   ... and ${results.success.length - 5} more successful uploads`);
        }
      }
      
      console.log('='.repeat(60) + '\n');
      
      // Final check: All products accounted for
      const finalTotal = results.success.length + results.failed.length;
      if (finalTotal === results.total) {
        console.log(`✅ All ${results.total} products have been processed and accounted for!`);
      } else {
        console.error(`❌ ERROR: Missing products! Expected ${results.total}, accounted for ${finalTotal}`);
      }
      
      res.json({
        success: true,
        message: `Bulk upload completed. ${results.success.length} succeeded, ${results.failed.length} failed out of ${results.total} total.`,
        data: {
          total: results.total,
          successful: results.success.length,
          failed: results.failed.length,
          verified_in_database: recentlyCreated.length,
          success_rate: `${((results.success.length / results.total) * 100).toFixed(1)}%`,
          all_accounted_for: finalTotal === results.total,
          products: results.success,
          errors: results.failed,
          price_analyses: results.priceAnalyses
        }
      });
    } catch (error) {
      console.error('❌ Bulk upload error:', error);
      console.error('Error stack:', error.stack);
      
      // Check for timeout errors
      if (error.code === 'ECONNRESET' || error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
        return res.status(504).json({
          success: false,
          error: {
            message: 'Upload timeout - The upload is taking too long. Try uploading fewer products at once or disable AI analysis.',
            details: 'For 100+ products, consider splitting into smaller batches or uploading without AI analysis for faster processing.'
          }
        });
      }
      
      next(error);
    }
  },

  // Get Excel template
  getTemplate: (req, res) => {
    // Create sample Excel template
    const templateData = [
      {
        'Product Name': 'Sample Product',
        'Description': 'This is a sample product description',
        'Price': 29.99,
        'Cost per Item': 15.00,
        'SKU': 'SKU-001',
        'Inventory Quantity': 100,
        'Category': 'Electronics',
        'Tags': 'popular, new',
        'Status': 'active',
        'Images': 'https://example.com/image1.jpg,https://example.com/image2.jpg'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product-upload-template.xlsx');
    res.send(excelBuffer);
  }
};

module.exports = bulkUploadController;

