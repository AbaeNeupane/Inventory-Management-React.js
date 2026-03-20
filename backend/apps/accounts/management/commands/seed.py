"""
Management command: python manage.py seed

Seeds the database with demo data for all apps so the frontend
has realistic data to work with immediately after setup.
"""
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
import random


class Command(BaseCommand):
    help = "Seed the database with demo data for all apps."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing data before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write(self.style.WARNING("Flushing existing data..."))
            self._flush()

        self.stdout.write("Seeding users...")
        self._seed_users()

        self.stdout.write("Seeding company settings...")
        self._seed_settings()

        self.stdout.write("Seeding categories & brands...")
        self._seed_categories_brands()

        self.stdout.write("Seeding products...")
        self._seed_products()

        self.stdout.write("Seeding customers...")
        self._seed_customers()

        self.stdout.write("Seeding suppliers...")
        self._seed_suppliers()

        self.stdout.write("Seeding orders...")
        self._seed_orders()

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!\n"))
        self.stdout.write("  Superuser:  admin@example.com  / admin1234")
        self.stdout.write("  Manager:    manager@example.com / manager1234")
        self.stdout.write("  Cashier:    cashier@example.com / cashier1234")
        self.stdout.write("  API docs:   http://localhost:8000/api/v1/docs/\n")

    # ── Flush ────────────────────────────────────────────────────────────────

    def _flush(self):
        from apps.sales.models import Order, OrderItem
        from apps.suppliers.models import PurchaseOrder, PurchaseOrderItem, Supplier
        from apps.customers.models import Customer
        from apps.inventory.models import StockAdjustment
        from apps.products.models import Product, Category, Brand
        from apps.accounts.models import User

        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        PurchaseOrderItem.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        Supplier.objects.all().delete()
        Customer.objects.all().delete()
        StockAdjustment.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Brand.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

    # ── Users ────────────────────────────────────────────────────────────────

    def _seed_users(self):
        from apps.accounts.models import User

        users = [
            dict(email="admin@example.com",   full_name="Admin User",   role=User.Role.OWNER,
                 is_staff=True, is_superuser=True, password="admin1234"),
            dict(email="manager@example.com", full_name="Sita Manager", role=User.Role.MANAGER,
                 password="manager1234"),
            dict(email="cashier@example.com", full_name="Ram Cashier",  role=User.Role.CASHIER,
                 password="cashier1234"),
        ]
        for data in users:
            password = data.pop("password")
            user, created = User.objects.get_or_create(email=data["email"], defaults=data)
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"  Created user: {user.email}")

    # ── Settings ─────────────────────────────────────────────────────────────

    def _seed_settings(self):
        from apps.settings_app.models import CompanyProfile, TaxConfig, NotificationConfig

        cp = CompanyProfile.get_solo()
        cp.name     = "Smart Inventory Nepal"
        cp.address  = "New Road, Kathmandu, Nepal"
        cp.phone    = "01-4100000"
        cp.email    = "info@smartinventory.np"
        cp.pan_no   = "123456789"
        cp.currency = "NPR"
        cp.save()

        tc = TaxConfig.get_solo()
        tc.default_vat_rate = Decimal("13.00")
        tc.vat_enabled      = True
        tc.pan_on_receipt   = True
        tc.save()

        NotificationConfig.get_solo()

    # ── Categories & Brands ───────────────────────────────────────────────────

    def _seed_categories_brands(self):
        from apps.products.models import Category, Brand

        cat_names   = ["Medicine", "Consumables", "Equipment", "Supplements", "Personal Care"]
        brand_names = ["HealthCare", "SafeBreathe", "MediPlus", "NutriLife", "PharmaOne"]

        self._categories = {
            n: Category.objects.get_or_create(name=n)[0] for n in cat_names
        }
        self._brands = {
            n: Brand.objects.get_or_create(name=n)[0] for n in brand_names
        }

    # ── Products ──────────────────────────────────────────────────────────────

    def _seed_products(self):
        from apps.products.models import Product

        products_data = [
            dict(name="Paracetamol 500mg",        sku="MED-PCM-500",   category="Medicine",
                 brand="HealthCare",  price=15,    cost=8,    stock=120, reorder_level=30),
            dict(name="Surgical Mask (Box 50)",    sku="CON-MASK-50",   category="Consumables",
                 brand="SafeBreathe", price=250,   cost=150,  stock=40,  reorder_level=20),
            dict(name="Ibuprofen 400mg",           sku="MED-IBU-400",   category="Medicine",
                 brand="MediPlus",    price=25,    cost=14,   stock=80,  reorder_level=25),
            dict(name="Vitamin C 1000mg",          sku="SUP-VTC-1000",  category="Supplements",
                 brand="NutriLife",   price=150,   cost=80,   stock=60,  reorder_level=15),
            dict(name="Disposable Gloves (100pk)", sku="CON-GLV-100",   category="Consumables",
                 brand="SafeBreathe", price=350,   cost=200,  stock=30,  reorder_level=10),
            dict(name="Digital Thermometer",       sku="EQP-THRM-DIG",  category="Equipment",
                 brand="MediPlus",    price=850,   cost=500,  stock=15,  reorder_level=5),
            dict(name="Blood Pressure Monitor",    sku="EQP-BPM-001",   category="Equipment",
                 brand="HealthCare",  price=3500,  cost=2200, stock=8,   reorder_level=3),
            dict(name="Hand Sanitizer 500ml",      sku="PC-SANIT-500",  category="Personal Care",
                 brand="SafeBreathe", price=180,   cost=90,   stock=55,  reorder_level=20),
            dict(name="Omega-3 Fish Oil",          sku="SUP-OMG-90",    category="Supplements",
                 brand="NutriLife",   price=600,   cost=380,  stock=25,  reorder_level=8),
            dict(name="Syringes 5ml (100pk)",      sku="CON-SYR-5ML",   category="Consumables",
                 brand="MediPlus",    price=450,   cost=280,  stock=18,  reorder_level=10),
        ]

        self._products = {}
        for data in products_data:
            cat   = self._categories[data.pop("category")]
            brand = self._brands[data.pop("brand")]
            prod, created = Product.objects.get_or_create(
                sku=data["sku"],
                defaults=dict(**data, category=cat, brand=brand, tax_rate=Decimal("13.00")),
            )
            self._products[prod.sku] = prod
            if created:
                self.stdout.write(f"  Created product: {prod.name}")

    # ── Customers ─────────────────────────────────────────────────────────────

    def _seed_customers(self):
        from apps.customers.models import Customer

        customers_data = [
            dict(full_name="Ramesh Sharma",  phone="9841001001", email="ramesh@example.com",  tier=Customer.Tier.GOLD),
            dict(full_name="Sita Thapa",     phone="9845002002", email="sita@example.com",    tier=Customer.Tier.SILVER),
            dict(full_name="Bijay Karki",    phone="9861003003", email="bijay@example.com",   tier=Customer.Tier.BRONZE),
            dict(full_name="Anita Gurung",   phone="9800004004", email="anita@example.com",   tier=Customer.Tier.PLATINUM),
            dict(full_name="Deepak Rai",     phone="9823005005", email="deepak@example.com",  tier=Customer.Tier.BRONZE),
            dict(full_name="Priya Magar",    phone="9857006006", email="priya@example.com",   tier=Customer.Tier.SILVER),
            dict(full_name="Suresh Pandey",  phone="9812007007", email="suresh@example.com",  tier=Customer.Tier.GOLD),
            dict(full_name="Kamala Bista",   phone="9869008008", email="kamala@example.com",  tier=Customer.Tier.BRONZE),
        ]

        self._customers = []
        for data in customers_data:
            cust, created = Customer.objects.get_or_create(
                email=data["email"], defaults=data
            )
            self._customers.append(cust)
            if created:
                self.stdout.write(f"  Created customer: {cust.full_name}")

    # ── Suppliers ─────────────────────────────────────────────────────────────

    def _seed_suppliers(self):
        from apps.suppliers.models import Supplier

        suppliers_data = [
            dict(name="MedLife Distributors",    contact_name="Sunil Adhikari",  phone="01-4201234",
                 email="sunil@medlife.com.np",   payment_terms="net30", rating=5, outstanding=18500,
                 category="Medicine"),
            dict(name="SafeBreath Pvt Ltd",      contact_name="Kabita Shrestha", phone="01-4305678",
                 email="kabita@safebreathe.com", payment_terms="net15", rating=4, outstanding=5200,
                 category="Consumables"),
            dict(name="PharmaCo International",  contact_name="Puja Tamang",     phone="01-4509876",
                 email="puja@pharmaco.com",       payment_terms="net45", rating=4, outstanding=42000,
                 category="Medicine"),
            dict(name="CleanCare Supplies",      contact_name="Dinesh Joshi",    phone="9860333222",
                 email="dinesh@cleancare.np",     payment_terms="net30", rating=5, outstanding=3800,
                 category="Consumables"),
            dict(name="NutriSource Nepal",       contact_name="Rajan Shrestha",  phone="9841555444",
                 email="rajan@nutrisource.np",    payment_terms="cod",   rating=3, outstanding=0,
                 category="Supplements"),
        ]

        for data in suppliers_data:
            cat_name    = data.pop("category")
            cat         = self._categories.get(cat_name)
            outstanding = Decimal(str(data.pop("outstanding", 0)))
            Supplier.objects.get_or_create(
                email=data["email"],
                defaults=dict(**data, category=cat, outstanding=outstanding),
            )

    # ── Orders ────────────────────────────────────────────────────────────────

    def _seed_orders(self):
        from apps.sales.models import Order, OrderItem
        from apps.inventory.models import StockAdjustment
        from apps.accounts.models import User

        cashier  = User.objects.filter(role=User.Role.CASHIER).first()
        products = list(self._products.values())

        # Create 20 sample completed orders spread across the last 60 days
        for i in range(20):
            customer = random.choice(self._customers)
            days_ago = random.randint(0, 60)
            order_dt = timezone.now() - timedelta(days=days_ago)

            order = Order.objects.create(
                customer       = customer,
                cashier        = cashier,
                status         = Order.Status.COMPLETED,
                payment_method = random.choice(["cash", "esewa", "card", "khalti"]),
                created_at     = order_dt,
            )

            # 1–4 random line items
            chosen = random.sample(products, k=random.randint(1, min(4, len(products))))
            for product in chosen:
                qty = random.randint(1, 3)
                if product.stock < qty:
                    qty = max(product.stock, 1)

                OrderItem.objects.create(
                    order      = order,
                    product    = product,
                    quantity   = qty,
                    unit_price = product.price,
                    tax_rate   = product.tax_rate,
                )

                product.stock = max(product.stock - qty, 0)
                product.save(update_fields=["stock"])

                StockAdjustment.objects.create(
                    product     = product,
                    delta       = -qty,
                    reason      = StockAdjustment.Reason.SALE,
                    note        = f"Seed Order #{order.pk}",
                    adjusted_by = cashier,
                )

            order.calculate_totals()
            order.save()
            order.customer.recalculate_tier()

        self.stdout.write(f"  Created 20 sample orders.")