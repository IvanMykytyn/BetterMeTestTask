import type L from "leaflet";

export type LatLngTuple = L.LatLngTuple;

export type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export type MapPickerProps = {
  latitude: number | undefined;
  longitude: number | undefined;
  /** Debounced coordinates for map flyTo - avoids panning on every keystroke */
  flyToLatitude?: number | undefined;
  flyToLongitude?: number | undefined;
  onCoordinatesChange: (lat: number, lng: number) => void;
};

export type SearchResult = {
  lat: number;
  lng: number;
  zoom: number;
};
