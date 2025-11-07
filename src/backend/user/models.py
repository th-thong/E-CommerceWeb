from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    # Model User là kế thừa từ class AbstractUser có sẵn của Django

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('seller', 'Seller'),
        ('buyer', 'Buyer'),
    )
    role = models.CharField(max_length=6, choices=ROLE_CHOICES, default='buyer')

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('banned', 'Banned'),
        ('pending', 'Pending'), # Chờ duyệt lên seller
    )
    status = models.CharField(max_length=7, choices=STATUS_CHOICES, default='active')

    
    email = models.EmailField(unique=True)

    # username là mặc định có trong class AbstractUser nên không cần thêm


    # Sửa lỗi truy vấn ngược cho các trường groups và user_permissions khi có cả User của mình
    # và User mặc định của Django
    groups = models.ManyToManyField(
        Group,
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        # Đặt tên mới cho truy vấn ngược
        related_name="custom_user_groups", 
        related_query_name="user",
    )
    
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        # Đặt tên mới cho truy vấn ngược
        related_name="custom_user_permissions",
        related_query_name="user",
    )

    def __str__(self):
        return self.username
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'email': self.email,
            'status': self.status,
        }

    def find_by_email(email):
        data = User.objects.filter(email=email)
        if data.exists():
            return data.first()
        return None
    
    def find_by_username(username):
        data = User.objects.filter(username=username)
        if data.exists():
            return data.first()
        return None
    