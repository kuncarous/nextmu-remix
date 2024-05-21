export function base64ToBytes(base64: string) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (v) => v.codePointAt(0)!);
}

export function bytesToBase64(bytes: Uint8Array) {
    const binString = Array.from(bytes, (byte) =>
        String.fromCodePoint(byte),
    ).join('');
    return btoa(binString);
}
