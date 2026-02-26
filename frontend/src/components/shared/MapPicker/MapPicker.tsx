import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer } from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { DEFAULT_CENTER, DEFAULT_ZOOM, SEARCH_ZOOM_LEVEL } from "./constants";
import { MapContent } from "./MapContent";
import type { LatLngTuple, MapPickerProps } from "./types";
import { isValidCoordinate } from "./utils";
import { useLocationSearch } from "./useLocationSearch";

export function MapPicker({
  latitude,
  longitude,
  flyToLatitude,
  flyToLongitude,
  onCoordinatesChange,
}: MapPickerProps) {
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    onCoordinatesChangeRef.current(lat, lng);
  }, []);

  const {
    query,
    setQuery,
    isSearching,
    error,
    searchResult,
    clearSearch,
  } = useLocationSearch(handleLocationFound, SEARCH_ZOOM_LEVEL);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      onCoordinatesChangeRef.current(lat, lng);
      clearSearch();
    },
    [clearSearch]
  );

  const hasValidCoordinates = isValidCoordinate(latitude, longitude);

  const markerPosition = useMemo((): LatLngTuple | null => {
    return hasValidCoordinates && latitude != null && longitude != null
      ? [latitude, longitude]
      : null;
  }, [hasValidCoordinates, latitude, longitude]);

  const mapCenter = useMemo((): LatLngTuple => {
    return hasValidCoordinates && latitude != null && longitude != null
      ? [latitude, longitude]
      : ([...DEFAULT_CENTER] as LatLngTuple);
  }, [hasValidCoordinates, latitude, longitude]);

  const flyToLat = flyToLatitude ?? latitude;
  const flyToLng = flyToLongitude ?? longitude;

  return (
    <div className="flex flex-col gap-2">
      <TextInput
        placeholder="Search for a location"
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        error={error}
        size="sm"
        aria-busy={isSearching}
      />
      <div className="h-[280px] w-full overflow-hidden rounded-md border border-(--mantine-color-default-border)">
        <MapContainer
          center={mapCenter}
          zoom={hasValidCoordinates ? SEARCH_ZOOM_LEVEL : DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom
        >
          <MapContent
            markerPosition={markerPosition}
            flyToLat={flyToLat}
            flyToLng={flyToLng}
            searchResult={searchResult}
            onMapClick={handleMapClick}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-(--mantine-color-dimmed)">
        Click on the map to pick a location, or search above (min 3 characters).
      </p>
    </div>
  );
}
