import random
import math
import pandas as pd
import folium

from deap import base, creator, tools, algorithms



data = pd.read_csv("data/bins.csv")

nodes = data.values.tolist()



def dist(a, b):

    R = 6371

    lat1 = a[1]
    lon1 = a[2]

    lat2 = b[1]
    lon2 = b[2]

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    x = (
        math.sin(dlat / 2) ** 2
        +
        math.cos(math.radians(lat1))
        *
        math.cos(math.radians(lat2))
        *
        math.sin(dlon / 2) ** 2
    )

    return R * 2 * math.atan2(
        math.sqrt(x),
        math.sqrt(1 - x)
    )

#

def total_distance(route):

    distance = 0

    for i in range(len(route) - 1):

        a = nodes[route[i]]
        b = nodes[route[i + 1]]

        distance += dist(a, b)

    return distance,



creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

toolbox = base.Toolbox()

toolbox.register(
    "indices",
    random.sample,
    range(len(nodes)),
    len(nodes)
)

toolbox.register(
    "individual",
    tools.initIterate,
    creator.Individual,
    toolbox.indices
)

toolbox.register(
    "population",
    tools.initRepeat,
    list,
    toolbox.individual
)

toolbox.register(
    "evaluate",
    total_distance
)

toolbox.register(
    "mate",
    tools.cxOrdered
)

toolbox.register(
    "mutate",
    tools.mutShuffleIndexes,
    indpb=0.2
)

toolbox.register(
    "select",
    tools.selTournament,
    tournsize=3
)



population = toolbox.population(n=100)



algorithms.eaSimple(
    population,
    toolbox,
    cxpb=0.7,
    mutpb=0.2,
    ngen=100,
    verbose=False
)


best_individual = tools.selBest(
    population,
    k=1
)[0]

best_route = [nodes[i] for i in best_individual]



m = folium.Map(
    location=[31.04, 31.37],
    zoom_start=13
)

coords = []

total = 0

for i in range(len(best_route)):

    node = best_route[i]

    name = node[0]
    lat = node[1]
    lng = node[2]
    waste = node[3]

    coords.append([lat, lng])

    folium.Marker(
        [lat, lng],
        popup=f"{name} | Waste: {waste}%",
        icon=folium.Icon(color="green")
    ).add_to(m)

    if i > 0:

        total += dist(
            best_route[i - 1],
            node
        )

folium.PolyLine(
    coords,
    color="blue",
    weight=5
).add_to(m)

m.save("smart_route_map.html")



print("\n🚛 BEST OPTIMIZED ROUTE:\n")

for i, node in enumerate(best_route):

    print(
        f"{i+1}. {node[0]}"
    )

print(
    "\n📏 TOTAL DISTANCE:",
    round(total, 2),
    "km"
)

print(
    "\n🗺 MAP SAVED: smart_route_map.html"
)