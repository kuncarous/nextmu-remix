const SizeSuffix = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
export function formatSize(size: number) {
    let index = 0;
    while (size >= 1024 && index < SizeSuffix.length) {
        size /= 1024;
        ++index;
    }
    const formattedSize = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(size);
    return `${formattedSize}${SizeSuffix[index]}`;
}
