import { calculateRoute, complexity } from "./algorithms.js";
import { drawGraph, drawLiveRoute, setupMap } from "./map.js";
import { getLiveRoute, hasLiveRouteSupport } from "./services/liveRouteService.js";
import { getCurrentWeather, weatherFromObservation } from "./services/weatherService.js";
import { trafficLabel, weatherNotice } from "./traffic.js";
import { formatHours, setupAutocomplete } from "./ui.js";

const $ = selector => document.querySelector(selector);
let graph;

async function loadGraph() {
    const loadJson = async file => {
        const response = await fetch(new URL(file, import.meta.url));
        if (!response.ok) throw new Error(`${file} returned HTTP ${response.status}`);
        return response.json();
    };

    const [cities, roads] = await Promise.all([loadJson("data/cities.json"), loadJson("data/roads.json")]);
    const cityIds = new Map(cities.map((city, index) => [city.name, index]));
    const adjacency = cities.map(() => []);

    roads.corridors.forEach(corridor => {
        for (let index = 1; index < corridor.length; index++) {
            const from = cityIds.get(corridor[index - 1]);
            const to = cityIds.get(corridor[index]);
            if (from === undefined || to === undefined) continue;

            const key = [cities[from].name, cities[to].name].sort().join("|");
            const override = roads.roadOverrides?.[key];
            const estimatedKm = Math.hypot(
                (cities[from].lat - cities[to].lat) * 111,
                (cities[from].lng - cities[to].lng) * 102
            ) * 1.18;

            const road = {
                to,
                km: override?.km ?? estimatedKm,
                speed: override?.speed ?? 70,
                traffic: override?.traffic ?? (0.25 + ((from * 17 + to * 7) % 60) / 100),
                toll: override?.toll ?? Math.round(estimatedKm * 0.55),
                closed: false
            };
            adjacency[from].push(road);
            adjacency[to].push({ ...road, to: from });
        }
    });

    return { cities, adj: adjacency };
}

function readSettings(weatherOverride) {
    return {
        traffic: Number($("#traffic").value),
        weather: weatherOverride ?? $("#weather").value,
        mode: $("#mode").value,
        algorithm: $("#algorithm").value,
        mileage: Number($("#mileage").value) || 15,
        fuelPrice: Number($("#fuel-price").value) || 105
    };
}

function cityIndex(name) {
    return graph.cities.findIndex(city => city.name.toLowerCase() === name.trim().toLowerCase());
}

async function resolveWeather(city) {
    if ($("#weather").value !== "live" || !hasLiveRouteSupport()) return { condition: $("#weather").value, label: weatherNotice($("#weather").value) };
    try {
        const observation = await getCurrentWeather(city);
        const condition = weatherFromObservation(observation);
        return { condition, label: `Live weather: ${weatherNotice(condition)} · ${Math.round(observation.temperature_2m)}°C` };
    } catch {
        return { condition: "clear", label: "Live weather unavailable — using clear-road simulation." };
    }
}

function renderSimulation(result, source, destination, weather) {
    drawGraph(graph, result.path);
    $("#eta").textContent = formatHours(result.time);
    $("#distance").textContent = `${Math.round(result.km).toLocaleString("en-IN")} km`;
    $("#fuel").textContent = `₹${Math.round(result.fuel).toLocaleString("en-IN")}`;
    $("#toll").textContent = `₹${Math.round(result.toll).toLocaleString("en-IN")}`;
    $("#path").textContent = result.path.map(index => graph.cities[index].name).join(" → ");
    $("#statistics").innerHTML = [
        [result.stats.nodes, "Nodes Visited"], [result.stats.edges, "Edges Explored"],
        [result.stats.pq, "Queue Operations"], [`${result.stats.ms.toFixed(2)} ms`, "Execution Time"],
        [result.cost.toFixed(1), "Path Cost"], [complexity[readSettings(weather.condition).algorithm], "Complexity"]
    ].map(([value, label]) => `<div><b>${value}</b><span>${label}</span></div>`).join("");
    $("#status").textContent = `${weather.label} · Graph simulation route`;
    saveHistory(source.name, destination.name);
}

