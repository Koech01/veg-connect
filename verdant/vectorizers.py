import numpy as np 
from verdant.utils import dataset


def combineFeatures(row):
    waterVec = np.array(row['waterVec'])
    soilVec = np.array(row['soilVec'])
    sunLightVec = np.array(row['sunLightVec'])
    phNorm = np.array([row['soilphNorm']])

    # Concatenate into single vector
    combined = np.concatenate([waterVec, soilVec, sunLightVec, phNorm])

    row['featureVector'] = combined.tolist()
    return row

dataset = dataset.apply(combineFeatures, axis=1)