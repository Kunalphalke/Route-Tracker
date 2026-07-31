#pragma once

#include "graph.h"

#include <cstddef>
#include <string>
#include <vector>

//
// Available Path Finding Algorithms
//
enum class Algorithm
{
    Dijkstra,
    AStar,
    BFS,
    DFS,
    BellmanFord
};

//
// Route Statistics
//
struct RouteStatistics
{
    std::size_t nodesVisited     = 0;
    std::size_t edgesExplored    = 0;
    std::size_t queueOperations  = 0;

    double executionMs = 0.0;
};

//
// Route Result
//
struct RouteResult
{
    std::vector<int> path;

    double cost          = 0.0;
    double distanceKm    = 0.0;
    double durationHours = 0.0;
    double fuelCost      = 0.0;
    double toll          = 0.0;

    RouteStatistics stats;
};

//
// Find Best Route
//
RouteResult findRoute(
    const Graph& graph,
    int source,
    int destination,
    RouteMode mode,
    Algorithm algorithm,
    double traffic,
    const std::string& weather,
    double mileage,
    double fuelPrice
);

//
// Time Complexity
//
const char* complexity(Algorithm algorithm);