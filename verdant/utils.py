import numpy as np 
from verdant.encoders import dataset


def extractpHMidPoint(pHRangeStr):
  try:
      parts = pHRangeStr.split('-')
      low = float(parts[0].strip())
      high = float(parts[1].strip())
      midpoint = (low + high) / 2
      return midpoint
  except Exception:
      return np.nan


def addpHmidpoint(row):
    row['soilpHmidpoint'] = extractpHMidPoint(row['Soil pH'])
    return row

dataset = dataset.apply(addpHmidpoint, axis=1)


phValues = [row['soilpHmidpoint'] for _, row in dataset.iterrows() if not np.isnan(row['soilpHmidpoint'])]
phMin, phMax = min(phValues), max(phValues)


def normalizepH(row):
    ph = row['soilpHmidpoint']
    if np.isnan(ph):
        # Replace NaN with mean or median, or 0.5 as default
        phNorm = 0.5
    else:
        phNorm = (ph - phMin) / (phMax - phMin)
    row['soilphNorm'] = phNorm
    return row

dataset = dataset.apply(normalizepH, axis=1)