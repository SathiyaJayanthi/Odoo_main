from django.db import models


class Driver(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('On Trip', 'On Trip'),
        ('Off Duty', 'Off Duty'),
        ('Suspended', 'Suspended'),
    ]

    user = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=120)
    license_number = models.CharField(max_length=40, unique=True)
    license_category = models.CharField(max_length=20)
    license_expiry = models.DateField()
    contact_number = models.CharField(max_length=20)
    safety_score = models.DecimalField(max_digits=4, decimal_places=1, default=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'drivers_driver'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['license_expiry']),
        ]

    def __str__(self):
        return f"{self.name} ({self.license_number})"
