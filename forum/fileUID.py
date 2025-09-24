import uuid

def messageFileUID(instance, filename):
    fileExt  = filename.split('.')[-1]
    filename = f'{uuid.uuid4()}.{fileExt}'
    return f'MessageFiles/{filename}'