import uuid

def groupIconUID(instance, filename):
    fileExt  = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{fileExt}'
    return f'GroupIcons/{filename}'