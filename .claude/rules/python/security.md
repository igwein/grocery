---
paths:
  - "**/*.py"
  - "**/*.pyi"
---
# Python Security

> This file extends [common/security.md](../common/security.md) with Python specific content.

## Secret Management

This project uses Pydantic Settings for configuration:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = ""
    database_url: str = "postgresql+asyncpg://..."

    class Config:
        env_file = ".env"
```

Never hardcode secrets — always load from environment variables via `.env`.
