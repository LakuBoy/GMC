import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import { pinHtml } from './icons';

const pin = (category, active) => {
  const size = active ? 46 : 34;
  return L.divIcon({
    className: '', iconSize: [size, size], iconAnchor: [size / 2, size],
    html: pinHtml(category, size, active ? '#f97316' : undefined),
  });
};

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

// Moves the map when the page asks (search result, location) or when a place is chosen.
function Mover({ view, selected, bottomPad }) {
  const map = useMap();
  useEffect(() => {
    if (!view.nonce) return;
    if (view.bbox) map.flyToBounds([[view.bbox[0], view.bbox[2]], [view.bbox[1], view.bbox[3]]], { maxZoom: 16 });
    else map.flyTo(view.center, view.zoom ?? 15);
  }, [view.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selected) return;
    // Keep the chosen place visible, clear of the header and (on phones) the bottom sheet.
    map.panInside([selected.lat, selected.lng], { paddingTopLeft: [40, 150], paddingBottomRight: [40, bottomPad + 40] });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Darkens the tiles in dark mode.
function Theme({ dark }) {
  const map = useMap();
  useEffect(() => { map.getContainer().classList.toggle('map-dark', dark); }, [dark, map]);
  return null;
}

// Clustered pins (a crowded area shows a count, zooming in splits it). The chosen place is drawn on its own, always visible.
function Pins({ places, selected, onSelect }) {
  const map = useMap();
  const group = useRef(null);
  const chosen = useRef(null);

  useEffect(() => {
    group.current = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 48, spiderfyOnMaxZoom: true,
      iconCreateFunction: (c) => L.divIcon({
        html: `<div class="cluster-icon" style="width:42px;height:42px">${c.getChildCount()}</div>`,
        className: '', iconSize: [42, 42],
      }),
    });
    map.addLayer(group.current);
    return () => { map.removeLayer(group.current); if (chosen.current) map.removeLayer(chosen.current); };
  }, [map]);

  useEffect(() => {
    group.current.clearLayers();
    places.slice(0, 200).filter((p) => p.id !== selected?.id).forEach((p) => {
      const marker = L.marker([p.lat, p.lng], { icon: pin(p.category, false), title: p.name, alt: p.name });
      marker.on('click', () => onSelect(p));
      marker.bindTooltip(p.name, { direction: 'top', offset: [0, -30] });
      group.current.addLayer(marker);
    });
  }, [places, selected?.id, onSelect]);

  useEffect(() => {
    if (chosen.current) { map.removeLayer(chosen.current); chosen.current = null; }
    if (selected) {
      chosen.current = L.marker([selected.lat, selected.lng], {
        icon: pin(selected.category, true), zIndexOffset: 1000, title: selected.name, alt: selected.name,
      }).addTo(map);
    }
  }, [selected, map]);

  return null;
}

export default function Map({ view, places, selected, onSelect, onBounds, dark, userPos, bottomPad = 0, showZoom = true }) {
  return (
    <MapContainer center={view.center} zoom={view.zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      {showZoom && <ZoomControl position="bottomright" />}
      <Theme dark={dark} />
      <Reporter onBounds={onBounds} />
      <Mover view={view} selected={selected} bottomPad={bottomPad} />
      <Pins places={places} selected={selected} onSelect={onSelect} />
      {userPos && (
        <CircleMarker center={userPos} radius={8} pathOptions={{ color: '#fff', weight: 3, fillColor: '#2b6cb0', fillOpacity: 1 }} />
      )}
    </MapContainer>
  );
}
