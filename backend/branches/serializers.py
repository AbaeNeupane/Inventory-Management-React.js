from rest_framework import serializers
from .models import Branch


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = [
            "id", "name", "address", "phone",
            "email", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class BranchWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ["name", "address", "phone", "email", "is_active"]

    def validate_name(self, value):
        qs = Branch.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "A branch with this name already exists."
            )
        return value