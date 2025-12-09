import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import bulkUploadService from '../services/bulkUploadService';
import useStoreBySlug from '../hooks/useStoreBySlug';
import { formatCurrency } from '../utils/currency';
import LoadingSpinner from '../components/LoadingSpinner';
import '../components/BackButton.css';
import './BulkUpload.css';

const BulkUpload = () => {
  const { storeId: storeSlug } = useParams();
  const location = useLocation();
  const {
    storeId,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Check if we came from dashboard
  const fromDashboard = location.state?.from === 'dashboard';

  const [file, setFile] = useState(null);
  const [useAI, setUseAI] = useState(false); // AI disabled by default for faster uploads
  const [generateDescription, setGenerateDescription] = useState(true); // Auto-description ENABLED by default
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));

      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(fileExtension)) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await bulkUploadService.downloadTemplate();
    } catch (err) {
      setError('Failed to download template. Please try again.');
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!file || !storeId) {
      setError('Please select a file and ensure store is loaded');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setResult(null);
      setUploadProgress(0);

      const response = await bulkUploadService.uploadProducts(
        file, 
        storeId, 
        useAI, 
        generateDescription,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (response.success) {
        setResult(response.data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('excel-file');
        if (fileInput) fileInput.value = '';
        
        // Show warning if there were rate limit errors
        if (response.data.price_analyses) {
          const rateLimited = response.data.price_analyses.filter(a => a.rate_limited);
          if (rateLimited.length > 0) {
            alert(`⚠️ Rate Limit Warning: ${rateLimited.length} product(s) could not be analyzed due to API rate limits. Products were still created with original prices.`);
          }
        }
      } else {
        const errorMsg = response.error?.message || 'Upload failed';
        if (errorMsg.includes('rate limit') || errorMsg.includes('quota') || errorMsg.includes('429')) {
          setError('AI rate limit exceeded. Free tier allows 2 requests per minute. Please wait a moment and try again, or upload without AI analysis.');
        } else {
          setError(errorMsg);
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 
                          err.message || 
                          'Failed to upload products. Please try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (storeLookupLoading) {
    return (
      <div className="bulk-upload-container">
        <LoadingSpinner />
      </div>
    );
  }

  if (storeLookupError || !storeId) {
    return (
      <div className="bulk-upload-container">
        <div className="error-message">
          {storeLookupError || 'Store not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-wrapper">
        <button
          className="back-button"
          onClick={() => {
            if (fromDashboard) {
              navigate(`/stores/${storeId}/dashboard`, { state: { tab: 'products' } });
            } else {
              navigate(`/stores/${storeSlug}/products`);
            }
          }}
        >
          ← {fromDashboard ? 'Back to Dashboard' : 'Back to Products'}
        </button>

        <div className="bulk-upload-card">
          <div className="bulk-upload-header">
            <h1>Bulk Upload Products</h1>
            <p className="subtitle">Upload multiple products from an Excel file</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="upload-section">
            <div className="template-section">
              <h3>Step 1: Download Template</h3>
              <p>Download our Excel template to ensure your file has the correct format.</p>
              <button
                className="template-button"
                onClick={handleDownloadTemplate}
                disabled={uploading}
              >
                📥 Download Template
              </button>
            </div>

            <div className="file-upload-section">
              <h3>Step 2: Upload Your Excel File</h3>
              <p>Select your Excel file (.xlsx, .xls) or CSV file with product data.</p>
              
              <div className="file-input-wrapper">
                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="file-input"
                />
                <label htmlFor="excel-file" className="file-label">
                  {file ? `📄 ${file.name}` : 'Choose Excel File'}
                </label>
              </div>

              {file && (
                <div className="file-info">
                  <p>File selected: <strong>{file.name}</strong></p>
                  <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>

            <div className="ai-option-section">
              <h3>Step 3: Options (Optional)</h3>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={generateDescription}
                  onChange={(e) => setGenerateDescription(e.target.checked)}
                  disabled={uploading}
                />
                <span>Auto-Generate Product Descriptions with AI (Enabled by Default)</span>
                <small>Automatically generate SEO-friendly descriptions for products that don't have descriptions. Products will be processed one by one sequentially.</small>
                <div className="rate-limit-warning">
                  ⚠️ <strong>Note:</strong> Enabled by default. Uncheck for faster uploads (seconds instead of hours). This processes products sequentially (one after another). For 100+ products, this will take approximately 60-90 minutes. Only products without descriptions will get AI-generated ones.
                </div>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  disabled={uploading}
                />
                <span>Enable AI Price Analysis (Slower - Not Recommended for Bulk Uploads)</span>
                <small>Use Gemini AI to analyze and optimize prices. This will significantly slow down uploads (60-90 minutes for 100 products).</small>
                <div className="rate-limit-warning">
                  ⚠️ <strong>Note:</strong> AI analysis is disabled by default for faster uploads. Free tier allows 2 requests/minute. Processing will take much longer with AI enabled.
                </div>
              </label>
            </div>

            <div className="upload-action-section">
              <button
                className="upload-button"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner />
                    {generateDescription ? (
                      <>Processing products sequentially with AI descriptions... This may take 60-90 minutes for 100+ products.</>
                    ) : useAI ? (
                      <>Uploading with AI analysis... {uploadProgress > 0 && `${uploadProgress}%`}</>
                    ) : (
                      <>Uploading... {uploadProgress > 0 && `${uploadProgress}%`}</>
                    )}
                  </>
                ) : (
                  '🚀 Upload Products'
                )}
              </button>
            </div>
          </div>

          {result && (
            <div className="result-section">
              <h2>Upload Results</h2>
              
              <div className="result-summary">
                <div className="result-card success">
                  <h3>✅ Successful</h3>
                  <p className="result-number">{result.successful}</p>
                  <p className="result-label">Products Created</p>
                </div>
                
                <div className="result-card failed">
                  <h3>❌ Failed</h3>
                  <p className="result-number">{result.failed}</p>
                  <p className="result-label">Products Failed</p>
                </div>
                
                <div className="result-card total">
                  <h3>📊 Total</h3>
                  <p className="result-number">{result.total}</p>
                  <p className="result-label">Products Processed</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="errors-list">
                  <h3>Errors ({result.errors.length})</h3>
                  <div className="errors-container">
                    {result.errors.map((error, index) => (
                      <div key={index} className="error-item">
                        <strong>Row {error.row}:</strong> {error.product_name}
                        <br />
                        <span className="error-text">{error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.price_analyses && result.price_analyses.length > 0 && (
                <div className="price-analyses-section">
                  <h3>💰 AI Price Analysis ({result.price_analyses.length})</h3>
                  <div className="analyses-container">
                    {result.price_analyses.map((analysis, index) => (
                      <div key={index} className="analysis-card">
                        <h4>{analysis.product_name}</h4>
                        <div className="analysis-prices">
                          <div className="price-item">
                            <span className="price-label">Original Price:</span>
                            <span className="price-value">{formatCurrency(analysis.original_price)}</span>
                          </div>
                          <div className="price-item recommended">
                            <span className="price-label">AI Recommended:</span>
                            <span className="price-value">{formatCurrency(analysis.ai_recommended_price)}</span>
                          </div>
                          <div className="price-difference">
                            {analysis.original_price !== analysis.ai_recommended_price && (
                              <span className={`difference ${analysis.ai_recommended_price > analysis.original_price ? 'increase' : 'decrease'}`}>
                                {analysis.ai_recommended_price > analysis.original_price ? '↑' : '↓'} 
                                {Math.abs(((analysis.ai_recommended_price - analysis.original_price) / analysis.original_price) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="analysis-details">
                          <p><strong>Competitiveness:</strong> {analysis.competitiveness}</p>
                          <p><strong>Confidence:</strong> {analysis.confidence}%</p>
                          <p className="analysis-text">{analysis.price_analysis}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.products && result.products.length > 0 && (
                <div className="successful-products-section">
                  <h3>✅ Successfully Created Products</h3>
                  <div className="products-list">
                    {result.products.map((product, index) => (
                      <div key={index} className="product-item">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">{formatCurrency(product.price)}</span>
                        {product.original_price && product.original_price !== product.price && (
                          <span className="price-changed">
                            (Changed from {formatCurrency(product.original_price)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-actions">
                <button
                  className="action-button primary"
                  onClick={() => {
                    if (fromDashboard) {
                      navigate(`/stores/${storeId}/dashboard`, { state: { tab: 'products' } });
                    } else {
                      navigate(`/stores/${storeSlug}/products`);
                    }
                  }}
                >
                  {fromDashboard ? 'Back to Dashboard' : 'View All Products'}
                </button>
                <button
                  className="action-button secondary"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setError('');
                  }}
                >
                  Upload Another File
                </button>
              </div>
            </div>
          )}

          <div className="instructions-section">
            <h3>📋 Excel File Format</h3>
            <p>Your Excel file should contain the following columns:</p>
            <ul>
              <li><strong>Product Name</strong> (Required) - The name of the product</li>
              <li><strong>Price</strong> (Required) - The selling price</li>
              <li><strong>Description</strong> - Full product description</li>
              <li><strong>Short Description</strong> - Brief product summary</li>
              <li><strong>Cost per Item</strong> - Cost price (for margin calculation)</li>
              <li><strong>SKU</strong> - Stock keeping unit</li>
              <li><strong>Barcode</strong> - Product barcode</li>
              <li><strong>Inventory Quantity</strong> - Stock quantity</li>
              <li><strong>Category</strong> - Product category</li>
              <li><strong>Tags</strong> - Comma-separated tags</li>
              <li><strong>Status</strong> - active, draft, or archived</li>
              <li><strong>Images</strong> - Comma-separated image URLs (supports Google Drive links)</li>
            </ul>
            <p className="note">
              <strong>Note:</strong> Only "Product Name" and "Price" are required. 
              Other fields are optional and will use default values if not provided.
            </p>
            <div className="image-url-help">
              <h4>📷 Image URLs Help</h4>
              <p><strong>Format:</strong> Put image URLs in the "Images" column, separated by commas</p>
              <p><strong>Examples:</strong></p>
              <ul>
                <li>Single image: <code>https://example.com/product.jpg</code></li>
                <li>Multiple images: <code>url1.jpg,url2.jpg,url3.jpg</code></li>
                <li>Google Drive: <code>https://drive.google.com/file/d/FILE_ID/view</code> (auto-converted)</li>
              </ul>
              <p><strong>Google Drive:</strong> Make sure sharing is set to "Anyone with the link"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;

