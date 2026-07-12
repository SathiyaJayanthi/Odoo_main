from django.core.validators import MinValueValidator
from django.db import models


class MaintenanceLog(models.Model):
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('Closed', 'Closed'),
    ]

    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.PROTECT)
    description = models.CharField(max_length=255)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True)

    class Meta:
        db_table = 'maintenance_maintenancelog'
        ordering = ['-opened_at']
        indexes = [
            models.Index(fields=['vehicle']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Maintenance #{self.id} - {self.vehicle}"
