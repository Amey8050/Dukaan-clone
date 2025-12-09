import { useMemo } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import './GoogleMap.css';

const GoogleMapComponent = ({ 
  latitude, 
  longitude, 
  address,
  zoom = 15,
  height = '400px',
  width = '100%'
}) => {
  const center = useMemo(() => ({
    lat: latitude || 28.6139, // Default to New Delhi
    lng: longitude || 77.2090
  }), [latitude, longitude]);

  const mapContainerStyle = {
    width: width,
    height: height,
    borderRadius: '12px',
    overflow: 'hidden'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: false,
    fullscreenControl: true,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        <div className="map-placeholder-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p>Google Maps API key not configured</p>
          <small>Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</small>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="map-placeholder">
        <div className="map-placeholder-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p>No location data available</p>
          {address && <small>{address}</small>}
        </div>
      </div>
    );
  }

  return (
    <div className="google-map-container">
      {address && (
        <div className="map-address">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{address}</span>
        </div>
      )}
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          options={mapOptions}
        >
          <Marker
            position={center}
            title={address || 'Store Location'}
          />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default GoogleMapComponent;

