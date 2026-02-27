export function isValidCoordinate(
  lat: number | undefined,
  lng: number | undefined
): boolean {
  return (
    lat != null &&
    lng != null &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}
