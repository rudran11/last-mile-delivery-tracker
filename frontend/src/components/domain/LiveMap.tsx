import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const agentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const orderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LiveMapProps {
  agents: any[];
  orders: any[]; // Using coordinates if available. In our mock seeding, we used raw points in DB, but API doesn't expose them right now. Wait, I added coordinates to AgentService, but not OrderService.
}

const DEFAULT_CENTER: [number, number] = [28.6139, 77.2090]; // New Delhi

export const LiveMap: React.FC<LiveMapProps> = ({ agents, orders }) => {
  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={DEFAULT_CENTER} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {agents.map((agent) => {
          if (!agent.location) return null;
          return (
            <Marker key={agent.id} position={[agent.location.lat, agent.location.lng]} icon={agentIcon}>
              <Popup>
                <div>
                  <strong>{agent.name}</strong><br/>
                  Status: {agent.isAvailable ? 'Available' : 'Busy'}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Note: In Sprint 2, the Order model uses PostGIS Points, but the /orders API does not serialize them yet.
            For now, we will map agents which we did expose via the patch. 
            If orders had coordinates exposed, we would map them here using orderIcon. */}
      </MapContainer>
    </div>
  );
};
