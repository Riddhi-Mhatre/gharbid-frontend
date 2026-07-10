import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Property } from '../../types/property.types';

interface PropertyMapProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  onPropertyClick?: (id: string) => void;
  zoom?: number;
}

export const PropertyMap = ({ properties, center, onPropertyClick, zoom = 14 }: PropertyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (map.current) return;

    const apiKey = import.meta.env.VITE_LOCATION_API_KEY;
    const region = import.meta.env.VITE_AWS_REGION;

    if (!apiKey || !region) {
      console.error('AWS Location Service credentials are not properly configured.');
      return;
    }

    // Using AWS Location Service Maps v2 which doesn't require a Map resource.
    const mapStyle = 'Standard';
    const styleUrl = `https://maps.geo.${region}.amazonaws.com/v2/styles/${mapStyle}/descriptor?key=${apiKey}&color-scheme=Dark`;

    const initialCenter: [number, number] = center ? [center.lng, center.lat] : [78.9629, 20.5937];
    const initialZoom = center ? zoom : 4;

    map.current = new maplibregl.Map({
      container: mapRef.current,
      style: styleUrl,
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-left');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    let hasValidCoords = false;
    const bounds = new maplibregl.LngLatBounds();

    const grouped = new Map<string, Property[]>();
    properties.forEach(prop => {
      const lat = prop.location?.lat ?? (prop as any).lat;
      const lng = prop.location?.lng ?? (prop as any).lng;
      if (lat !== undefined && lng !== undefined) {
         // Use 4 decimal places for clustering (~11 meters)
         const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
         if (!grouped.has(key)) grouped.set(key, []);
         grouped.get(key)!.push(prop);
      }
    });

    grouped.forEach((group, key) => {
      const [latStr, lngStr] = key.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const count = group.length;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'property-marker group z-10 hover:z-50';
      el.innerHTML = `
        <div class="relative w-12 h-12 flex items-center justify-center transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-110">
          <!-- Pulse ring -->
          <div class="absolute inset-0 bg-primary/40 rounded-full animate-ping opacity-75"></div>
          <div class="absolute inset-1 bg-primary/20 rounded-full blur-md"></div>
          
          <!-- Core marker -->
          <div class="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-[#D97706] flex items-center justify-center shadow-[0_4px_15px_rgba(255,215,0,0.5)] border-[2.5px] border-[#0f0f0f] group-hover:border-primary transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="group-hover:stroke-black transition-colors">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>

          <!-- Count Badge -->
          ${count > 1 ? `
            <div class="absolute -top-1 -right-1 z-20 bg-red-600 text-white font-black text-[11px] min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow-lg border-[2px] border-[#0f0f0f] animate-bounce" style="animation-duration: 2s;">
              ${count}
            </div>
          ` : ''}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);
        
      const popupNode = document.createElement('div');
      popupNode.innerHTML = `
        <div class="p-4 w-72 max-h-80 overflow-y-auto custom-scrollbar bg-black/85 backdrop-blur-xl rounded-2xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/10 ring-1 ring-primary/20">
          <h3 class="font-bold text-primary mb-4 text-[11px] uppercase tracking-widest border-b border-white/10 pb-3 flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Location Properties
            </span>
            <span class="bg-primary text-black font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,215,0,0.5)]">${count}</span>
          </h3>
          <div class="flex flex-col gap-3">
            ${group.map(p => `
              <div class="flex gap-3 p-2.5 bg-white/5 rounded-xl hover:bg-primary/10 cursor-pointer transition-all duration-300 border border-transparent hover:border-primary/40 hover:-translate-y-1 group property-item" data-id="${p.propertyId}">
                 <div class="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-inner">
                    <img src="${p.images?.[0] || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
                 <div class="flex flex-col justify-center flex-1 min-w-0">
                    <span class="text-sm font-bold text-white group-hover:text-primary truncate transition-colors" title="${p.title}">${p.title}</span>
                    <span class="text-[10px] text-muted truncate mt-0.5">${p.city}, ${p.state} • <span class="capitalize text-white/80">${p.type}</span></span>
                    <span class="text-xs font-black text-green-400 mt-1.5 drop-shadow-[0_0_5px_rgba(74,222,128,0.3)]">₹${Number(p.price || p.salePrice || 0).toLocaleString('en-IN')}</span>
                 </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      if (onPropertyClick) {
          popupNode.querySelectorAll('.property-item').forEach(item => {
              item.addEventListener('click', (e) => {
                  const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
                  if (id) {
                      e.stopPropagation();
                      onPropertyClick(id);
                  }
              });
          });
      }
      
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false, maxWidth: '300px', className: 'dark-map-popup' })
          .setDOMContent(popupNode);

      marker.setPopup(popup);

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
      hasValidCoords = true;
    });

    if (!center && hasValidCoords) {
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 });
    } else if (center) {
      map.current.setCenter([center.lng, center.lat]);
      map.current.setZoom(zoom);
    }
  }, [properties, center, zoom, onPropertyClick]);

  return (
    <>
      <style>{`
        .dark-map-popup .maplibregl-popup-content {
          background: transparent;
          padding: 0;
          box-shadow: none;
          border-radius: 0;
        }
        .dark-map-popup .maplibregl-popup-tip {
          border-top-color: #0f0f0f;
          border-bottom-color: #0f0f0f;
        }
      `}</style>
      <div
        ref={mapRef}
        id="property-map"
        className="w-full h-full min-h-full rounded-xl overflow-hidden border border-dark-border"
        role="img"
        aria-label="Property location map"
      />
    </>
  );
};
