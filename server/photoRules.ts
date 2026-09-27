const signatures: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

export function hasExpectedImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/webp") {
    return bytes.length >= 12 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  const expected = signatures[mimeType];
  return Boolean(expected && bytes.length >= expected.length && expected.every((byte, index) => bytes[index] === byte));
}

export function hasPhotoConsent(photoDataUrl: string | null | undefined, acknowledged: boolean): boolean {
  return !photoDataUrl || acknowledged;
}
