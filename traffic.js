export function trafficLabel(value) {
    if (value < 30) return "Light flow";
    if (value < 65) return "Normal flow";
    return "Heavy congestion";
}

export function weatherNotice(weather) {
    const notices = {
        clear: "Clear roads",
        rain: "Rain: +18% travel time",
        fog: "Fog: +32% travel time",
        storm: "Storm: +55% travel time"
    };
    return notices[weather] || notices.clear;
}
