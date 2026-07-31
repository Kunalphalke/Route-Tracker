let map;
let roadLayer;
let routeLayer;
let markerLayer;

export function setupMap() {
    map = L.map("map", { zoomControl: false }).setView([22.7, 78.5], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "© OpenStreetMap contributors"
    }).addTo(map);
    roadLayer = L.layerGroup().addTo(map);
    routeLayer = L.layerGroup().addTo(map);
    markerLayer = L.layerGroup().addTo(map);
}

export function drawGraph(graph, activePath = []) {
    roadLayer.clearLayers();
    routeLayer.clearLayers();
    markerLayer.clearLayers();

    graph.adj.forEach((roads, from) => roads.forEach(road => {
        if (from >= road.to) return;
        const fromCity = graph.cities[from];
        const toCity = graph.cities[road.to];
        L.polyline([[fromCity.lat, fromCity.lng], [toCity.lat, toCity.lng]], {
            color: road.closed ? "#ef5b5b" : "#7f8aa8",
            weight: 1.5,
            opacity: 0.45,
            dashArray: road.closed ? "5 6" : "3 7"
        }).bindTooltip(`${fromCity.name} — ${toCity.name}<br>${Math.round(road.km)} km · ₹${road.toll}${road.closed ? " · CLOSED" : ""}`).addTo(roadLayer);
    }));

    graph.cities.forEach((city, index) => {
        L.circleMarker([city.lat, city.lng], {
            radius: activePath.includes(index) ? 6 : 3,
            color: activePath.includes(index) ? "#ff8b6b" : "#dce6ff",
            weight: 1,
            fillOpacity: 0.9
        }).bindTooltip(city.name).addTo(markerLayer);
    });

    if (activePath.length > 1) animatePath(activePath.map(index => [graph.cities[index].lat, graph.cities[index].lng]));
}

export function drawLiveRoute(encodedPolyline) {
    if (!encodedPolyline) return;
    routeLayer.clearLayers();
    const route = L.polyline(decodePolyline(encodedPolyline), { color: "#ff8b6b", weight: 5, lineCap: "round" }).addTo(routeLayer);
    map.fitBounds(route.getBounds(), { padding: [60, 60], maxZoom: 9 });
}

function animatePath(points) {
    const shown = [];
    const line = L.polyline(shown, { color: "#ff8b6b", weight: 5, lineCap: "round" }).addTo(routeLayer);
    let index = 0;
    const drawStep = () => {
        shown.push(points[index++]);
        line.setLatLngs(shown);
        if (index < points.length) requestAnimationFrame(drawStep);
        else map.fitBounds(line.getBounds(), { padding: [60, 60], maxZoom: 7 });
    };
    drawStep();
}

function decodePolyline(encoded) {
    const coordinates = [];
    let index = 0, latitude = 0, longitude = 0;
    while (index < encoded.length) {
        let result = 0, shift = 0, byte;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32);
        latitude += result & 1 ? ~(result >> 1) : result >> 1;
        result = 0; shift = 0;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32);
        longitude += result & 1 ? ~(result >> 1) : result >> 1;
        coordinates.push([latitude / 1e5, longitude / 1e5]);
    }
    return coordinates;
}
