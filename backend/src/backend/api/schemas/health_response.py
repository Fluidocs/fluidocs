from typing import Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status_code: int = Field(default=200, examples=[200, 300, 400, 500])
    message: Optional[str] = Field(default="Sua API está saudável!")
