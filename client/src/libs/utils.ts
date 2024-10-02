export async function isFileJpg(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 2).arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  const firstHex = uint8Array[0].toString(16);
  const secondHex = uint8Array[1].toString(16);
  // ffd8 is jpg and ffe0 is jfif. It seems they are often considered interchangeable
  return firstHex === 'ff' && (secondHex === 'd8' || secondHex === 'e0');
}
