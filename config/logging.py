import logging
import sys
from datetime import datetime

# =========================
# Terminal colors (ANSI)
# =========================
RESET = "\033[0m"
DIM = "\033[2m"

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
MAGENTA = "\033[95m"

LEVEL_COLORS = {
    "DEBUG": DIM + CYAN,
    "INFO": GREEN,
    "WARNING": YELLOW,
    "ERROR": RED,
    "CRITICAL": MAGENTA,
}

# =========================
# Custom Formatter
# =========================
class NeonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        levelname = record.levelname
        color = LEVEL_COLORS.get(levelname, "")
        timestamp = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")

        message = record.getMessage()
        module = record.name

        return (
            f"{DIM}[{timestamp}]{RESET} "
            f"{color}{levelname:<8}{RESET} "
            f"{DIM}{module}{RESET} → "
            f"{message}"
        )

# =========================
# Logger factory
# =========================
def get_logger(name: str, level=logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    logger.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(NeonFormatter())

    logger.addHandler(handler)
    logger.propagate = False

    return logger
