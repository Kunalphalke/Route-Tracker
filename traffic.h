#pragma once
#include "graph.h"
#include <string>

double weatherMultiplier(const std::string& weather);
double edgeWeight(const Road& road, RouteMode mode, double traffic, const std::string& weather,
                  double mileage, double fuelPrice);
