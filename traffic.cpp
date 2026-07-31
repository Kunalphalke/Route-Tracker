#include "traffic.h"
#include <algorithm>

double weatherMultiplier(const std::string& weather) {
    if (weather == "rain") return 1.18;
    if (weather == "fog") return 1.32;
    if (weather == "storm") return 1.55;
    return 1.0;
}

double edgeWeight(const Road& road, RouteMode mode, double traffic, const std::string& weather,
                  double mileage, double fuelPrice) {
    const double travelTime = road.distanceKm / road.speedKmh *
        (1 + std::max(0.0, std::min(traffic, 100.0)) / 100.0 * .85 * road.trafficSensitivity) * weatherMultiplier(weather);
    switch (mode) {
        case RouteMode::Shortest: return road.distanceKm;
        case RouteMode::Fuel: return road.distanceKm / mileage * fuelPrice;
        case RouteMode::Toll: return road.toll;
        default: return travelTime;
    }
}

