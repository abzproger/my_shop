from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.jwt import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request.state.user_id = None
        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")

        if scheme.lower() == "bearer" and token:
            try:
                payload = decode_access_token(token)
                request.state.user_id = payload.sub
            except Exception:
                request.state.user_id = None

        return await call_next(request)
