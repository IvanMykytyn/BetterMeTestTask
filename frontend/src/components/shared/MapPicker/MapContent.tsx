import L from "leaflet";
import { memo, useEffect } from "react";
import { Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { isValidCoordinate } from "./utils";
import type { LatLngTuple, SearchResult } from "./types";

const DEFAULT_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapClickHandler = memo(function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
});

function MapSync({
  lat,
  lng,
  searchResult,
}: {
  lat: number | undefined;
  lng: number | undefined;
  searchResult: SearchResult | null;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
  }, [map]);

  useEffect(() => {
    if (searchResult) {
      map.flyTo([searchResult.lat, searchResult.lng], searchResult.zoom, {
        duration: 0.5,
      });
    } else if (lat != null && lng != null && isValidCoordinate(lat, lng)) {
      map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
    }
  }, [lat, lng, map, searchResult]);

  return null;
}

type MapContentProps = {
  markerPosition: LatLngTuple | null;
  flyToLat: number | undefined;
  flyToLng: number | undefined;
  searchResult: SearchResult | null;
  onMapClick: (lat: number, lng: number) => void;
};

export function MapContent({
  markerPosition,
  flyToLat,
  flyToLng,
  searchResult,
  onMapClick,
}: MapContentProps) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      <MapSync
        lat={flyToLat}
        lng={flyToLng}
        searchResult={searchResult}
      />
      {markerPosition && (
        <Marker position={markerPosition} icon={DEFAULT_ICON} />
      )}
    </>
  );
}
