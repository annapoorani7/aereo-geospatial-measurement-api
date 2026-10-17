"""
Logging configuration for Aereo GeoMeasure API.

Provides structured logging with appropriate levels and formatting.
"""

import logging
import logging.config
from app.config import LOG_LEVEL, LOG_FORMAT, DEBUG


def configure_logging() -> None:
    """
    Configure application-wide logging.

    Sets up console logging with the configured level and format.
    Call this once at application startup.
    """
    logging_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": LOG_FORMAT,
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s",
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": LOG_LEVEL,
                "formatter": "detailed" if DEBUG else "standard",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "app": {
                "level": LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn": {
                "level": LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False,
            },
            "uvicorn.access": {
                "level": LOG_LEVEL,
                "handlers": ["console"],
                "propagate": False,
            },
        },
        "root": {
            "level": LOG_LEVEL,
            "handlers": ["console"],
        },
    }

    logging.config.dictConfig(logging_config)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given module name.

    Args:
        name: Module name (typically __name__)

    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)
