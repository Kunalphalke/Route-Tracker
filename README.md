# RouteFlow — India Route Intelligence

A placement-ready route-planning demonstrator that pairs a modular C++ graph engine with a Leaflet web client. The shipped network contains **108 Indian cities** and representative highway corridors, with deterministic traffic/toll simulation for repeatable demonstrations.

## Highlights

- Autocomplete city search, animated Leaflet route, city/road tooltips, responsive glassmorphism UI, and dark mode.
- Fastest, shortest-distance, lowest-fuel-cost, and lowest-toll objectives.
- Dijkstra, A*, BFS, DFS, and Bellman-Ford selectable in the browser, with route-level metrics and stated complexity.
- Instant traffic and weather recalculation; rain, fog, and storm increase travel-time edge weights.
- Fuel and toll estimates, recent-search persistence, and random road closures with automatic rerouting.
- C++ graph core separated by responsibility: `graph.*`, `algorithms.*`, and `traffic.*`.

## Structure

```
data/cities.json       City coordinates (108 cities)
data/roads.json        Highway corridor definitions
graph.h / graph.cpp    Graph model and network construction
algorithms.h/.cpp      Route result, routing algorithms, statistics
traffic.h/.cpp         Traffic/weather edge weighting
map.js                 Leaflet rendering and route animation
ui.js                  Autocomplete and formatting
traffic.js             UI traffic/weather labels
algorithms.js          Browser routing engine and metrics
app.js                 Application orchestration
```

## Run the web app

Serve the directory because browsers block `fetch()` from `file://` pages:

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Run the C++ demo

```bash
g++ -std=c++17 -Wall -Wextra route_tracker.cpp graph.cpp algorithms.cpp traffic.cpp -o route_tracker
./route_tracker
```

The console demo asks for city indices and traffic intensity. The web client is intentionally self-contained: it uses the same adjacency-list model and weight formula to keep its UI immediately interactive without a server API.

## Weight model

Fastest routing uses `distance / speed × traffic multiplier × weather multiplier`. Fuel and toll modes use their respective edge economics; all modes exclude closed roads. This makes closures, traffic, and weather change the route rather than merely the displayed ETA.
