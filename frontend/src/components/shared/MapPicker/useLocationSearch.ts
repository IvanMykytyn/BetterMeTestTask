import { useDebouncedValue } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  NOMINATIM_URL,
  MIN_SEARCH_LENGTH,
  SEARCH_DEBOUNCE_MS,
  SEARCH_RESULT_CLEAR_MS,
} from "./constants";
import type { NominatimResult } from "./types";

const USER_AGENT = "BetterMeOrders/1.0 (location picker)";

async function fetchLocation(query: string): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "1",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const data = (await res.json()) as NominatimResult[];
  const result = data[0];
  return result?.lat != null && result?.lon != null ? result : null;
}

export function useLocationSearch(
  onLocationFound: (lat: number, lng: number) => void,
  searchZoomLevel: number
) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  const onLocationFoundRef = useRef(onLocationFound);
  useEffect(() => {
    onLocationFoundRef.current = onLocationFound;
  }, [onLocationFound]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setError(null);
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed || trimmed.length < MIN_SEARCH_LENGTH) {
      queueMicrotask(() => {
        setIsSearching(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setIsSearching(true);
        setError(null);
      }
    });

    void fetchLocation(trimmed)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          onLocationFoundRef.current(lat, lng);
          setSearchResult({ lat, lng, zoom: searchZoomLevel });
        } else {
          setError("Location not found");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Search failed");
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchZoomLevel]);

  useEffect(() => {
    if (!searchResult) return;
    const id = setTimeout(() => setSearchResult(null), SEARCH_RESULT_CLEAR_MS);
    return () => clearTimeout(id);
  }, [searchResult]);

  return { query, setQuery, isSearching, error, searchResult, clearSearch };
}
