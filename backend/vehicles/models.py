from django.core.validators import MinValueValidator
from django.db import models


class Vehicle(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('On Trip', 'On Trip'),
        ('In Shop', 'In Shop'),
        ('Retired', 'Retired'),
    ]

    registration_number = models.CharField(max_length=20, unique=True)
    name_model = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    max_load_capacity = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    odometer = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    acquisition_cost = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    region = models.CharField(max_length=60, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vehicles_vehicle'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['type']),
            models.Index(fields=['registration_number']),
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.name_model}"
