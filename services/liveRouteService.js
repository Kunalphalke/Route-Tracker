export async function getLiveRoute(origin, destination) {
    const query = new URLSearchParams({
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng
    });

    const response = await fetch(`/api/route?${query}`);
    if (!response.ok) throw new Error((await response.json()).error || "Live route unavailable.");
    return response.json();
}

export const hasLiveRouteSupport = () => location.hostname !== "127.0.0.1" && location.hostname !== "localhost";
