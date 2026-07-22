import logging
import os

import sentry_sdk
from sentry_sdk.integrations.logging import LoggingIntegration

_dsn = os.getenv("SENTRY_DSN", "")
if _dsn:
    sentry_sdk.init(
        dsn=_dsn,
        environment=os.getenv("APP_ENV", "development"),
        traces_sample_rate=0.1,
        integrations=[LoggingIntegration(level=logging.INFO, event_level=logging.ERROR)],
    )
