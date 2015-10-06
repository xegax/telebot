function round(v: number, s: number = 100) {
    return Math.round(v * s) / s;
}

export function getFormatedBytes(bytes: number) {
    var KB = 1024;
    var MB = KB * 1024;
    var GB = MB * 1024;
    if (bytes > GB)
        return round(bytes / GB) + ' Gb';
    if (bytes > MB)
        return round(bytes / MB) + ' Mb';
    if (bytes > KB)
        return round(bytes / KB) + ' Kb';
    return bytes + ' bytes';
}