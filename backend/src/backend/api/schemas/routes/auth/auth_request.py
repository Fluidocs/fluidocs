from pydantic import BaseModel, EmailStr, Field


class SignInRequest(BaseModel):
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=1, max_length=128)
