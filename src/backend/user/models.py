from django.db import models

class User(models.Model):
    username = models.CharField(max_length=45)
    role = models.CharField(max_length=6)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    status = models.BooleanField(default=True)


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
