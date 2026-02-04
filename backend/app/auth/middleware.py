from fastapi import HTTPException, Request, status
from typing import Optional

from app.auth.logging import log_auth_denied


def _get_client_ip(request: Optional[Request]) -> Optional[str]:
    """Extract client IP from request, handling proxies."""
    if not request:
        return None
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _get_user_agent(request: Optional[Request]) -> Optional[str]:
    """Extract user agent from request headers."""
    if not request:
        return None
    return request.headers.get("User-Agent")


def verify_user_access(
    authenticated_user_id: str,
    resource_user_id: str,
    request: Optional[Request] = None,
    resource_path: Optional[str] = None
) -> None:
    """
    Verify that the authenticated user has access to the requested resource.

    Compares the user ID from JWT token with the user ID in the URL path.
    This prevents users from accessing other users' resources.

    Args:
        authenticated_user_id: User ID extracted from JWT token
        resource_user_id: User ID from URL path parameter
        request: Optional FastAPI request for logging context
        resource_path: Optional resource path for logging

    Raises:
        HTTPException: 403 Forbidden if user IDs don't match
    """
    if authenticated_user_id != resource_user_id:
        # Log the authorization denial
        log_auth_denied(
            user_id=authenticated_user_id,
            resource=resource_path or f"user/{resource_user_id}",
            ip_address=_get_client_ip(request),
            user_agent=_get_user_agent(request)
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )
