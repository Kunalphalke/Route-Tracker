# RouteFlow — Route Intelligence for India

A modular route-planning application with a DSA graph demonstrator, a Leaflet frontend, live-weather support, and an optional secure live-traffic integration.

## Live-data architecture

- `api/route.js`: Vercel Function that calls Google Maps Routes API with `TRAFFIC_AWARE_OPTIMAL`. The Google key stays on Vercel and is never sent to the browser.
- `api/weather.js`: Vercel Function that fetches current weather model observations from Open-Meteo.
- `services/liveRouteService.js` and `services/weatherService.js`: Browser-facing service clients.
- The graph engine is always available as a fallback for Dijkstra, A*, BFS, DFS, and Bellman-Ford demonstrations.

## Configure genuine live traffic

1. In Google Cloud, enable **Routes API** and billing.
2. Create a restricted server API key.
3. In Vercel → Project → Settings → Environment Variables, add:

   ```text
   GOOGLE_MAPS_API_KEY = your key
   ```

   Select Production, Preview, and Development. Never put this value in source code or `.env` files committed to Git.
4. Deploy again. In **Fastest** mode, the app calls `/api/route`, shows Google road distance / traffic ETA / polyline, and labels the result “Live traffic route”.

Without the environment variable or on a simple local Python server, the application deliberately shows the DSA graph fallback instead.

## Folder structure

```text
api/                    Secure Vercel serverless endpoints
services/               Live route and weather clients
data/                   City and graph corridor data
algorithms.js           Browser graph algorithm implementation
map.js                  Leaflet layers, tooltips, animations and polylines
ui.js                   Autocomplete and formatting helpers
app.js                  Application orchestration
*.cpp / *.h             Modular C++ graph engine
```

## Local run

```powershell
py -3 -m http.server 8080
```

Open `http://localhost:8080`. Live Vercel functions require deployment; the graph fallback works locally.

## Deploy

Import the GitHub repository into Vercel. Vercel automatically deploys `index.html` and exposes each file under `api/` as a serverless endpoint. Configure the environment variable before relying on live traffic.
