/** Vercel Function: current weather model data for the selected origin. */
module.exports = async (request, response) => {
    const { latitude, longitude } = request.query;
    if (![latitude, longitude].every(value => Number.isFinite(Number(value)))) {
        return response.status(400).json({ error: "Valid latitude and longitude are required." });
    }

    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({
        latitude,
        longitude,
        current: "temperature_2m,precipitation,weather_code,visibility,wind_gusts_10m",
        timezone: "auto"
    });

    try {
        const upstream = await fetch(url);
        const payload = await upstream.json();
        if (!upstream.ok) return response.status(upstream.status).json({ error: payload.reason || "Weather request failed." });
        return response.status(200).json(payload.current);
    } catch (error) {
        return response.status(502).json({ error: "Weather provider is unavailable." });
    }
};
