#include "algorithms.h"
#include <iostream>
#include <iomanip>
int main() {
    Graph graph=createIndiaNetwork(); std::cout<<"Route Tracker — "<<graph.cities.size()<<" cities\n";
    for(size_t i=0;i<graph.cities.size();++i) std::cout<<i+1<<". "<<graph.cities[i].name<<'\n';
    int source,destination; double traffic; std::cout<<"Start number, destination number, traffic (0–100): "; std::cin>>source>>destination>>traffic;
    if(source<1||destination<1||source>(int)graph.cities.size()||destination>(int)graph.cities.size()) return std::cerr<<"Invalid city.\n",1;
    auto result=findRoute(graph,source-1,destination-1,RouteMode::Fastest,Algorithm::Dijkstra,traffic,"clear",15,105);
    if(result.path.empty()) return std::cerr<<"No route available.\n",1;
    std::cout<<"\nFastest route: "; for(int id:result.path) std::cout<<graph.cities[id].name<<(id==result.path.back()?"\n":" → ");
    std::cout<<std::fixed<<std::setprecision(1)<<"Distance: "<<result.distanceKm<<" km\nETA: "<<result.durationHours<<" h\nNodes visited: "<<result.stats.nodesVisited<<"\n";
}
