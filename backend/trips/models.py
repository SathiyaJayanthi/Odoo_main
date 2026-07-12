from django.core.validators import MinValueValidator
from django.db import models


class Trip(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Dispatched', 'Dispatched'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.PROTECT)
    driver = models.ForeignKey('drivers.Driver', on_delete=models.PROTECT)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    source = models.CharField(max_length=120)
    destination = models.CharField(max_length=120)
    cargo_weight = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    planned_distance = models.DecimalField(max_digits=10, decimal_places=2)
    final_odometer = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    fuel_consumed = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    dispatched_at = models.DateTimeField(null=True)
    completed_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trips_trip'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['vehicle']),
            models.Index(fields=['driver']),
        ]

    def __str__(self):
        return f"Trip {self.id}: {self.source} → {self.destination}"
