import random
import numpy as np
from verdant.vectorizers import dataset
from sklearn.metrics.pairwise import cosine_similarity


# Functional companion tag pairings
functionalPairs = [
    ("Nitrogen fixer", "Heavy feeder"),
    ("Pest repellent", "Culinary vegetable"),
    ("Ground cover", "Tall crop"),
    ("Pollinator attractor", "Fruit/seed producer"),
    ("Climber/vine", "Stalky support plant"),
    ("Fast grower", "Slow starter"),
    ("Shade provider", "Shade-tolerant crop"),
    ("Mulch crop", "Nutrient-demanding crop"),
    ("Soil conditioner", "Any crop")
]


def getIndexByName(plantName, nameList):
    try:
        return nameList.index(plantName)
    except ValueError:
        return None


def getPlantByName(name):
    for _, row in dataset.iterrows():
        if row["Common name"] == name:
            return row
    return None


def getMatchingPlantsByClimate(climateList):
    if not climateList:  # Handle empty climate list
        return list(enumerate(dataset))
    matching = []

    for i, row in dataset.iterrows():
        if any(cl in row['Water requirement'] for cl in climateList):
            matching.append((i, row))
    return matching


def buildUserProfileVector(plantNames, climateList):
    vectors = []
    if not plantNames:
        # No plants => zero vector
        return np.zeros((1, len(dataset.iloc[0]['featureVector'])))
    
    for name in plantNames:
        plant = getPlantByName(name)
        if plant is not None: 
            if not climateList or any(cl in plant['Water requirement'] for cl in climateList):
                vectors.append(np.array(plant['featureVector']))
                
    if vectors:
        return np.mean(vectors, axis=0).reshape(1, -1)
    else:
        return np.zeros((1, len(dataset.iloc[0]['featureVector'])))


def getPersonalizedSimilarPlants(userInterests, userHistory, climateList, top_n=2):
    userPlants = list(set((userInterests or []) + (userHistory or [])))
    profileVec = buildUserProfileVector(userPlants, climateList or [])

    allVectors = np.array([row['featureVector'] for _, row in dataset.iterrows()])
    sims = cosine_similarity(profileVec, allVectors)[0]
    sims = [s + random.uniform(-0.02, 0.02) for s in sims]

    excluded = set(userPlants)
    results = sorted(
        [(i, s) for i, s in enumerate(sims) if dataset.iloc[i]["Common name"] not in excluded],
        key=lambda x: x[1],
        reverse=True
    )[:top_n]

    return [dataset.iloc[i]['Common name'] for i, _ in results]


def recommendCompanionPair(userPlants, climateList):
    if not climateList:
        candidates = dataset
    else:
        candidates = [row for _, row in dataset.iterrows() if any(cl in row['Water requirement'] for cl in climateList)]

    available = [p for p in candidates if p['Common name'] not in (userPlants or [])]

    if not available:
        return None

    random.shuffle(available)

    for _ in range(100):
        plantA = random.choice(available)
        tagsA  = plantA['Tag'].split(', ')
        for tagA in tagsA:
            for tag1, tag2 in functionalPairs:
                if tagA == tag1:
                    matchTag = tag2
                elif tagA == tag2:
                    matchTag = tag1
                else:
                    continue

                for plantB in available:
                    if plantB['Common name'] == plantA['Common name']:
                        continue
                    tagsB = plantB['Tag'].split(', ')
                    if matchTag in tagsB:
                        return {
                            "pair": [(plantA['Common name'], tagA), (plantB['Common name'], matchTag)],
                            "reason": f"{tagA} + {matchTag} functional pairing"
                        }
    return None