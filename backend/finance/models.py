from django.core.validators import MinValueValidator
from django.db import models


class FuelLog(models.Model):
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.PROTECT)
    trip = models.ForeignKey('trips.Trip', on_delete=models.SET_NULL, null=True, blank=True)
    liters = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)])
    cost = models.DecimalField(max_digits=10, decimal_places=2)
    log_date = models.DateField()

    class Meta:
        db_table = 'finance_fuellog'
        ordering = ['-log_date']

    def __str__(self):
        return f"Fuel {self.liters}L - {self.vehicle}"


class Expense(models.Model):
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.PROTECT)
    category = models.CharField(max_length=50)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    note = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = 'finance_expense'
        ordering = ['-expense_date']

    def __str__(self):
        return f"{self.category} - {self.amount} ({self.vehicle})"
