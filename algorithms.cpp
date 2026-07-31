#include "algorithms.h"
#include "traffic.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <deque>
#include <functional>
#include <limits>
#include <queue>

const char* complexity(Algorithm algorithm)
{
    switch (algorithm)
    {
        case Algorithm::Dijkstra:
        case Algorithm::AStar:
            return "O((V + E) log V)";

        case Algorithm::BellmanFord:
            return "O(VE)";

        default:
            return "O(V + E)";
    }
}

RouteResult findRoute(
    const Graph& graph,
    int source,
    int destination,
    RouteMode mode,
    Algorithm algorithm,
    double traffic,
    const std::string& weather,
    double mileage,
    double fuelPrice)
{
    auto startTime = std::chrono::high_resolution_clock::now();

    const double INF = std::numeric_limits<double>::infinity();

    std::vector<double> distance(graph.cities.size(), INF);
    std::vector<int> parent(graph.cities.size(), -1);

    distance[source] = 0;

    auto heuristic = [&](int city)
    {
        if (algorithm != Algorithm::AStar)
            return 0.0;

        return std::hypot(
                   graph.cities[city].latitude -
                       graph.cities[destination].latitude,
                   graph.cities[city].longitude -
                       graph.cities[destination].longitude) *
               111 / 90;
    };

    using Node = std::pair<double, int>;

    std::priority_queue<
        Node,
        std::vector<Node>,
        std::greater<Node>> pq;

    pq.push({0, source});

    RouteStatistics stats;

    //-------------------------------------------------
    // Bellman-Ford
    //-------------------------------------------------

    if (algorithm == Algorithm::BellmanFord)
    {
        for (size_t pass = 1; pass < graph.cities.size(); pass++)
        {
            bool updated = false;

            for (size_t u = 0; u < graph.cities.size(); u++)
            {
                for (const auto& road : graph.adjacency[u])
                {
                    stats.edgesExplored++;

                    if (road.closed)
                        continue;

                    double weight = edgeWeight(
                        road,
                        mode,
                        traffic,
                        weather,
                        mileage,
                        fuelPrice);

                    if (distance[u] != INF &&
                        distance[u] + weight < distance[road.to])
                    {
                        distance[road.to] = distance[u] + weight;
                        parent[road.to] = static_cast<int>(u);
                        updated = true;
                    }
                }
            }

            if (!updated)
                break;
        }
    }

    //-------------------------------------------------
    // BFS / DFS
    //-------------------------------------------------

    else if (algorithm == Algorithm::BFS ||
             algorithm == Algorithm::DFS)
    {
        std::deque<int> workList;
        std::vector<bool> visited(graph.cities.size(), false);

        workList.push_back(source);
        visited[source] = true;

        while (!workList.empty())
        {
            int current;

            if (algorithm == Algorithm::DFS)
            {
                current = workList.back();
                workList.pop_back();
            }
            else
            {
                current = workList.front();
                workList.pop_front();
            }

            stats.queueOperations++;
            stats.nodesVisited++;

            if (current == destination)
                break;

            for (const auto& road : graph.adjacency[current])
            {
                stats.edgesExplored++;

                if (road.closed || visited[road.to])
                    continue;

                visited[road.to] = true;
                parent[road.to] = current;

                distance[road.to] =
                    distance[current] +
                    edgeWeight(
                        road,
                        mode,
                        traffic,
                        weather,
                        mileage,
                        fuelPrice);

                workList.push_back(road.to);
                stats.queueOperations++;
            }
        }
    }

    //-------------------------------------------------
    // Dijkstra / A*
    //-------------------------------------------------

    else
    {
        std::vector<bool> visited(graph.cities.size(), false);

        while (!pq.empty())
        {
            auto [currentCost, current] = pq.top();
            pq.pop();

            stats.queueOperations++;

            if (visited[current])
                continue;

            visited[current] = true;
            stats.nodesVisited++;

            if (current == destination)
                break;

            for (const auto& road : graph.adjacency[current])
            {
                stats.edgesExplored++;

                if (road.closed)
                    continue;

                double newCost =
                    distance[current] +
                    edgeWeight(
                        road,
                        mode,
                        traffic,
                        weather,
                        mileage,
                        fuelPrice);

                if (newCost < distance[road.to])
                {
                    distance[road.to] = newCost;
                    parent[road.to] = current;

                    pq.push({
                        newCost + heuristic(road.to),
                        road.to
                    });

                    stats.queueOperations++;
                }
            }
        }
    }

    //-------------------------------------------------
    // Build Path
    //-------------------------------------------------

    RouteResult result;
    result.cost = distance[destination];

    if (distance[destination] != INF)
    {
        for (int node = destination; node != -1; node = parent[node])
            result.path.push_back(node);

        std::reverse(result.path.begin(), result.path.end());
    }

    //-------------------------------------------------
    // Calculate Distance / Time / Toll
    //-------------------------------------------------

    for (size_t i = 1; i < result.path.size(); i++)
    {
        int from = result.path[i - 1];
        int to = result.path[i];

        for (const auto& road : graph.adjacency[from])
        {
            if (road.to != to)
                continue;

            result.distanceKm += road.distanceKm;

            result.durationHours += edgeWeight(
                road,
                RouteMode::Fastest,
                traffic,
                weather,
                mileage,
                fuelPrice);

            result.toll += road.toll;
        }
    }

    result.fuelCost =
        (result.distanceKm / mileage) * fuelPrice;

    result.stats = stats;

    result.stats.executionMs =
        std::chrono::duration<double, std::milli>(
            std::chrono::high_resolution_clock::now() - startTime)
            .count();

    return result;
}