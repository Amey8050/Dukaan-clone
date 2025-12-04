# Automatic Category Creation Feature

## Overview

When adding products (either through bulk upload or manual creation), the system now automatically creates categories if they don't exist. This ensures that products are properly organized and categorized without requiring manual category setup.

## How It Works

### 1. **Category Name Mapping**

The system intelligently maps common category names to better display names:

| Excel/Input Name | Created Category Name |
|-----------------|----------------------|
| food, foods | Eatable |
| drink, drinks, beverage | Beverages |
| cloth, clothes | Clothing |
| electronic, tech | Electronics |
| book, books | Books |
| toy, toys | Toys |
| game, games | Games |
| sport, sports | Sports |
| health, wellness | Health & Wellness |
| beauty, cosmetic | Beauty & Personal Care |
| home, kitchen | Home & Kitchen |
| furniture | Furniture |
| decor, decoration | Home Decor |

For any category name not in the mapping, the system will capitalize the first letter of each word (e.g., "smart phones" → "Smart Phones").

### 2. **Bulk Upload from Excel**

When uploading products via Excel:

1. **Category Column**: Add a "Category" column to your Excel file
2. **Category Names**: Enter category names like "food", "drink", "electronics", etc.
3. **Auto-Creation**: The system will:
   - Find existing categories with matching names (case-insensitive)
   - Create new categories if they don't exist
   - Map common names to better display names (e.g., "food" → "Eatable")
   - Assign products to the correct categories

**Example Excel Format:**
```
| Name              | Price | Category   |
|-------------------|-------|------------|
| Pizza             | 10.99 | food       |
| Water Bottle      | 5.99  | drink      |
| Smartphone        | 299   | electronic |
| Running Shoes     | 79.99 | sport      |
```

After upload:
- Products with "food" → assigned to "Eatable" category
- Products with "drink" → assigned to "Beverages" category
- Products with "electronic" → assigned to "Electronics" category
- Products with "sport" → assigned to "Sports" category

### 3. **Manual Product Creation**

When creating products manually through the product form:

- You can provide either:
  - **Category ID** (UUID) - for existing categories
  - **Category Name** (string) - will auto-create if doesn't exist

The system will automatically:
- Find or create the category
- Assign the product to that category

## Features

### ✅ **Intelligent Mapping**
- Maps common category names to standardized display names
- Handles variations (singular/plural, different spellings)

### ✅ **Case-Insensitive Matching**
- "Food", "food", "FOOD" all match the same category
- Prevents duplicate categories with different cases

### ✅ **Auto-Slug Generation**
- Automatically generates URL-friendly slugs for categories
- Ensures slugs are unique within each store

### ✅ **Duplicate Prevention**
- Checks for existing categories before creating new ones
- Uses case-insensitive name matching to prevent duplicates

### ✅ **Works with Bulk Upload**
- Handles category names from Excel files
- Processes categories in parallel for fast uploads
- Creates categories automatically as products are added

### ✅ **Works with Manual Creation**
- Supports both category IDs and category names
- Auto-creates categories when needed

## Technical Details

### Category Creation Process

1. **Category Name Mapping**
   ```javascript
   mapCategoryName("food") → "Eatable"
   mapCategoryName("electronics") → "Electronics"
   ```

2. **Category Lookup**
   - Searches for existing category by name (case-insensitive)
   - Returns existing category ID if found

3. **Category Creation**
   - Creates new category with mapped name
   - Generates unique slug
   - Returns new category ID

4. **Product Assignment**
   - Assigns product to category ID
   - Products are now organized by category

### Database Structure

Categories table:
- `id` (UUID) - Primary key
- `store_id` (UUID) - Links to store
- `name` (TEXT) - Display name (e.g., "Eatable")
- `slug` (TEXT) - URL-friendly identifier (e.g., "eatable")
- `description` (TEXT) - Optional description
- `image_url` (TEXT) - Optional category image
- `parent_id` (UUID) - Optional parent category

### Code Locations

1. **Bulk Upload Controller** (`backend/controllers/bulkUploadController.js`)
   - `mapCategoryName()` - Maps category names
   - `findOrCreateCategory()` - Finds or creates categories
   - `transformRowToProduct()` - Handles category from Excel

2. **Product Controller** (`backend/controllers/productController.js`)
   - Same helper functions for manual product creation
   - Supports both `category_id` and `category` fields

## Usage Examples

### Excel Bulk Upload

**Excel File:**
```
| Product Name      | Price | Category  |
|-------------------|-------|-----------|
| Apple             | 1.99  | food      |
| Orange Juice      | 3.49  | drink     |
| Laptop            | 999   | electronic|
```

**Result:**
- "Apple" → Assigned to "Eatable" category
- "Orange Juice" → Assigned to "Beverages" category
- "Laptop" → Assigned to "Electronics" category

### Manual Product Creation

**API Request:**
```json
{
  "store_id": "...",
  "name": "Chocolate Bar",
  "price": 2.99,
  "category": "food"
}
```

**Result:**
- Product created
- Category "Eatable" auto-created (if doesn't exist)
- Product assigned to "Eatable" category

## Benefits

1. **No Manual Setup Required**
   - Categories are created automatically
   - No need to pre-create categories before adding products

2. **Consistent Naming**
   - Intelligent mapping ensures consistent category names
   - "food", "foods", "eatable" all become "Eatable"

3. **Fast Bulk Uploads**
   - Categories are created efficiently
   - Parallel processing for maximum speed

4. **Flexible**
   - Supports both category IDs and names
   - Works with Excel uploads and manual creation

5. **Organized Products**
   - Products are automatically categorized
   - Easy to browse and filter by category

## Testing

To test the feature:

1. **Bulk Upload Test**
   - Create an Excel file with a "Category" column
   - Add products with various category names
   - Upload and verify categories are created

2. **Manual Creation Test**
   - Create a product with `category: "food"`
   - Verify "Eatable" category is created
   - Create another product with `category: "food"`
   - Verify it uses the same "Eatable" category

## Notes

- Categories are store-specific (each store has its own categories)
- Category names are mapped to display names for consistency
- Existing categories are reused (no duplicates created)
- Case-insensitive matching prevents duplicate categories

