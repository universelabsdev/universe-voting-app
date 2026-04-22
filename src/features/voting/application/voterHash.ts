// Simple client-side voter fingerprinting using browser metadata.
// In a real production scenario, you would use something like FingerprintJS.

export const generateVoterHash = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "",
    (navigator as unknown as { deviceMemory?: number }).deviceMemory?.toString() || "",
    window.screen.width + "x" + window.screen.height,
    window.screen.colorDepth.toString(),
  ];

  const rawString = components.join("|");
  
  // Hash string using Web Crypto API
  const msgBuffer = new TextEncoder().encode(rawString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex;
};
