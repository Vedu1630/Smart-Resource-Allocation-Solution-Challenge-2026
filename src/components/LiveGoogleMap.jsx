import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { API_BASE_URL } from '../config';

export default function LiveGoogleMap() {
    const mapRef = useRef(null);
    const { needs, volunteers } = useApp();
    const [apiKey, setApiKey] = useState('');
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Google Maps API Key from the backend config endpoint
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/config`);
                const data = await response.json();
                setApiKey(data.googleMapsApiKey || '');
            } catch (err) {
                console.error('Failed to load Google Maps API key from backend config', err);
            }
        };
        fetchConfig();
    }, []);

    // Load Google Maps script dynamically
    useEffect(() => {
        // If script is already loaded in window
        if (window.google && window.google.maps) {
            setScriptLoaded(true);
            return;
        }

        const scriptId = 'google-maps-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMapsCallback`;
            script.async = true;
            script.defer = true;
            
            window.initGoogleMapsCallback = () => {
                setScriptLoaded(true);
            };

            script.onerror = () => {
                setError('Google Maps could not be loaded. Please check your network or API key.');
            };

            document.head.appendChild(script);
        } else {
            // Script tag exists, wait for callback if not loaded
            const checkLoaded = setInterval(() => {
                if (window.google && window.google.maps) {
                    setScriptLoaded(true);
                    clearInterval(checkLoaded);
                }
            }, 100);
            return () => clearInterval(checkLoaded);
        }
    }, [apiKey]);

    // Initialize Map and Markers
    useEffect(() => {
        if (!scriptLoaded || !mapRef.current) return;

        // Coordinates center default (Mumbai area from seeds)
        const center = { lat: 19.076, lng: 72.877 };

        // Custom premium dark styling for the Google Map
        const darkMapStyle = [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }]
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }]
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }]
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }]
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }]
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }]
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }]
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f282c" }]
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }]
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }]
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }]
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }]
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }]
            }
        ];

        const mapOptions = {
            zoom: 12,
            center: center,
            styles: darkMapStyle,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        };

        const map = new window.google.maps.Map(mapRef.current, mapOptions);
        const infoWindow = new window.google.maps.InfoWindow();

        // 1. Plot Needs as Red/Coral Markers
        needs.forEach(need => {
            const lat = need.gps?.lat || center.lat;
            const lng = need.gps?.lng || center.lng;

            // Custom pin icon (Red)
            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: need.title,
                icon: {
                    path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                    fillColor: need.severity >= 8 ? '#f87171' : '#fbbf24', // red/coral for high, amber for med
                    fillOpacity: 0.9,
                    strokeWeight: 1.5,
                    strokeColor: '#ffffff',
                    scale: 6
                }
            });

            // Click listener for details InfoWindow
            marker.addListener('click', () => {
                const contentString = `
                    <div style="color: #1f2937; padding: 4px; font-family: sans-serif;">
                        <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600;">${need.title}</h4>
                        <div style="margin-bottom: 6px;">
                            <span style="font-size: 10px; padding: 2px 6px; background: #fee2e2; color: #991b1b; border-radius: 4px; font-weight: 500;">
                                Severity: ${need.severity}/10
                            </span>
                            <span style="font-size: 10px; padding: 2px 6px; background: #e0f2fe; color: #075985; border-radius: 4px; margin-left: 4px;">
                                ${need.category}
                            </span>
                        </div>
                        <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.4;">${need.description}</p>
                        <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">Status: ${need.status}</div>
                    </div>
                `;
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });
        });

        // 2. Plot Active Volunteers as Green Markers
        volunteers.forEach(vol => {
            const lat = vol.gps?.lat || center.lat;
            const lng = vol.gps?.lng || center.lng;

            if (vol.status !== 'active') return;

            // Custom pin icon (Green)
            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                title: vol.name,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#10b981', // emerald green
                    fillOpacity: 0.9,
                    strokeWeight: 1.5,
                    strokeColor: '#ffffff',
                    scale: 6
                }
            });

            marker.addListener('click', () => {
                const contentString = `
                    <div style="color: #1f2937; padding: 4px; font-family: sans-serif;">
                        <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #065f46;">🟢 ${vol.name}</h4>
                        <div style="font-size: 10px; color: #4b5563; margin-bottom: 6px;">Active Volunteer</div>
                        <div style="margin-bottom: 4px;">
                            ${vol.skills?.slice(0, 3).map(s => `
                                <span style="font-size: 9px; padding: 1px 4px; background: #ecfdf5; color: #047857; border: 0.5px solid #a7f3d0; border-radius: 3px; margin-right: 2px;">
                                    ${s}
                                </span>
                            `).join('')}
                        </div>
                        <div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">Logged: ${Math.round(vol.hoursLogged || 0)}h</div>
                    </div>
                `;
                infoWindow.setContent(contentString);
                infoWindow.open(map, marker);
            });
        });

    }, [scriptLoaded, needs, volunteers]);

    if (error) {
        return (
            <div style={{
                height: 380, width: '100%', background: 'var(--color-gray-100)',
                borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--color-coral-600)', fontSize: 12
            }}>
                ⚠️ {error}
            </div>
        );
    }

    if (!scriptLoaded) {
        return (
            <div style={{
                height: 380, width: '100%', background: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 12
            }}>
                <div className="skeleton" style={{ height: 40, width: 40, borderRadius: '50%' }}></div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Loading Real-time Crisis Map...</div>
            </div>
        );
    }

    return (
        <div 
            ref={mapRef} 
            style={{ 
                height: 380, 
                width: '100%', 
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                border: '0.5px solid var(--color-border-tertiary)'
            }} 
        />
    );
}
