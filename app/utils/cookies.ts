// Copied from remix server runtime to be used on visible cookies only (allowed to be tampered)
function myUnescape(value: string): string {
    let str = value.toString();
    let result = '';
    let index = 0;
    let chr, part;
    while (index < str.length) {
        chr = str.charAt(index++);
        if (chr === '%') {
            if (str.charAt(index) === 'u') {
                part = str.slice(index + 1, index + 5);
                if (/^[\da-f]{4}$/i.exec(part)) {
                    result += String.fromCharCode(parseInt(part, 16));
                    index += 5;
                    continue;
                }
            } else {
                part = str.slice(index, index + 2);
                if (/^[\da-f]{2}$/i.exec(part)) {
                    result += String.fromCharCode(parseInt(part, 16));
                    index += 2;
                    continue;
                }
            }
        }
        result += chr;
    }
    return result;
}

function encodeData(value: any) {
    return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}

export function setCookieCSR<T = any>(key: string, value: T) {
    document.cookie = `${key}=${encodeData(value)}`;
}
