// Simple geohash encoder matching backend precision
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

export const geohashEncode = (lat: number, lng: number, precision = 6): string => {
  let isEven = true, bit = 0, ch = 0, geohash = '';
  let minLat = -90, maxLat = 90, minLng = -180, maxLng = 180;

  while (geohash.length < precision) {
    const mid = isEven ? (minLng + maxLng) / 2 : (minLat + maxLat) / 2;
    const val = isEven ? lng : lat;
    if (val >= mid) {
      ch |= 1 << (4 - bit);
      if (isEven) minLng = mid; else minLat = mid;
    } else {
      if (isEven) maxLng = mid; else maxLat = mid;
    }
    isEven = !isEven;
    if (bit < 4) { bit++; } else { geohash += BASE32[ch]; bit = 0; ch = 0; }
  }
  return geohash;
};
