import hashlib
import hmac
import urllib.parse

class VNPAY:
    def __init__(self):
        self.request_data = {}
        self.response_data = {}

    def add_request_data(self, key, value):
        if value is not None:
            self.request_data[key] = str(value)

    def get_payment_url(self, vnpay_payment_url, secret_key):
        # Sắp xếp tham số theo a-z
        input_data = sorted(self.request_data.items())
        
        # Tạo query string
        query_string = ''
        seq = 0
        for key, val in input_data:
            if seq == 1:
                query_string = query_string + "&" + key + "=" + urllib.parse.quote_plus(val)
            else:
                query_string = key + "=" + urllib.parse.quote_plus(val)
                seq = 1

        # Tạo chữ ký bảo mật (HMAC SHA512)
        hash_value = self.__hmacsha512(secret_key, query_string)
        
        # Trả về URL hoàn chỉnh
        return vnpay_payment_url + "?" + query_string + "&vnp_SecureHash=" + hash_value

    def validate_response(self, secret_key):
        vnp_SecureHash = self.response_data.get('vnp_SecureHash')
        
        if 'vnp_SecureHash' in self.response_data:
            self.response_data.pop('vnp_SecureHash')
            
        if 'vnp_SecureHashType' in self.response_data:
            self.response_data.pop('vnp_SecureHashType')

        input_data = sorted(self.response_data.items())
        
        query_string = ''
        seq = 0
        for key, val in input_data:
            if seq == 1:
                query_string = query_string + "&" + key + "=" + urllib.parse.quote_plus(val)
            else:
                query_string = key + "=" + urllib.parse.quote_plus(val)
                seq = 1
        
        hash_value = self.__hmacsha512(secret_key, query_string)
        
        return vnp_SecureHash == hash_value

    def __hmacsha512(self, key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()