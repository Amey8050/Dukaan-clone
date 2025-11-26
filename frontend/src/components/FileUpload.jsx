import { useState, useRef } from 'react';
import uploadService from '../services/uploadService';
import './FileUpload.css';

const FileUpload = ({ 
  onUpload, 
  onError, 
  multiple = false, 
  bucket = 'product-images',
  folder = '',
  maxFiles = 10,
  accept = 'image/*',
  label = 'Upload File'
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Validate file count
    if (!multiple && files.length > 1) {
      onError?.('Please select only one file');
      return;
    }

    if (files.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => multiple ? [...prev, ...newPreviewUrls] : newPreviewUrls);

    try {
      setUploading(true);

      if (multiple) {
        const result = await uploadService.uploadMultipleFiles(files, { bucket, folder });
        if (result.success) {
          const successfulUploads = result.data.files.filter(f => !f.error);
          setUploadedFiles(prev => [...prev, ...successfulUploads]);
          onUpload?.(successfulUploads);
          
          if (result.data.failed > 0) {
            onError?.(`${result.data.failed} file(s) failed to upload`);
          }
        } else {
          throw new Error(result.error?.message || 'Upload failed');
        }
      } else {
        const result = await uploadService.uploadFile(files[0], { bucket, folder });
        if (result.success) {
          setUploadedFiles([result.data]);
          onUpload?.(result.data);
        } else {
          throw new Error(result.error?.message || 'Upload failed');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error.response?.data?.error?.message || error.message || 'Failed to upload file');
      // Clear previews on error
      setPreviewUrls(prev => multiple ? prev.slice(0, -files.length) : []);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    if (uploadedFiles[index]) {
      onUpload?.(uploadedFiles.filter((_, i) => i !== index));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-container">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="upload-area" onClick={handleClick}>
        {uploading ? (
          <div className="upload-status">
            <div className="upload-spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <div className="upload-placeholder">
            <p className="upload-label">{label}</p>
            <p className="upload-hint">
              {multiple ? `Click to select up to ${maxFiles} files` : 'Click to select a file'}
            </p>
            <p className="upload-format">PNG, JPG, WEBP up to 5MB</p>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {(previewUrls.length > 0 || uploadedFiles.length > 0) && (
        <div className="preview-grid">
          {previewUrls.map((url, index) => (
            <div key={index} className="preview-item">
              <img src={url} alt={`Preview ${index + 1}`} />
              <button
                className="remove-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                disabled={uploading}
              >
                ×
              </button>
              {uploadedFiles[index] && (
                <div className="upload-success">
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files Info */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-info">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="file-info">
              <span className="file-name">{file.originalName}</span>
              <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

