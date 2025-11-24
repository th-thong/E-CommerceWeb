import os
import uuid
from django.utils.deconstruct import deconstructible
from django.utils import timezone

def rename_product_image(instance, filename):
    ext = filename.split('.')[-1]

    new_filename = f'{timezone.now().strftime("%Y%m%d%H%M%S")}_{uuid.uuid4().hex[:8]}.{ext}'

    return os.path.join('products/gallery/', new_filename)