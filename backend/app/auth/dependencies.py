import jwt as pyjwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Annotated, Optional
from uuid import UUID
import logging

from app.config import settings
from app.auth.logging import log_login_failure, AuthEventType

logger = logging.getLogger(__name__)

# Security scheme for extracting Bearer tokens
security = HTTPBearer()

# JWKS client to fetch and cache public keys from Better Auth
_jwks_url = f"{settings.BETTER_AUTH_URL}/api/auth/jwks"
logger.info(f"Initializing JWKS client with URL: {_jwks_url}")

_jwks_client = PyJWKClient(
    _jwks_url,
    cache_keys=True,
    lifespan=3600,
)


def _get_client_ip(request: Optional[Request]) -> Optional[str]:
    """Extract client IP from request, handling proxies."""
    if not request:
        return None
    # Check for forwarded header first (reverse proxy)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    # Fall back to direct client
    if request.client:
        return request.client.host
    return None


def _get_user_agent(request: Optional[Request]) -> Optional[str]:
    """Extract user agent from request headers."""
    if not request:
        return None
    return request.headers.get("User-Agent")


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    request: Request = None
) -> str:
    """
    Verify JWT token using JWKS public keys from Better Auth.

    Args:
        credentials: HTTP Authorization credentials (Bearer token)

    Returns:
        str: The authenticated user's ID from token subject (Better Auth format)

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials

        # Get the signing key from JWKS
        signing_key = _jwks_client.get_signing_key_from_jwt(token)

        # Decode and verify the JWT using the public key
        # Include clock skew tolerance (leeway) for time-based claims
        # Note: We skip audience validation as Better Auth may use different URLs
        # in dev vs prod environments
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["EdDSA"],
            leeway=settings.CLOCK_SKEW_SECONDS,  # 30 seconds default tolerance
            options={"verify_aud": False},  # Skip audience validation
        )

        # Extract user ID from subject claim
        # Better Auth uses string IDs, not UUIDs
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

    except pyjwt.ExpiredSignatureError:
        # Log expired token attempt
        log_login_failure(
            reason="token_expired",
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request)
        )
        raise credentials_exception

    except pyjwt.InvalidSignatureError:
        # Log tampered token attempt
        log_login_failure(
            reason="invalid_signature",
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request)
        )
        raise credentials_exception

    except (pyjwt.PyJWTError, Exception) as e:
        # Log other token validation failures
        error_msg = f"token_validation_failed: {type(e).__name__}"
        logger.warning(f"JWT validation error: {type(e).__name__}: {str(e)}")
        log_login_failure(
            reason=error_msg,
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request)
        )
        raise credentials_exception

    return user_id