async function render() {
    const sourceIndex = cityIndex($("#source").value);
    const destinationIndex = cityIndex($("#destination").value);
    if (sourceIndex < 0 || destinationIndex < 0 || sourceIndex === destinationIndex) return;

    const source = graph.cities[sourceIndex];
    const destination = graph.cities[destinationIndex];
    const weather = await resolveWeather(source);
    const result = calculateRoute(graph, sourceIndex, destinationIndex, readSettings(weather.condition));
    if (!result.path.length) { $("#status").textContent = "No graph route available — reopen a road or choose another city."; return; }

    renderSimulation(result, source, destination, weather);

    // Live traffic is authoritative for the Fastest mode, but DSA remains visible for algorithm learning modes.
    if ($("#mode").value !== "fastest" || !hasLiveRouteSupport()) return;
    try {
        $("#status").textContent = "Fetching live traffic route…";
        const liveRoute = await getLiveRoute(source, destination);
        drawLiveRoute(liveRoute.encodedPolyline);
        $("#eta").textContent = formatHours(liveRoute.durationSeconds / 3600);
        $("#distance").textContent = `${liveRoute.distanceKm.toFixed(1)} km`;
        if (liveRoute.toll?.units) $("#toll").textContent = `${liveRoute.toll.currencyCode || "₹"} ${liveRoute.toll.units}`;
        $("#status").textContent = `Live traffic route · ${liveRoute.provider}`;
    } catch (error) {
        $("#status").textContent = `${weather.label} · Graph fallback (${error.message})`;
    }
}

function saveHistory(source, destination) {
    const current = { source, destination };
    const history = [current, ...JSON.parse(localStorage.getItem("route-history") || "[]")
        .filter(item => item.source !== source || item.destination !== destination)].slice(0, 5);
    localStorage.setItem("route-history", JSON.stringify(history));
    $("#history").innerHTML = history.map(item => `<button>${item.source} → ${item.destination}</button>`).join("");
    [...$("#history").children].forEach((button, index) => button.onclick = () => {
        $("#source").value = history[index].source;
        $("#destination").value = history[index].destination;
        render();
    });
}

function simulateClosure() {
    const roads = graph.adj.flatMap((list, from) => list.filter(road => from < road.to).map(road => [from, road]));
    const [from, road] = roads[Math.floor(Math.random() * roads.length)];
    road.closed = true;
    graph.adj[road.to].find(edge => edge.to === from).closed = true;
    $("#status").textContent = `Closure: ${graph.cities[from].name} – ${graph.cities[road.to].name}. Rerouting…`;
    render();
}

async function init() {
    setupMap();
    graph = await loadGraph();
    $("#roads").textContent = `${graph.adj.reduce((total, list) => total + list.length, 0) / 2} roads · ${graph.cities.length} cities`;
    ["source", "destination"].forEach(id => setupAutocomplete($("#" + id), graph.cities, render));
    $("#source").value = "Delhi";
    $("#destination").value = "Mumbai";
    ["weather", "mode", "algorithm", "mileage", "fuel-price"].forEach(id => $("#" + id).addEventListener("change", render));
    $("#traffic").addEventListener("input", () => { $("#traffic-value").textContent = `${$("#traffic").value}%`; $("#traffic-label").textContent = trafficLabel(Number($("#traffic").value)); render(); });
    $("#find-route").onclick = render;
    $("#closure").onclick = simulateClosure;
    $("#swap").onclick = () => { [$("#source").value, $("#destination").value] = [$("#destination").value, $("#source").value]; render(); };
    $("#theme").onclick = () => document.body.classList.toggle("dark");
    render();
}

init().catch(error => { $("#status").textContent = `Startup error: ${error.message}`; });
