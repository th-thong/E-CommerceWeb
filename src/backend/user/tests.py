from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import User

class UserProfileAPITest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com', 
            password='strongpassword123',
            role='buyer',
            status='active'
        )

        self.url = reverse('user-profile')

    def test_get_user_profile_success(self):
        """
        Kiểm tra xem user đã đăng nhập có lấy được thông tin của mình không.
        """
        # Giả vờ đăng nhập
        self.client.force_authenticate(user=self.user)
        
        # Gọi API bằng phương thức GET
        response = self.client.get(self.url)

        # Kiểm tra status code có phải là 200 OK không
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Kiểm tra dữ liệu trả về có đúng không
        self.assertEqual(response.data['user_name'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['role'], 'buyer')
        self.assertEqual(response.data['status'], 'active')

    def test_get_user_profile_unauthenticated(self):
        """
        Kiểm tra xem user chưa đăng nhập có bị từ chối (401) không.
        """
        # Gọi API mà không đăng nhập
        response = self.client.get(self.url)

        # kiểm tra lỗi 401 Unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)