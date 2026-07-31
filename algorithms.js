export const complexity = {
    dijkstra: "O((V + E) log V)",
    astar: "O((V + E) log V)",
    bfs: "O(V + E)",
    dfs: "O(V + E)",
    bellman: "O(VE)"
};

export function calculateRoute(graph, start, end, settings)
{
    const startTime = performance.now();

    const cityCount = graph.cities.length;

    const distance = Array(cityCount).fill(Infinity);
    const parent = Array(cityCount).fill(-1);

    const visited = new Set();
    const queue = [[0, start]];

    const stats = {
        nodes: 0,
        edges: 0,
        pq: 0
    };

    distance[start] = 0;

    //--------------------------------------------------
    // Edge Weight
    //--------------------------------------------------

    const weight = (road) =>
    {
        const weatherMultiplier = {
            clear: 1,
            rain: 1.18,
            fog: 1.32,
            storm: 1.55
        }[settings.weather];

        const travelTime =
            (road.km / road.speed) *
            (1 + (settings.traffic / 100) * 0.85 * road.traffic) *
            weatherMultiplier;

        switch (settings.mode)
        {
            case "distance":
                return road.km;

            case "fuel":
                return (
                    (road.km / settings.mileage) *
                    settings.fuelPrice
                );

            case "toll":
                return road.toll;

            default:
                return travelTime;
        }
    };

    //--------------------------------------------------
    // A* Heuristic
    //--------------------------------------------------

    const heuristic = (city) =>
    {
        if (settings.algorithm !== "astar")
            return 0;

        return (
            Math.hypot(
                graph.cities[city].lat - graph.cities[end].lat,
                graph.cities[city].lng - graph.cities[end].lng
            ) * 1.2
        );
    };

    //--------------------------------------------------
    // Bellman-Ford
    //--------------------------------------------------

    if (settings.algorithm === "bellman")
    {
        for (let pass = 1; pass < cityCount; pass++)
        {
            let updated = false;

            for (let from = 0; from < cityCount; from++)
            {
                for (const road of graph.adj[from])
                {
                    stats.edges++;

                    if (road.closed)
                        continue;

                    const newDistance =
                        distance[from] + weight(road);

                    if (newDistance < distance[road.to])
                    {
                        distance[road.to] = newDistance;
                        parent[road.to] = from;
                        updated = true;
                    }
                }
            }

            if (!updated)
                break;
        }
    }

    //--------------------------------------------------
    // Dijkstra / A*
    //--------------------------------------------------

    else
    {
        while (queue.length)
        {
            queue.sort((a, b) => a[0] - b[0]);

            const [, current] = queue.shift();

            stats.pq++;

            if (visited.has(current))
                continue;

            visited.add(current);
            stats.nodes++;

            if (
                current === end &&
                settings.algorithm !== "dfs"
            )
            {
                break;
            }

            for (const road of graph.adj[current])
            {
                stats.edges++;

                if (road.closed)
                    continue;

                const newDistance =
                    distance[current] + weight(road);

                if (newDistance < distance[road.to])
                {
                    distance[road.to] = newDistance;
                    parent[road.to] = current;

                    queue.push([
                        newDistance + heuristic(road.to),
                        road.to
                    ]);

                    stats.pq++;
                }
            }
        }
    }

    //--------------------------------------------------
    // Build Path
    //--------------------------------------------------

    const path = [];

    for (
        let node = end;
        node !== -1 && distance[end] < Infinity;
        node = parent[node]
    )
    {
        path.unshift(node);
    }

    //--------------------------------------------------
    // Calculate Route Metrics
    //--------------------------------------------------

    let totalDistance = 0;
    let totalTime = 0;
    let totalToll = 0;

    const weatherMultiplier = {
        clear: 1,
        rain: 1.18,
        fog: 1.32,
        storm: 1.55
    }[settings.weather];

    for (let i = 1; i < path.length; i++)
    {
        const road = graph.adj[path[i - 1]].find(
            edge => edge.to === path[i]
        );

        totalDistance += road.km;
        totalToll += road.toll;

        totalTime +=
            (road.km / road.speed) *
            (1 + (settings.traffic / 100) * 0.85 * road.traffic) *
            weatherMultiplier;
    }

    //--------------------------------------------------
    // Return Result
    //--------------------------------------------------

    return {
        path,

        km: totalDistance,

        time: totalTime,

        toll: totalToll,

        fuel:
            (totalDistance / settings.mileage) *
            settings.fuelPrice,

        cost: distance[end],

        stats: {
            ...stats,
            ms: performance.now() - startTime
        }
    };
}