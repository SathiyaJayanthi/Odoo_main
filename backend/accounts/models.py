from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('fleet_manager', 'Fleet Manager'),
        ('driver', 'Driver'),
        ('safety_officer', 'Safety Officer'),
        ('financial_analyst', 'Financial Analyst'),
    ]

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    full_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']

    class Meta:
        db_table = 'accounts_user'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.role})"
