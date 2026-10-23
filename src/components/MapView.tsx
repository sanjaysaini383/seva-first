import { createElement, useEffect, useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { t } from '../lib/i18n';
import { categoryMeta, type LngLat, type Post } from '../lib/types';

type Props = {
  center: LngLat;
  radiusKm: number;
  posts: Post[];
  selectedId: string | null;
  freshIds: Set<string>;
  composing: boolean;
  dark: boolean;
  me: LngLat | null;
  onMove: (center: LngLat) => void;
  onSelect: (id: string) => void;
  flyTo: { at: LngLat; seq: number } | null;
};

const toLatLng = ([lng, lat]: LngLat): [number, number] => [lat, lng];

// Leaflet markers take an HTML string, so render each category's icon to SVG once.
const glyphs = new Map<string, string>();
function glyph(category: Post['category']) {
  if (!glyphs.has(category)) {
    const meta = categoryMeta(category);
    glyphs.set(category, renderToStaticMarkup(createElement(meta.icon, { size: 16, color: '#fff', strokeWidth: 2.25 })));
  }
  return glyphs.get(category)!;
}

function pinIcon(post: Post, selected: boolean, fresh: boolean) {
  const meta = categoryMeta(post.category);
  const classes = [
    'pin',
    `pin--${post.kind}`,
    `pin--${post.status}`,
    post.urgency === 'high' && post.status === 'open' ? 'pin--urgent' : '',
    selected ? 'pin--selected' : '',
    fresh ? 'pin--fresh' : '',
  ].join(' ');
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="${classes}" style="--pin:${meta.color}"><span>${glyph(post.category)}</span></div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

const meIcon = L.divIcon({ className: 'pin-wrap', html: '<div class="me-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

function Events({ onMove }: { onMove: (c: LngLat) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onMove([c.lng, c.lat]);
    },
  });
  return null;
}

function Flyer({ flyTo }: { flyTo: Props['flyTo'] }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(toLatLng(flyTo.at), Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [flyTo, map]);
  return null;
}

export function MapView(props: Props) {
  const { center, radiusKm, posts, selectedId, freshIds, composing, dark, me, onMove, onSelect, flyTo } = props;
  const initial = useMemo(() => toLatLng(center), []);

  return (
    <div className={`map ${composing ? 'map--composing' : ''} ${dark ? 'map--dark' : ''}`}>
      <MapContainer center={initial} zoom={14} zoomControl={false} className="map__leaflet">
        {/* Standard OSM raster tiles (no key); warmed and dark-moded with CSS filters in styles.css. */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Events onMove={onMove} />
        <Flyer flyTo={flyTo} />
        <Circle
          center={toLatLng(center)}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#ea580c', weight: 1.25, dashArray: '4 6', fillColor: '#ea580c', fillOpacity: 0.035 }}
          interactive={false}
        />
        {me && <Marker position={toLatLng(me)} icon={meIcon} interactive={false} />}
        {posts.map((p) => (
          <Marker
            key={p.$id}
            position={toLatLng(p.location)}
            icon={pinIcon(p, p.$id === selectedId, freshIds.has(p.$id))}
            eventHandlers={{ click: () => onSelect(p.$id) }}
            zIndexOffset={p.$id === selectedId ? 1000 : p.status === 'open' ? 100 : 0}
          />
        ))}
      </MapContainer>
      {composing && (
        <div className="crosshair" aria-hidden>
          <div className="crosshair__pin">
            <MapPin size={40} strokeWidth={2} fill="var(--accent)" color="#fff" />
          </div>
          <div className="crosshair__hint">{t('map.crosshair')}</div>
        </div>
      )}
    </div>
  );
}
