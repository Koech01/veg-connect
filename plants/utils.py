import os
import numpy as np
import pandas as pd
from django.conf import settings


DATASET_PATH = os.path.join(settings.BASE_DIR, 'verdant', 'vectorised-plant-dataset.csv')

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Plant dataset not found at: {DATASET_PATH}")

plantDf = pd.read_csv(DATASET_PATH)


def searchPlants(query):
    query = query.strip().lower() 
  
    results = []
    for idx, row in plantDf.iterrows():
        common = str(row['Common name']).strip()
        scientific = str(row['Scientific name']).strip()
        alternates = [alt.strip() for alt in str(row['Alternate name']).split(',') if alt.strip()]

        matchedName = None

        if query in common.lower():
            matchedName = common
        elif query in scientific.lower():
            matchedName = scientific
        else:
            for alt in alternates:
                if query in alt.lower():
                    matchedName = alt
                    break
        
        if matchedName:
            plantData = row.to_dict()
            plantData['displayName'] = matchedName
            results.append(plantData)

    cleanedResults = pd.DataFrame(results).replace([np.nan, np.inf, -np.inf], None)
    return cleanedResults.to_dict(orient='records')