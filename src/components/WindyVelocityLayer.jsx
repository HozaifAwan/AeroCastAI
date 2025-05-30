import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-velocity'; // Ensures the plugin is loaded

const WindyVelocityLayer = ({ windDataUrl }) => {
  const map = useMap();

  useEffect(() => {
    let velocityLayer = null;

    if (windDataUrl) {
      fetch(windDataUrl)
        .then(response => response.json())
        .then(data => {
          velocityLayer = L.velocityLayer({
            displayValues: true,
            displayOptions: {
              velocityType: 'Wind',
              position: 'bottomleft',
              emptyString: 'No wind data',
              angleConvention: 'bearingCW',
              speedUnit: 'm/s'
            },
            data: data,
            maxVelocity: 15, // Adjust as needed
            colorScale: [ // Example color scale - customize as you wish
              "rgb(36,104, 180)",
              "rgb(60,157, 194)",
              "rgb(128,205,193 )",
              "rgb(151,218,168 )",
              "rgb(198,231,181)",
              "rgb(238,247,217)",
              "rgb(255,238,159)",
              "rgb(252,217,125)",
              "rgb(255,182,100)",
              "rgb(252,150,75)",
              "rgb(250,112,52)",
              "rgb(245,64,32)",
              "rgb(237,45,28)",
              "rgb(220,24,32)",
              "rgb(180,0,35)"
            ],
            // Optional: onAdd and onRemove can be used for more complex lifecycle management
          });

          if (velocityLayer) {
            map.addLayer(velocityLayer);
          }
        })
        .catch(err => console.error("Failed to load wind data for velocity layer:", err));
    }

    return () => {
      if (velocityLayer && map) {
        map.removeLayer(velocityLayer);
      }
    };
  }, [map, windDataUrl]); // Rerun if map instance or data URL changes

  return null; // This component does not render anything itself
};

export default WindyVelocityLayer;