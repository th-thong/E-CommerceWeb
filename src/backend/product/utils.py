import os
import uuid
from django.utils.deconstruct import deconstructible
from django.utils import timezone
from imagekitio import ImageKit
from django.conf import settings
import base64
from django.core.files.storage import default_storage

def rename_product_image(filename):
    ext = filename.split('.')[-1]

    new_filename = f'{timezone.now().strftime("%Y%m%d%H%M%S")}_{uuid.uuid4().hex[:8]}.{ext}'

    return new_filename



def upload_image(file_obj, file_name):
    storage_setting = str(settings.USE_CLOUD_STORAGE).upper().strip()
    # --- TRƯỜNG HỢP 1: LƯU LÊN CLOUD (IMAGEKIT) ---
    if storage_setting == 'TRUE':
        try:

            imagekit = ImageKit(
                private_key=settings.IMAGEKIT_PRIVATE_KEY,
                public_key=settings.IMAGEKIT_PUBLIC_KEY,
                url_endpoint=settings.IMAGEKIT_URL_ENDPOINT
            )
            
            if hasattr(file_obj, 'seek'): file_obj.seek(0)
            file_content = file_obj.read()
            file_base64 = base64.b64encode(file_content).decode('utf-8')

            result = imagekit.upload_file(
                file=file_base64, 
                file_name=file_name
            )
            

            url = result.url if hasattr(result, 'url') else result.get('url')
            file_id = result.file_id if hasattr(result, 'file_id') else result.get('fileId')
            
            return {
                'url': url,
                'fileId': file_id,
                'storage_type': 'cloud'
            }
        except Exception as e:
            return None

    # --- TRƯỜNG HỢP 2: LƯU TRÊN MÁY (LOCAL) ---
    else:
        try:

            
            # 1. Đảm bảo tên file không trùng (thêm UUID)
            ext = file_name.split('.')[-1]
            new_filename = f"{uuid.uuid4().hex}.{ext}"
            save_path = f"products/{new_filename}" # Lưu vào thư mục media/products/

            # 2. Lưu file vật lý
            if hasattr(file_obj, 'seek'): file_obj.seek(0)
            
            path = default_storage.save(save_path, file_obj)
            
            # 3. Tạo URL đầy đủ
            full_url = f"{settings.MEDIA_URL}{path}"

            return {
                'url': full_url,
                'fileId': path,
                'storage_type': 'local'
            }
        except Exception as e:
            print(f"Lỗi Lưu Local: {e}")
            return None