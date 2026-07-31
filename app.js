import { calculateRoute, complexity } from "./algorithms.js";
import { setupMap, drawGraph } from "./map.js";
import {
    setupAutocomplete,
    formatHours
} from "./ui.js";

import {
    trafficLabel,
    weatherNotice
} from "./traffic.js";

const $ = (selector) => document.querySelector(selector);

let graph;

//
// Load Graph Data
//
async function load()
{
    const loadJson = async (file) =>
    {
        // Resolving from this module works on localhost, Vercel previews and custom domains.
        const response = await fetch(new URL(file, import.meta.url));

        if (!response.ok)
            throw new Error(`${file} returned HTTP ${response.status}`);

        return response.json();
    };

    const [cities, roadData] = await Promise.all([
        loadJson("data/cities.json"),
        loadJson("data/roads.json")
    ]);

    const cityIds = new Map(
        cities.map((city, index) => [city.name, index])
    );

    const adjacency = cities.map(() => []);

    for (const corridor of roadData.corridors)
    {
        for (let i = 1; i < corridor.length; i++)
        {
            const from = cityIds.get(corridor[i - 1]);
            const to = cityIds.get(corridor[i]);

            if (from === undefined || to === undefined)
                continue;

            const distance =
                Math.hypot(
                    (cities[from].lat - cities[to].lat) * 111,
                    (cities[from].lng - cities[to].lng) * 102
                ) * 1.18;

            const road = {
                to,
                km: distance,
                speed: 70,
                traffic:
                    0.25 +
                    ((from * 17 + to * 7) % 60) / 100,
                toll: Math.round(distance * 0.55),
                closed: false
            };

            adjacency[from].push(road);
            adjacency[to].push({
                ...road,
                to: from
            });
        }
    }

    return {
        cities,
        adj: adjacency
    };
}

//
// Current Settings
//
function settings()
{
    return {
        traffic: +$("#traffic").value,
        weather: $("#weather").value,
        mode: $("#mode").value,
        algorithm: $("#algorithm").value,

        mileage:
            +$("#mileage").value || 15,

        fuelPrice:
            +$("#fuel-price").value || 105
    };
}

//
// Find City Index
//
function id(cityName)
{
    return graph.cities.findIndex(
        city =>
            city.name.toLowerCase() ===
            cityName.trim().toLowerCase()
    );
}

//
// Render Route
//
function render()
{
    const source = id($("#source").value);
    const destination = id($("#destination").value);

    if (
        source < 0 ||
        destination < 0 ||
        source === destination
    )
        return;

    const result = calculateRoute(
        graph,
        source,
        destination,
        settings()
    );

    if (!result.path.length)
    {
        $("#status").textContent =
            "No route available — reopen a road or choose another city.";

        return;
    }

    drawGraph(graph, result.path);

    $("#status").textContent =
        weatherNotice(settings().weather);

    $("#eta").textContent =
        formatHours(result.time);

    $("#distance").textContent =
        `${Math.round(result.km).toLocaleString("en-IN")} km`;

    $("#fuel").textContent =
        `₹${Math.round(result.fuel).toLocaleString("en-IN")}`;

    $("#toll").textContent =
        `₹${Math.round(result.toll).toLocaleString("en-IN")}`;

    $("#path").textContent =
        result.path
            .map(i => graph.cities[i].name)
            .join(" → ");

    const stats = result.stats;

    $("#statistics").innerHTML = `
        <div><b>${stats.nodes}</b><span>Nodes Visited</span></div>
        <div><b>${stats.edges}</b><span>Edges Explored</span></div>
        <div><b>${stats.pq}</b><span>Queue Operations</span></div>
        <div><b>${stats.ms.toFixed(2)} ms</b><span>Execution Time</span></div>
        <div><b>${result.cost.toFixed(1)}</b><span>Path Cost</span></div>
        <div><b>${complexity[settings().algorithm]}</b><span>Complexity</span></div>
    `;

    saveHistory();
}

//
// Save Search History
//
function saveHistory()
{
    const route = {
        a: $("#source").value,
        b: $("#destination").value
    };

    let history =
        JSON.parse(
            localStorage.getItem("route-history") || "[]"
        );

    history = history.filter(
        x => x.a !== route.a || x.b !== route.b
    );

    history.unshift(route);

    history = history.slice(0, 5);

    localStorage.setItem(
        "route-history",
        JSON.stringify(history)
    );

    $("#history").innerHTML =
        history
            .map(
                x =>
                    `<button>${x.a} → ${x.b}</button>`
            )
            .join("");

    [...$("#history").children].forEach(
        (button, index) =>
        {
            button.onclick = () =>
            {
                $("#source").value = history[index].a;
                $("#destination").value = history[index].b;
                render();
            };
        }
    );
}

//
// Simulate Road Closure
//
function closure()
{
    const roads = graph.adj.flatMap(
        (list, from) =>
            list
                .filter(r => from < r.to)
                .map(r => [from, r])
    );

    const [from, road] =
        roads[
            Math.floor(Math.random() * roads.length)
        ];

    road.closed = true;

    graph.adj[road.to]
        .find(x => x.to === from)
        .closed = true;

    $("#status").textContent =
        `Closure simulated: ${graph.cities[from].name} – ${graph.cities[road.to].name}`;

    render();
}

//
// Initialize App
//
async function init()
{
    setupMap();

    graph = await load();

    $("#roads").textContent =
        `${graph.adj.reduce((a, b) => a + b.length, 0) / 2}
         roads · ${graph.cities.length} cities`;

    ["source", "destination"].forEach(id =>
        setupAutocomplete(
            $("#" + id),
            graph.cities,
            render
        )
    );

    $("#source").value = "Delhi";
    $("#destination").value = "Mumbai";

    [
        "weather",
        "mode",
        "algorithm",
        "mileage",
        "fuel-price"
    ].forEach(id =>
    {
        $("#" + id).oninput = render;
    });

    $("#traffic").oninput = () =>
    {
        $("#traffic-value").textContent =
            `${$("#traffic").value}%`;

        $("#traffic-label").textContent =
            trafficLabel(+$("#traffic").value);

        render();
    };

    $("#find-route").onclick = render;

    $("#swap").onclick = () =>
    {
        [
            $("#source").value,
            $("#destination").value
        ] = [
            $("#destination").value,
            $("#source").value
        ];

        render();
    };

    $("#closure").onclick = closure;

    $("#theme").onclick = () =>
        document.body.classList.toggle("dark");

    render();
}

init().catch((error) =>
{
    $("#status").textContent =
        `Data could not load: ${error.message}. Ensure data/cities.json and data/roads.json are deployed.`;
});
