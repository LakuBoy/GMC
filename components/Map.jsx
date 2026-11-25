import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet';

const pin = (color, size) => L.divIcon({
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size],
  html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>`,
});
const NORMAL = pin('#2b6cb0', 30);
const ACTIVE = pin('#e53e3e', 40);

// Reports the visible area to the page whenever the map settles.
function Reporter({ onBounds }) {
  const map = useMap();
  const report = () => {
    const b = map.getBounds();
    const c = map.getCenter();
    onBounds({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast(), center: [c.lat, c.lng] });
  };
  useMapEvents({ moveend: report });
  useEffect(() => { map.whenReady(report); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Moves the map when the page asks (search result, location) or when a list card is chosen.
function Mover({ view, places, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (!view.nonce) return;
    if (view.bbox) map.flyToBounds([[view.bbox[0], view.bbox[2]], [view.bbox[1], view.bbox[3]]], { maxZoom: 16 });
    else map.flyTo(view.center, view.zoom ?? 15);
  }, [view.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = places.find((x) => x.id === selectedId);
    if (p && !map.getBounds().pad(-0.1).contains([p.lat, p.lng])) map.panTo([p.lat, p.lng]);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function Map({ view, places, selectedId, onSelect, onBounds }) {
  const markers = useMemo(() => places.slice(0, 120), [places]);
  return (
    <MapContainer center={view.center} zoom={view.zoom} style={{ height: '100%', width: '100%' }} zoomControl>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        maxZoom={19}
      />
      <Reporter onBounds={onBounds} />
      <Mover view={view} places={places} selectedId={selectedId} />
      {markers.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.id === selectedId ? ACTIVE : NORMAL}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        >
          <Tooltip direction="top" offset={[0, -28]}>{p.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
