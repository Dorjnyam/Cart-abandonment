import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import SetPasswordForm
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.tenants.models import TeamMember, Tenant


# ---------------------------------------------------------------------------
# JWT helpers
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Add email as an optional field so clients can send either form
    email = serializers.EmailField(required=False, write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the username field optional — email can substitute for it
        self.fields["username"].required = False

    def validate(self, attrs):
        User = get_user_model()
        email = attrs.pop("email", None)
        username = attrs.get("username", "")

        # Resolve email → username when client sends email instead of username
        if not username and email:
            try:
                user_obj = User.objects.get(email__iexact=email, is_active=True)
                attrs["username"] = user_obj.username
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"detail": "Имэйл эсвэл нууц үг буруу байна"}
                )
        elif "@" in username:
            try:
                user_obj = User.objects.get(email__iexact=username, is_active=True)
                attrs["username"] = user_obj.username
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"detail": "Имэйл эсвэл нууц үг буруу байна"}
                )

        if not attrs.get("username"):
            raise serializers.ValidationError(
                {"detail": "Нэвтрэх нэр эсвэл имэйл шаардлагатай"}
            )

        data = super().validate(attrs)
        user = self.user
        membership = (
            TeamMember.objects.select_related("tenant")
            .filter(user=user, tenant__status=Tenant.Status.ACTIVE)
            .first()
        )
        role = membership.role if membership else "viewer"
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "role": role,
        }
        return data


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "invalid refresh token"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "logged out"}, status=status.HTTP_205_RESET_CONTENT)


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

def _unique_username(base: str) -> str:
    User = get_user_model()
    username, counter = base, 1
    while User.objects.filter(username=username).exists():
        username = f"{base}{counter}"
        counter += 1
    return username


def _unique_domain(base: str) -> str:
    domain, counter = base, 1
    base_domain = base
    while Tenant.objects.filter(domain=domain).exists():
        domain = f"{base_domain}-{counter}"
        counter += 1
    return domain


class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")
        store_name = request.data.get("store_name", "").strip()
        plan = request.data.get("plan", Tenant.Tier.BASIC)

        if not email:
            return Response({"email": ["Энэ талбар шаардлагатай"]}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": ["Энэ имэйл бүртгэлтэй байна"]}, status=status.HTTP_400_BAD_REQUEST)

        tier_values = [t.value for t in Tenant.Tier]
        tier = plan if plan in tier_values else Tenant.Tier.BASIC

        with transaction.atomic():
            base_username = email.split("@")[0] or "user"
            user = User.objects.create_user(
                username=_unique_username(base_username),
                email=email,
                password=password,
            )

            base_domain = re.sub(r"[^a-z0-9-]", "-", store_name.lower()).strip("-") or "store"
            tenant = Tenant.objects.create(
                name=store_name or email,
                domain=_unique_domain(f"{base_domain}.local"),
                tier=tier,
                status=Tenant.Status.ACTIVE,
            )

            TeamMember.objects.create(
                tenant=tenant,
                user=user,
                role=TeamMember.Role.OWNER,
            )

        return Response({"message": "Бүртгэл амжилттай"}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Password reset (request + confirm)
# ---------------------------------------------------------------------------

class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        User = get_user_model()
        try:
            user = User.objects.get(email__iexact=email, is_active=True)
        except User.DoesNotExist:
            # Return success regardless to avoid email enumeration
            return Response({"message": "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх заавар илгээгдлээ"})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3001").rstrip("/")
        reset_url = f"{frontend_url}/auth/password/reset/confirm?uid={uid}&token={token}"

        send_mail(
            subject="Нууц үг сэргээх",
            message=(
                f"Сайн байна уу,\n\n"
                f"Нууц үг сэргээхийн тулд доорх холбоос дээр дарна уу:\n\n"
                f"{reset_url}\n\n"
                f"Хэрэв та энэ хүсэлт гаргаагүй бол энэ имэйлийг үл тооно уу.\n"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )

        return Response({"message": "Хэрэв энэ имэйл бүртгэлтэй бол нууц үг сэргээх заавар илгээгдлээ"})


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        password1 = request.data.get("new_password1", "")
        password2 = request.data.get("new_password2", "")

        User = get_user_model()
        try:
            pk = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({"token": ["Хүчингүй эсвэл хугацаа дууссан"]}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"token": ["Хүчингүй эсвэл хугацаа дууссан"]}, status=status.HTTP_400_BAD_REQUEST)

        if password1 != password2:
            return Response({"new_password2": ["Нууц үг таарахгүй байна"]}, status=status.HTTP_400_BAD_REQUEST)

        form = SetPasswordForm(user, {"new_password1": password1, "new_password2": password2})
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        form.save()
        return Response({"message": "Нууц үг шинэчлэгдлээ"})


# ---------------------------------------------------------------------------
# Profile (GET + PATCH)
# ---------------------------------------------------------------------------

def _profile_data(user):
    membership = (
        TeamMember.objects.select_related("tenant")
        .filter(user=user, tenant__status=Tenant.Status.ACTIVE)
        .first()
    )
    role = (
        user.groups.first().name
        if user.groups.exists()
        else (membership.role if membership else "viewer")
    )
    tenant_data = None
    if membership:
        t = membership.tenant
        tenant_data = {"id": t.id, "name": t.name, "plan": t.tier}

    return {
        "id": user.id,
        "email": user.email,
        "full_name": f"{user.first_name} {user.last_name}".strip(),
        "role": role,
        "tenant": tenant_data,
    }


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_profile_data(request.user))

    def patch(self, request):
        user = request.user
        full_name = request.data.get("full_name", "").strip()
        parts = full_name.split(" ", 1)
        user.first_name = parts[0]
        user.last_name = parts[1] if len(parts) > 1 else ""
        user.save(update_fields=["first_name", "last_name"])
        return Response(_profile_data(user))


# ---------------------------------------------------------------------------
# Password change (authenticated)
# ---------------------------------------------------------------------------

class PasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password", "")
        password1 = request.data.get("new_password1", "")
        password2 = request.data.get("new_password2", "")

        if not user.check_password(old_password):
            return Response({"old_password": ["Хуучин нууц үг буруу байна"]}, status=status.HTTP_400_BAD_REQUEST)

        if password1 != password2:
            return Response({"new_password2": ["Нууц үг таарахгүй байна"]}, status=status.HTTP_400_BAD_REQUEST)

        form = SetPasswordForm(user, {"new_password1": password1, "new_password2": password2})
        if not form.is_valid():
            return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

        form.save()

        # Re-issue tokens so client stays authenticated
        refresh = RefreshToken.for_user(user)
        return Response({
            "message": "Нууц үг солигдлоо",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })
