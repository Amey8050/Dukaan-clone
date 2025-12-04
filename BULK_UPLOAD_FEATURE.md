# Bulk Product Upload Feature - Documentation

## Overview

The bulk product upload feature allows store owners to upload multiple products from an Excel file (.xlsx, .xls, or .csv). The system includes AI-powered price analysis using Google Gemini API to analyze and optimize product prices.

## Features

✅ **Excel File Upload** - Support for .xlsx, .xls, and .csv formats  
✅ **Template Download** - Download a pre-formatted Excel template  
✅ **AI Price Analysis** - Automatic price optimization using Gemini AI  
✅ **Batch Processing** - Efficient processing of multiple products  
✅ **Error Handling** - Detailed error reporting for failed products  
✅ **Price Comparison** - Shows original vs AI-recommended prices  
✅ **Progress Tracking** - Real-time upload progress and results  

## How to Use

### Step 1: Access Bulk Upload

1. Navigate to your store's products page
2. Click the **"📊 Bulk Upload"** button in the header
3. Or go directly to: `/stores/{store-slug}/products/bulk-upload`

### Step 2: Download Template (Optional but Recommended)

1. Click the **"📥 Download Template"** button
2. This downloads an Excel file with sample data and column headers
3. Use this as a reference for the correct format

### Step 3: Prepare Your Excel File

Your Excel file should contain the following columns:

| Column Name | Required | Type | Description |
|------------|----------|------|-------------|
| Product Name | ✅ Yes | Text | The name of the product |
| Price | ✅ Yes | Number | The selling price |
| Description | ❌ No | Text | Full product description |
| Short Description | ❌ No | Text | Brief product summary |
| Cost per Item | ❌ No | Number | Cost price (for margin calculation) |
| SKU | ❌ No | Text | Stock keeping unit |
| Barcode | ❌ No | Text | Product barcode |
| Inventory Quantity | ❌ No | Number | Stock quantity (default: 0) |
| Category | ❌ No | Text | Product category name |
| Tags | ❌ No | Text | Comma-separated tags |
| Status | ❌ No | Text | active, draft, or archived (default: active) |
| Weight | ❌ No | Number | Product weight |
| Images | ❌ No | Text | Comma-separated image URLs (supports Google Drive links) |

**Note:** The system is flexible with column names. Common variations like "Product Title", "Selling Price", etc. are automatically recognized.

### Image URLs

For the **Images** column, you can use:
- **Direct image URLs**: `https://example.com/image.jpg`
- **Multiple images**: Separate with commas: `url1.jpg,url2.jpg,url3.jpg`
- **Google Drive links**: Supported! The system automatically converts them:
  - Share link: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
  - Will be converted to: `https://drive.google.com/uc?export=view&id=FILE_ID`
  
**Important:** 
- Excel cannot store actual image files, only URLs
- Make sure image URLs are publicly accessible
- For Google Drive: Set sharing to "Anyone with the link" for images to display

### Step 4: Upload Your File

1. Click **"Choose Excel File"** and select your file
2. **Optional:** Enable "AI Price Analysis" checkbox
   - This will analyze each product's price and suggest optimized prices
   - Uses Google Gemini AI to determine competitive pricing
3. Click **"🚀 Upload Products"**
4. Wait for processing (progress is shown)

### Step 5: Review Results

After upload, you'll see:

- **Summary Cards**: Total, Successful, and Failed counts
- **Price Analyses**: If AI analysis was enabled, see recommendations
- **Error List**: Details of any products that failed to upload
- **Successful Products**: List of all created products

## AI Price Analysis

When enabled, the AI analyzes each product's price based on:

- Product name and description
- Original price
- Cost per item (if provided)
- Market competitiveness
- Optimal pricing strategy

### Analysis Output

For each product, you'll see:

- **Original Price**: The price from your Excel file
- **AI Recommended Price**: The optimized price suggestion
- **Price Difference**: Percentage change
- **Competitiveness**: High, Medium, or Low
- **Confidence Score**: 0-100% confidence in the recommendation
- **Analysis Text**: Detailed explanation of the recommendation

You can choose to use the AI-recommended prices or stick with your original prices.

