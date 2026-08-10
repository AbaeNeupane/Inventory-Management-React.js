from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.products.models import Brand, Category, Product
from apps.sales.models import Order, OrderItem


class ProductDeleteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email="manager@example.com",
            password="secret123",
            full_name="Test Manager",
            role=get_user_model().Role.MANAGER,
        )
        self.client.force_authenticate(self.user)

        self.category = Category.objects.create(name="Health")
        self.brand = Brand.objects.create(name="BrandX")
        self.product = Product.objects.create(
            name="Vitamin C",
            sku="VITC-001",
            description="",
            category=self.category,
            brand=self.brand,
            price=Decimal("10.00"),
            cost=Decimal("5.00"),
            tax_rate=Decimal("13.00"),
        )
        self.order = Order.objects.create(status=Order.Status.COMPLETED, cashier=self.user)
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            quantity=2,
            unit_price=Decimal("10.00"),
            tax_rate=Decimal("0.00"),
        )

    def test_casual_user_cannot_delete_product(self):
        self.user.role = get_user_model().Role.CASHIER
        self.user.save(update_fields=["role"])

        response = self.client.delete(f"/api/v1/products/{self.product.id}/")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only owners and managers", str(response.data))
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    def test_owner_can_delete_product_with_sales_history(self):
        self.user.role = get_user_model().Role.OWNER
        self.user.save(update_fields=["role"])

        response = self.client.delete(f"/api/v1/products/{self.product.id}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(pk=self.product.pk).exists())
