import random
from verdant.companionTemplate import TEMPLATES


def generateCompanionDescription(tag1, tag2, plant1, plant2):
    key = (tag1, tag2)
    if key not in TEMPLATES:
        key = (tag2, tag1)
    templates = TEMPLATES.get(key)
    if templates:
        template = random.choice(templates)  
        return template.format(plant1=plant1, plant2=plant2)
    else:
        return f"No companion advice found for tags '{tag1}' and '{tag2}'."