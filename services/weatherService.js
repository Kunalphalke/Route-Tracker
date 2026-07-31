export async function getCurrentWeather(city) {
    const query = new URLSearchParams({ latitude: city.lat, longitude: city.lng });
    const response = await fetch(`/api/weather?${query}`);
    if (!response.ok) throw new Error("Live weather unavailable.");
    return response.json();
}

export function weatherFromObservation(weather) {
    if (weather.weather_code >= 95 || weather.wind_gusts_10m >= 65) return "storm";
    if (weather.visibility !== null && weather.visibility < 1000) return "fog";
    if (weather.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weather.weather_code)) return "rain";
    return "clear";
}
