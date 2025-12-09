import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useStoreBySlug from '../hooks/useStoreBySlug';
import storeService from '../services/storeService';
import './StoreLocation.css';

const StoreLocation = () => {
  const { storeId: storeSlug } = useParams();
  const navigate = useNavigate();
  const {
    storeId,
    store: resolvedStore,
    loading: storeLookupLoading,
    error: storeLookupError
  } = useStoreBySlug(storeSlug);
  
  const [storeWithSettings, setStoreWithSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch store with settings if not included in resolvedStore
  useEffect(() => {
    if (storeId && !storeLookupLoading) {
      loadStoreWithSettings();
    }
  }, [storeId, storeLookupLoading]);

  const loadStoreWithSettings = async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      // Fetch store directly to ensure we get settings
      const result = await storeService.getStore(storeId);
      if (result.success && result.data.store) {
        setStoreWithSettings(result.data.store);
      } else {
        // Fallback to resolvedStore if fetch fails
        setStoreWithSettings(resolvedStore);
      }
    } catch (err) {
      console.error('Error loading store with settings:', err);
      // Fallback to resolvedStore
      setStoreWithSettings(resolvedStore);
    } finally {
      setLoading(false);
    }
  };
  
  if (storeLookupLoading || loading) {
    return (
      <div className="store-location-container">
        <div className="loading">Loading store location...</div>
      </div>
    );
  }

  if (storeLookupError || !storeId) {
    return (
      <div className="store-location-container">
        <div className="error-message">
          {storeLookupError || 'Store not found'}
        </div>
      </div>
    );
  }

  // Use storeWithSettings if available, otherwise fallback to resolvedStore
  const store = storeWithSettings || resolvedStore;
  
  // Get location from store settings
  // Settings structure: { location: { embed_map_code: "..." } }
  const location = store?.settings?.location || {};
  const embedMapCode = location.embed_map_code;
  const hasLocation = embedMapCode && embedMapCode.trim().length > 0;

  // Debug logging - check browser console
  console.log('=== Store Location Debug ===');
  console.log('Store Object:', store);
  console.log('Store Settings:', store?.settings);
  console.log('Settings Location:', store?.settings?.location);
  console.log('Location Object:', location);
  console.log('Embed Map Code:', embedMapCode);
  console.log('Has Location:', hasLocation);
  console.log('===========================');

  return (
    <div className="store-location-container">
      <header className="location-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="header-content">
          <h1>{store?.name || 'Store'} Location</h1>
          {store?.name && (
            <p className="store-subtitle">Find us on the map</p>
          )}
        </div>
      </header>

      <main className="location-content">
        {!hasLocation ? (
          <div className="no-location-message">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <h2>Location Not Available</h2>
            <p>This store hasn't set up their location yet.</p>
            <p className="hint">Store owners can add their location map in the store settings.</p>
          </div>
        ) : (
          <div className="location-details">
            <div className="map-section">
              <div 
                className="embedded-map"
                dangerouslySetInnerHTML={{ __html: embedMapCode }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StoreLocation;

