// Very rough device class from a User-Agent string. Coarse on purpose —
// we only want aggregate "phone vs computer", not fingerprinting.
export function deviceFromUA(ua = "") {
  if (!ua) return "Unknown";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  return "Desktop";
}
