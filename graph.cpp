#include "graph.h"
#include <cmath>

Graph createIndiaNetwork() {
    // 110 major Indian cities. A backbone plus regional links keeps the sample connected and scalable.
    const std::vector<City> cities = {
        {"Srinagar",34.08,74.80},{"Jammu",32.73,74.87},{"Amritsar",31.63,74.87},{"Chandigarh",30.73,76.78},{"Shimla",31.10,77.17},{"Dehradun",30.32,78.03},{"Delhi",28.61,77.21},{"Gurugram",28.46,77.03},{"Noida",28.54,77.39},{"Meerut",28.98,77.71},{"Agra",27.18,78.01},{"Jaipur",26.91,75.79},{"Jodhpur",26.24,73.02},{"Udaipur",24.59,73.71},{"Kota",25.18,75.83},{"Ajmer",26.45,74.64},{"Bikaner",28.02,73.31},{"Hisar",29.15,75.72},{"Lucknow",26.85,80.95},{"Kanpur",26.45,80.33},{"Prayagraj",25.44,81.84},{"Varanasi",25.32,82.97},{"Gorakhpur",26.76,83.37},{"Bareilly",28.37,79.43},{"Patna",25.59,85.14},{"Gaya",24.80,85.00},{"Muzaffarpur",26.12,85.39},{"Ranchi",23.34,85.31},{"Jamshedpur",22.80,86.20},{"Dhanbad",23.80,86.43},{"Kolkata",22.57,88.36},{"Siliguri",26.73,88.40},{"Darjeeling",27.04,88.27},{"Guwahati",26.14,91.74},{"Shillong",25.58,91.89},{"Agartala",23.83,91.28},{"Imphal",24.82,93.95},{"Aizawl",23.73,92.72},{"Kohima",25.67,94.11},{"Itanagar",27.08,93.61},{"Bhubaneswar",20.30,85.82},{"Cuttack",20.46,85.88},{"Puri",19.81,85.83},{"Sambalpur",21.47,83.98},{"Raipur",21.25,81.63},{"Bilaspur",22.08,82.15},{"Durg",21.19,81.28},{"Nagpur",21.15,79.09},{"Jabalpur",23.18,79.99},{"Bhopal",23.26,77.41},{"Indore",22.72,75.86},{"Gwalior",26.22,78.18},{"Ahmedabad",23.02,72.57},{"Gandhinagar",23.22,72.65},{"Vadodara",22.31,73.18},{"Surat",21.17,72.83},{"Rajkot",22.30,70.80},{"Bhavnagar",21.76,72.15},{"Jamnagar",22.47,70.07},{"Mumbai",19.08,72.88},{"Thane",19.22,72.98},{"Nashik",19.99,73.79},{"Pune",18.52,73.86},{"Kolhapur",16.70,74.24},{"Aurangabad",19.88,75.34},{"Solapur",17.66,75.91},{"Goa",15.49,73.83},{"Belagavi",15.85,74.50},{"Hubballi",15.36,75.12},{"Mangaluru",12.91,74.86},{"Bengaluru",12.97,77.59},{"Mysuru",12.30,76.64},{"Shivamogga",13.93,75.57},{"Ballari",15.14,76.92},{"Hyderabad",17.39,78.49},{"Warangal",17.97,79.60},{"Nizamabad",18.67,78.10},{"Vijayawada",16.51,80.65},{"Visakhapatnam",17.69,83.22},{"Tirupati",13.63,79.42},{"Chennai",13.08,80.27},{"Coimbatore",11.02,76.96},{"Madurai",9.93,78.12},{"Tiruchirappalli",10.79,78.70},{"Salem",11.66,78.15},{"Vellore",12.92,79.13},{"Puducherry",11.94,79.81},{"Kochi",9.93,76.27},{"Thiruvananthapuram",8.52,76.94},{"Kozhikode",11.26,75.78},{"Thrissur",10.53,76.21},{"Kannur",11.87,75.37},{"Kavaratti",10.57,72.64},{"Panaji",15.49,73.83},{"Nanded",19.15,77.30},{"Akola",20.70,77.00},{"Latur",18.41,76.57},{"Amravati",20.94,77.75},{"Sangli",16.85,74.58},{"Satara",17.68,73.99},{"Kurnool",15.83,78.04},{"Nellore",14.44,79.99},{"Rajahmundry",16.99,81.78},{"Srikakulam",18.29,83.90},{"Rourkela",22.26,84.85},{"Haldia",22.03,88.06},{"Asansol",23.67,86.98},{"Durgapur",23.52,87.31},{"Gangtok",27.34,88.61}
    };
    Graph graph{cities, std::vector<std::vector<Road>>(cities.size())};
    auto add = [&](int a, int b) {
        const auto& x=cities[a]; const auto& y=cities[b];
        double km=std::hypot((x.latitude-y.latitude)*111.0,(x.longitude-y.longitude)*102.0)*1.18;
        Road r{b, km, 70.0, .25 + (a*17+b*7)%60/100.0, std::round(km*.55)};
        Road back=r; back.to=a; graph.adjacency[a].push_back(r); graph.adjacency[b].push_back(back);
    };
    for (int i=0;i+1<(int)cities.size();++i) add(i,i+1); // national backbone
    const int links[][2]={{0,3},{3,6},{6,11},{6,18},{11,50},{18,24},{24,30},{30,40},{40,44},{44,47},{47,50},{50,53},{53,60},{60,63},{63,68},{68,73},{73,78},{78,82},{82,86},{86,90},{90,94},{94,99},{99,104},{104,109},{10,18},{13,50},{14,47},{30,33},{33,36},{40,47},{47,73},{53,56},{56,60},{60,65},{65,70},{70,75},{75,80},{80,85},{85,90},{61,75},{66,70},{70,82},{75,77},{77,80},{82,87},{87,90},{92,98}};
    for (auto& pair:links) add(pair[0],pair[1]);
    return graph;
}
void setRoadClosure(Graph& graph,int from,int to,bool closed){ for(auto& r:graph.adjacency[from]) if(r.to==to) r.closed=closed; for(auto& r:graph.adjacency[to]) if(r.to==from) r.closed=closed; }
