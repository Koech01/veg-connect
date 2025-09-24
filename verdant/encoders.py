import os
import numpy as np
import pandas as pd
from django.conf import settings


DATASET_PATH = os.path.join(settings.BASE_DIR, 'verdant', 'vectorised-plant-dataset.csv')

if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Plant dataset not found at: {DATASET_PATH}")

dataset = pd.read_csv(DATASET_PATH)


# Defining vocabularies
waterVocab = ['Dry', 'Moist', 'Wet', 'Water']
soilVocab  = ['Light (sandy)', 'Medium', 'Heavy (clay)', 'Acidic']
lightVocab = ['Full sun', 'Partial sun/shade', 'Full shade']


# Multi-hot encoding function
def multiHotEncode(value_str, vocab):
    values = [v.strip() for v in str(value_str).split(',')]
    if 'Water' in values and 'Wet' not in values:
        values.append('Wet')
    vector = [1 if v in values else 0 for v in vocab]
    return np.array(vector)


# Applying encoding to dataset rows
def encodeRow(row):
    row['waterVec'] = multiHotEncode(row['Water requirement'], waterVocab).tolist()
    row['soilVec'] = multiHotEncode(row['Soil type'], soilVocab).tolist()
    row['sunLightVec'] = multiHotEncode(row['Light requirement'], lightVocab).tolist()
    return row

dataset = dataset.apply(encodeRow, axis=1)