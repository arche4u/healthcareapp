"""Redis cache utilities."""
import os
import json
import logging
from typing import Any, Optional
from functools import wraps

import redis

logger = logging.getLogger(__name__)

# Redis connection
_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        db = int(os.getenv("REDIS_DB", "0"))
        password = os.getenv("REDIS_PASSWORD") or None

        _redis_client = redis.Redis(
            host=host,
            port=port,
            db=db,
            password=password,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
    return _redis_client


def cache_get(key: str, default: Any = None) -> Any:
    """Get value from cache."""
    try:
        client = get_redis()
        value = client.get(key)
        if value is None:
            return default
        return json.loads(value)
    except Exception as e:
        logger.warning(f"Cache get failed for {key}: {e}")
        return default


def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set value in cache with TTL (seconds)."""
    try:
        client = get_redis()
        return client.setex(key, ttl, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"Cache set failed for {key}: {e}")
        return False


def cache_delete(key: str) -> bool:
    """Delete key from cache."""
    try:
        client = get_redis()
        return bool(client.delete(key))
    except Exception as e:
        logger.warning(f"Cache delete failed for {key}: {e}")
        return False


def cache_exists(key: str) -> bool:
    """Check if key exists in cache."""
    try:
        client = get_redis()
        return bool(client.exists(key))
    except Exception as e:
        logger.warning(f"Cache exists failed for {key}: {e}")
        return False


def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function name and arguments
            key_parts = [key_prefix, func.__module__, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            cache_key = ":".join(key_parts)

            # Try cache first
            cached_value = cache_get(cache_key)
            if cached_value is not None:
                return cached_value

            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator


def invalidate_pattern(pattern: str) -> int:
    """Invalidate all keys matching pattern."""
    try:
        client = get_redis()
        keys = client.keys(pattern)
        if keys:
            return client.delete(*keys)
        return 0
    except Exception as e:
        logger.warning(f"Cache invalidate failed for {pattern}: {e}")
        return 0