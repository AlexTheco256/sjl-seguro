import { useEffect } from 'react';
import { MapContainer, Rectangle, TileLayer, useMap } from 'react-leaflet';
import { CENTRO_SJL, LIMITES_SJL } from '../util.js';

const LIMITES = [
  [LIMITES_SJL.latMin, LIMITES_SJL.lngMin],
  [LIMITES_SJL.latMax, LIMITES_SJL.lngMax],
];

/** Mapa base de San Juan de Lurigancho (OpenStreetMap). */
export function MapaBase({ children, centro = CENTRO_SJL, zoom = 13, alto = '100%', className = '' }) {
  return (
    <MapContainer
      center={centro}
      zoom={zoom}
      minZoom={11}
      maxBounds={[
        [-12.15, -77.15],
        [-11.8, -76.85],
      ]}
      style={{ height: alto, width: '100%' }}
      className={className}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <Rectangle
        bounds={LIMITES}
        pathOptions={{ color: '#1e3a8a', weight: 1.5, dashArray: '6 6', fill: false, interactive: false }}
      />
      {children}
    </MapContainer>
  );
}

/** Recentra el mapa cuando cambian las coordenadas. */
export function Recentrar({ centro, zoom }) {
  const mapa = useMap();
  useEffect(() => {
    if (centro) mapa.setView(centro, zoom ?? mapa.getZoom());
  }, [mapa, centro, zoom]);
  return null;
}
