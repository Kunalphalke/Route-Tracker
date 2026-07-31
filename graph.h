#pragma once

#include <string>
#include <vector>

enum class RouteMode { Fastest, Shortest, Fuel, Toll };

struct City { std::string name; double latitude; double longitude; };
struct Road {
    int to; double distanceKm; double speedKmh; double trafficSensitivity;
    double toll; bool closed = false;
};
struct Graph { std::vector<City> cities; std::vector<std::vector<Road>> adjacency; };

Graph createIndiaNetwork();
void setRoadClosure(Graph& graph, int from, int to, bool closed);
