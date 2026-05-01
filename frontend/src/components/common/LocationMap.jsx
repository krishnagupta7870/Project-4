import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from '@mapbox/polyline';

// Fix for default marker icons in Leaflet with webpack
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }) {
  const map = useMapEvents({
    click: (e) => {
      // Prevent default behavior and ensure we get the coordinates
      e.originalEvent.stopPropagation();
      const { lat, lng } = e.latlng;

      // Call the handler immediately with precise coordinates
      onMapClick(lat, lng);
    },
  });
  return null;
}

export default function LocationMap({
  onLocationSelect,
  initialPosition,
  height = '400px',
  readOnly = false,
  userLocation,
  locationError,
  loadingLocation,
  getUserLocation,
  routeGeometry
}) {
  const [position, setPosition] = useState(initialPosition || [28.2096, 83.9856]); // Default: Pokhara
  const [isLocationSelected, setIsLocationSelected] = useState(!!initialPosition);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [routePositions, setRoutePositions] = useState([]);
  const mapRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const requestIdRef = useRef(0); // Track latest request
  const hasUserInteracted = useRef(false); // Track if user has interacted with map

  // Only set initial position on first load, not on subsequent updates
  useEffect(() => {
    if (initialPosition && !hasUserInteracted.current) {
      setPosition(initialPosition);
      reverseGeocode(initialPosition[0], initialPosition[1]);
    }
  }, [initialPosition]);

  // Decode route geometry when it changes
  useEffect(() => {
    if (!routeGeometry) {
      setRoutePositions([]);
      return;
    }

    if (typeof routeGeometry === 'string') {
      try {
        const decoded = polyline.decode(routeGeometry);
        setRoutePositions(decoded);

        // Fit bounds to show entire route
        if (mapRef.current && decoded.length > 0) {
          mapRef.current.fitBounds(decoded, { padding: [50, 50] });
        }
      } catch (e) {
        console.error("Error decoding polyline:", e);
      }
    } else if (routeGeometry && typeof routeGeometry === 'object' && routeGeometry.coordinates) {
      // Handle GeoJSON format (ORS sometimes returns this)
      const coords = routeGeometry.coordinates.map(coord => [coord[1], coord[0]]); // GeoJSON is [lng, lat], Leaflet needs [lat, lng]
      setRoutePositions(coords);

      if (mapRef.current && coords.length > 0) {
        mapRef.current.fitBounds(coords, { padding: [50, 50] });
      }
    }
  }, [routeGeometry]);

  // Handle "My Location" click
  const handleMyLocationClick = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1.5
      });
    }
    if (getUserLocation) {
      getUserLocation();
    }
  };

  const reverseGeocode = useCallback(async (lat, lng, retryCount = 0) => {
    // Clear any existing timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Generate new request ID
    const currentRequestId = ++requestIdRef.current;
    setIsGeocoding(true);

    // Reduce delay for faster response
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        // Use more precise zoom level for better address accuracy
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(8)}&lon=${lng.toFixed(8)}&zoom=16&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'DealmateApp/1.0' // Add user agent to prevent blocking
            }
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding failed');
        }

        const data = await response.json();

        // Only update if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          if (data.display_name) {
            // Create area-level address for buyers (hide precise details)
            const buyerAddress = createBuyerFriendlyAddress(data.address);
            const fullAddress = data.display_name;

            setAddress(fullAddress);
            onLocationSelect({
              latitude: lat,
              longitude: lng,
              address: fullAddress,
              area: buyerAddress,
              buyerVisibleAddress: buyerAddress
            });
          } else {
            throw new Error('No address found');
          }
        }
      } catch (error) {
        console.error('Error reverse geocoding:', error);

        // Only retry if this is still the latest request
        if (currentRequestId === requestIdRef.current && retryCount === 0) {
          console.log('Retrying geocoding...');
          setTimeout(() => reverseGeocode(lat, lng, 1), 500);
          return;
        }

        // Only update if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(fallbackAddress);
          onLocationSelect({
            latitude: lat,
            longitude: lng,
            address: fallbackAddress,
            area: 'Unknown Area',
            buyerVisibleAddress: 'Unknown Area'
          });
        }
      } finally {
        // Only update loading state if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setIsGeocoding(false);
        }
      }
    }, 100); // Reduced to 100ms for faster response
  }, [onLocationSelect]);

  const createBuyerFriendlyAddress = (addressData) => {
    // Create area-level address with better formatting like "Budibazar-26, Pokhara, Gandaki, Nepal"
    const parts = [];

    // Try to get the most specific area first (suburb, quarter, neighbourhood)
    if (addressData.suburb || addressData.quarter || addressData.neighbourhood) {
      let specificArea = addressData.suburb || addressData.quarter || addressData.neighbourhood;

      // If there's a house number or road, append it with hyphen
      if (addressData.house_number) {
        specificArea = `${specificArea}-${addressData.house_number}`;
      }
      parts.push(specificArea);
    }

    // Add city/town/village
    if (addressData.city || addressData.town || addressData.village) {
      parts.push(addressData.city || addressData.town || addressData.village);
    }

    // Add district/county
    if (addressData.district || addressData.county) {
      parts.push(addressData.district || addressData.county);
    }

    // Add state/region
    if (addressData.state || addressData.region) {
      parts.push(addressData.state || addressData.region);
    }

    // Add country
    if (addressData.country) {
      parts.push(addressData.country);
    }

    return parts.length > 0 ? parts.join(', ') : 'Unknown Area';
  };

  const searchLocation = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length > 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchLocation(query);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchLocation(searchQuery);
  };

  const handleSearchResultClick = (result) => {
    // Mark that user has interacted with the map
    hasUserInteracted.current = true;

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const newPosition = [lat, lng];

    setPosition(newPosition);
    setIsLocationSelected(true);
    reverseGeocode(lat, lng);
    setSearchResults([]);
    setSearchQuery('');

    // Center the map on the selected location
    if (mapRef.current) {
      mapRef.current.flyTo(newPosition, 15, {
        duration: 1.5
      });
    }
  };

  const handleMapClick = useCallback((lat, lng) => {
    // Mark that user has interacted with the map
    hasUserInteracted.current = true;

    // Clear previous address immediately
    setAddress('');

    // Immediate visual feedback - update position right away
    const newPosition = [lat, lng];
    setPosition(newPosition);
    setIsLocationSelected(true);

    // Show temporary message while geocoding
    setAddress('Getting address...');

    // Then do the geocoding
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const target = initialPosition || position;
    if (!target) return;
    mapRef.current.flyTo(target, 15, {
      duration: 1.2
    });
  };

  const handleZoomIn = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapRef.current) return;
    mapRef.current.zoomOut();
  };

  return (
    <div style={{ position: 'relative', height }}>
      {!readOnly && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '400px'
        }}>
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'white',
              padding: '4px',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search for a location..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={isSearching}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          {/* Search Results Overlay */}
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              zIndex: 1001,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              maxHeight: '180px',
              overflowY: 'auto',
              width: '100%',
              marginTop: '4px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  <div style={{ fontWeight: '600', color: '#111827' }}>{result.display_name.split(',')[0]}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {result.display_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <MapContainer
        ref={mapRef}
        center={position}
        zoom={13}
        zoomControl={false}
        style={{ height, width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isLocationSelected && (
          <Marker
            position={position}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
            eventHandlers={{
              click: () => handleMapClick(position[0], position[1])
            }}
          >
            <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
              🏠 Selected Product Location
            </Tooltip>
          </Marker>
        )}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={new Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
            eventHandlers={{
              click: () => handleMapClick(userLocation.lat, userLocation.lng)
            }}
          >
            <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
              📍 Your Location (Click to Select)
            </Tooltip>
          </Marker>
        )}

        {routePositions.length > 0 && (
          <Polyline
            positions={routePositions}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
          />
        )}

        {!readOnly && <MapClickHandler onMapClick={handleMapClick} />}
      </MapContainer>
      <div
        style={{
          position: 'absolute',
          right: '12px',
          bottom: address ? '48px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 1000
        }}
      >
        <button
          type="button"
          onClick={handleMyLocationClick}
          disabled={loadingLocation}
          title={loadingLocation ? 'Getting location...' : userLocation ? 'My Location' : 'Show my location'}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: userLocation ? '#fff' : 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loadingLocation ? 'wait' : 'pointer',
            padding: 0,
            transition: 'all 0.2s ease',
            color: userLocation ? '#2563eb' : '#64748b'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        </button>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }}
        >
          <button
            type="button"
            onClick={handleZoomIn}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '22px',
              color: '#64748b'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            style={{
              width: '40px',
              height: '40px',
              border: 'none',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#64748b'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            –
          </button>
        </div>
      </div>

      {locationError && (
        <div style={{
          position: 'absolute',
          right: '60px',
          bottom: '100px',
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '13px',
          color: '#ef4444',
          zIndex: 1000,
          border: '1px solid #fee2e2'
        }}>
          {locationError}
        </div>
      )}

      {!readOnly && address && (
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          right: '60px', // Avoid overlapping with controls
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 12px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          fontSize: '12px',
          color: '#1e293b',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backdropFilter: 'blur(4px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <strong style={{ color: '#2563eb' }}>Selected:</strong> {address}
          {isGeocoding && (
            <span style={{ marginLeft: '8px', color: '#3b82f6', fontStyle: 'italic' }}>
              (Updating...)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
