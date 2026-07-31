/**
 * Vercel Function: keeps the Google key on the server and returns only route data.
 * Set GOOGLE_MAPS_API_KEY in Vercel Environment Variables before enabling live traffic.
 */
module.exports = async (request, response) => {
    const { originLat, originLng, destinationLat, destinationLng } = request.query;

    if (!process.env.GOOGLE_MAPS_API_KEY) {
        return response.status(503).json({
            error: "Live traffic is not configured. Add GOOGLE_MAPS_API_KEY in Vercel."
        });
    }

    const coordinates = [originLat, originLng, destinationLat, destinationLng];
    if (coordinates.some(value => !Number.isFinite(Number(value)))) {
        return response.status(400).json({ error: "Valid origin and destination coordinates are required." });
    }

    try {
        const googleResponse = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY,
                "X-Goog-FieldMask": [
                    "routes.distanceMeters",
                    "routes.duration",
                    "routes.staticDuration",
                    "routes.polyline.encodedPolyline",
                    "routes.travelAdvisory.tollInfo"
                ].join(",")
            },
            body: JSON.stringify({
                origin: { location: { latLng: { latitude: Number(originLat), longitude: Number(originLng) } } },
                destination: { location: { latLng: { latitude: Number(destinationLat), longitude: Number(destinationLng) } } },
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE_OPTIMAL",
                computeAlternativeRoutes: true,
                extraComputations: ["TOLLS"]
            })
        });

        const payload = await googleResponse.json();
        if (!googleResponse.ok) {
            return response.status(googleResponse.status).json({ error: payload.error?.message || "Google Routes request failed." });
        }

        const route = payload.routes?.[0];
        if (!route) return response.status(404).json({ error: "No driving route found." });

        return response.status(200).json({
            distanceKm: route.distanceMeters / 1000,
            durationSeconds: Number(String(route.duration).replace("s", "")),
            staticDurationSeconds: Number(String(route.staticDuration || route.duration).replace("s", "")),
            encodedPolyline: route.polyline?.encodedPolyline || "",
            toll: route.travelAdvisory?.tollInfo?.estimatedPrice?.[0] || null,
            provider: "Google Maps Routes API"
        });
    } catch (error) {
        return response.status(502).json({ error: "Live routing provider is unavailable." });
    }
};
