"""
Auth event logging module for security-relevant authentication events.

Logs events in JSON format for easy parsing by log aggregators.
Events: login success/failure, token refresh, logout, authorization denied.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional, Union
from uuid import UUID


# Configure auth-specific logger
auth_logger = logging.getLogger("auth")


class AuthEventType:
    """Authentication event type constants."""
    LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS"
    LOGIN_FAILURE = "AUTH_LOGIN_FAILURE"
    TOKEN_REFRESH = "AUTH_TOKEN_REFRESH"
    TOKEN_REFRESH_FAILURE = "AUTH_TOKEN_REFRESH_FAILURE"
    LOGOUT = "AUTH_LOGOUT"
    DENIED = "AUTH_DENIED"


def _mask_ip(ip_address: Optional[str]) -> Optional[str]:
    """Mask the last octet of IP address for privacy."""
    if not ip_address:
        return None
    parts = ip_address.split(".")
    if len(parts) == 4:
        parts[-1] = "xxx"
        return ".".join(parts)
    return ip_address


def _truncate_user_agent(user_agent: Optional[str], max_length: int = 100) -> Optional[str]:
    """Truncate user agent string for log readability."""
    if not user_agent:
        return None
    if len(user_agent) <= max_length:
        return user_agent
    return user_agent[:max_length] + "..."


def log_auth_event(
    event_type: str,
    user_id: Optional[Union[str, UUID]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    **details
) -> None:
    """
    Log a security-relevant authentication event.

    Args:
        event_type: Type of auth event (use AuthEventType constants)
        user_id: User ID if available
        ip_address: Client IP address (will be masked)
        user_agent: Browser/client identifier (will be truncated)
        **details: Additional event-specific details
    """
    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "user_id": str(user_id) if user_id else None,
        "ip_address": _mask_ip(ip_address),
        "user_agent": _truncate_user_agent(user_agent),
        "details": details if details else {}
    }

    auth_logger.info(json.dumps(log_entry))


def log_login_success(
    user_id: Union[str, UUID],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log successful login event."""
    log_auth_event(
        AuthEventType.LOGIN_SUCCESS,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


def log_login_failure(
    reason: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    email_hash: Optional[str] = None
) -> None:
    """Log failed login attempt."""
    log_auth_event(
        AuthEventType.LOGIN_FAILURE,
        ip_address=ip_address,
        user_agent=user_agent,
        reason=reason,
        email_hash=email_hash
    )


def log_token_refresh(
    user_id: Union[str, UUID],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log successful token refresh."""
    log_auth_event(
        AuthEventType.TOKEN_REFRESH,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


def log_token_refresh_failure(
    reason: str,
    user_id: Optional[Union[str, UUID]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log failed token refresh attempt."""
    log_auth_event(
        AuthEventType.TOKEN_REFRESH_FAILURE,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        reason=reason
    )


def log_logout(
    user_id: Union[str, UUID],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log user logout event."""
    log_auth_event(
        AuthEventType.LOGOUT,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent
    )


def log_auth_denied(
    user_id: Union[str, UUID],
    resource: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> None:
    """Log authorization denied event (403)."""
    log_auth_event(
        AuthEventType.DENIED,
        user_id=user_id,
        ip_address=ip_address,
        user_agent=user_agent,
        resource=resource
    )
