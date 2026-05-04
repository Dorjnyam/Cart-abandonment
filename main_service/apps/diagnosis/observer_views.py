import hashlib
import json

import redis
from django.conf import settings
from django.db import connections
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.status import HTTP_201_CREATED, HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED
from rest_framework.views import APIView

from apps.tenants.models import APIKey


class TrackEventView(APIView):
    """
    Observer ingest contract (WF-02/03/04).

    Client should send:
      - Header: `X-API-Key: <raw_key>`
      - Body:  { session_id, visitor_id, event_type, payload }

    On `event_type == session_end` this also enqueues a message to:
      Redis: `ca:diagnosis:queue`
    """

    permission_classes = [AllowAny]

    def post(self, request):
        raw_key = request.headers.get('X-API-Key') or request.data.get('api_key')
        if not raw_key:
            return Response({'detail': 'Missing API key'}, status=HTTP_400_BAD_REQUEST)

        key_hash = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
        api_key = APIKey.objects.filter(key_hash=key_hash, is_active=True).select_related('tenant').first()
        if not api_key:
            return Response({'detail': 'Invalid API key'}, status=HTTP_401_UNAUTHORIZED)

        session_id = request.data.get('session_id')
        visitor_id = request.data.get('visitor_id') or 'unknown'
        event_type = request.data.get('event_type')
        payload = request.data.get('payload') or {}

        if not session_id or not event_type:
            return Response({'detail': 'Missing session_id or event_type'}, status=HTTP_400_BAD_REQUEST)

        tenant_id = api_key.tenant_id
        tier = api_key.tier

        # Write to Observer DB (main_service should only read it elsewhere; here we emulate observer ingest).
        try:
            with connections['observer'].cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO raw_events (tenant_id, session_id, visitor_id, event_type, payload, tier, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    [
                        tenant_id,
                        session_id,
                        visitor_id,
                        event_type,
                        json.dumps(payload),
                        tier,
                        timezone.now(),
                    ],
                )
        except Exception:
            # Observer schema may not exist yet in dev; keep ingest responsive for MVP scaffolding.
            pass

        # Enqueue on session end.
        if event_type == 'session_end':
            try:
                r = redis.Redis.from_url(settings.REDIS_URL)
                message = json.dumps({'session_id': session_id, 'visitor_id': visitor_id, 'tenant_id': tenant_id, 'tier': tier})
                r.lpush('ca:diagnosis:queue', message)
            except Exception:
                pass

        return Response({'detail': 'ok'}, status=HTTP_201_CREATED)