## Excel File Format Examples

### Minimal Format (Only Required Fields)

| Product Name | Price |
|-------------|-------|
| Sample Product | 29.99 |
| Another Product | 49.99 |

### Complete Format (All Fields)

| Product Name | Description | Price | Cost per Item | SKU | Inventory Quantity | Tags | Status |
|-------------|-------------|-------|---------------|-----|-------------------|------|--------|
| Wireless Headphones | Premium wireless headphones with noise cancellation | 99.99 | 50.00 | WH-001 | 100 | electronics,audio | active |
| Smart Watch | Feature-rich smartwatch with fitness tracking | 199.99 | 120.00 | SW-001 | 50 | electronics,wearable | active |

## API Endpoints

### Backend Routes

- `GET /api/bulk-upload/template` - Download Excel template
- `POST /api/bulk-upload/products` - Upload products from Excel

### Request Format

```javascript
// POST /api/bulk-upload/products
FormData:
  - file: Excel file (.xlsx, .xls, .csv)
  - storeId: Store UUID
  - use_ai: true/false (optional, default: false)
```

### Response Format

```json
{
  "success": true,
  "message": "Bulk upload completed. 10 succeeded, 0 failed.",
  "data": {
    "total": 10,
    "successful": 10,
    "failed": 0,
    "products": [...],
    "errors": [],
    "price_analyses": [...]
  }
}
```

## Technical Details

### Backend Implementation

- **Controller**: `backend/controllers/bulkUploadController.js`
- **Route**: `backend/routes/bulkUploadRoutes.js`
- **Library**: `xlsx` for Excel parsing
- **AI Integration**: Google Gemini API via `geminiClient.js`

### Frontend Implementation

- **Component**: `frontend/src/pages/BulkUpload.jsx`
- **Service**: `frontend/src/services/bulkUploadService.js`
- **Route**: `/stores/:storeId/products/bulk-upload`

### Processing Flow

1. File uploaded via multipart/form-data
2. Excel file parsed using `xlsx` library
3. Each row validated and transformed
4. (Optional) AI analyzes prices
5. Products inserted into database in batches
6. Results returned with summary

### Batch Processing

- **Without AI**: 20 products per batch
- **With AI**: 5 products per batch (to avoid rate limits)
- 1-second delay between batches when using AI

## Error Handling

### Common Errors

1. **"Product name is required"** - Missing product name in a row
2. **"Product price is required"** - Missing or invalid price
3. **"Invalid price"** - Price is not a valid number
4. **"Store not found"** - Invalid store ID or permission issue
5. **"Excel file is empty"** - No data in the uploaded file

### Error Reporting

- Failed products are listed with row numbers
- Error messages explain what went wrong
- You can fix the Excel file and re-upload

## Best Practices

1. **Use the Template** - Download and use the template for correct formatting
2. **Test with Few Products** - Start with 5-10 products to test
3. **Enable AI Analysis** - Use AI for better pricing, especially for new products
4. **Review Errors** - Check error messages and fix issues in Excel
5. **Backup Your Data** - Export existing products before bulk operations
6. **Validate Prices** - Review AI recommendations before accepting

## Limitations

- Maximum file size: 10MB
- Recommended max products per upload: 100 (for performance)
- AI analysis adds processing time (~2-3 seconds per product)
- Category names are not automatically created (use category_id instead)

## Troubleshooting

### File Won't Upload

- Check file format (.xlsx, .xls, or .csv)
- Ensure file size is under 10MB
- Verify you're logged in and have store permissions

### Products Not Creating

- Check error messages in the results
- Verify required fields (Product Name, Price) are present
- Ensure store ID is correct

### AI Analysis Not Working

- Check if GEMINI_API_KEY is configured in backend
- Verify API key is valid
- AI analysis is optional - products still upload without it

## Future Enhancements

Potential improvements:

- [ ] Auto-create categories from Excel
- [ ] Image URL import from Excel
- [ ] Preview before upload
- [ ] Update existing products option
- [ ] Export products to Excel
- [ ] Bulk update capabilities

---

**Created**: 2024  
**Version**: 1.0.0  
**Status**: Production Ready ✅

