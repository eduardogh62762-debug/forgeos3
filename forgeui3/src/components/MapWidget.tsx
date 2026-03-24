import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { motion } from 'framer-motion'

// Fix default marker icon issue in Leaflet + Vite
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface MapProps {
  center: [number, number]
  zoom?: number
  points?: { lat: number, lng: number, label: string }[]
  polygons?: [number, number][][]
  height?: string
}

export function MapWidget({ center, zoom = 13, points = [], polygons = [], height = '200px' }: MapProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-[24px] overflow-hidden border border-white/10 shadow-2xl relative z-0"
      style={{ height }}
    >
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {points.map((p, i) => (
          <Marker key={i} position={[p.lat, p.lng]}>
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
        {polygons.map((poly, i) => (
          <Polygon 
            key={i} 
            positions={poly} 
            pathOptions={{ 
              color: '#8b5cf6', 
              fillColor: '#8b5cf6', 
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '5, 5'
            }} 
          />
        ))}
      </MapContainer>
      
      {/* Overlay for glass effect on edges */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] rounded-[24px]" />
    </motion.div>
  )
}
