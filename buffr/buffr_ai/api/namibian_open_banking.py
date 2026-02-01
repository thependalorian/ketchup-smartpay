"""
Namibian Open Banking Standards - FastAPI Router

Location: buffr_ai/api/namibian_open_banking.py
Purpose: FastAPI endpoints for Namibian Open Banking Standards v1.0

Note: Primary implementation is in Next.js API routes (app/api/bon/v1/).
This FastAPI router can proxy to Next.js endpoints or provide direct access.

Standards:
- Namibian Open Banking Standards v1.0 (25 April 2025)
- OAuth 2.0 with PKCE (RFC 7636)
- Pushed Authorization Requests (PAR - RFC 9126)
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Create router
namibian_open_banking_router = APIRouter(
    prefix="/bon/v1",
    tags=["Namibian Open Banking"]
)


class PARRequest(BaseModel):
    """Pushed Authorization Request"""
    client_id: str = Field(..., pattern=r"^API\d{6}$")
    redirect_uri: str
    response_type: str = Field(default="code")
    scope: str
    code_challenge: str
    code_challenge_method: str = Field(default="S256")
    state: Optional[str] = None


class PARResponse(BaseModel):
    """PAR Response"""
    request_uri: str
    expires_in: int = 600


class TokenRequest(BaseModel):
    """Token Request"""
    grant_type: str = Field(..., pattern="^(authorization_code|refresh_token)$")
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    client_id: str = Field(..., pattern=r"^API\d{6}$")
    code_verifier: Optional[str] = None
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    """Token Response"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600
    refresh_token: Optional[str] = None
    scope: str
    consent_id: str


class RevokeRequest(BaseModel):
    """Revoke Request"""
    token: str
    token_type_hint: Optional[str] = Field(None, pattern="^(access_token|refresh_token)$")


def validate_participant_header(participant_id: str = Header(..., alias="ParticipantId")):
    """Validate ParticipantId header"""
    import re
    if not re.match(r"^API\d{6}$", participant_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid ParticipantId format. Expected APInnnnnn"
        )
    return participant_id


def validate_api_version_header(x_v: str = Header(..., alias="x-v")):
    """Validate x-v header"""
    if not x_v.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Invalid x-v header format. Expected positive integer"
        )
    return x_v


@namibian_open_banking_router.post("/common/par", response_model=PARResponse)
async def create_par(
    request: PARRequest,
    participant_id: str = Depends(validate_participant_header),
    api_version: str = Depends(validate_api_version_header)
):
    """
    Create Pushed Authorization Request (PAR)
    
    TPP initiates consent flow by pushing authorization request.
    Returns a request_uri that is used in the authorization flow.
    """
    # Note: This endpoint should proxy to Next.js API or implement directly
    # For now, return a placeholder response
    logger.info(f"PAR request from TPP {participant_id}")
    
    # TODO: Implement PAR creation or proxy to Next.js endpoint
    # For now, return error indicating to use Next.js endpoint
    raise HTTPException(
        status_code=501,
        detail="PAR endpoint is implemented in Next.js API. Use /bon/v1/common/par via Next.js API."
    )


@namibian_open_banking_router.post("/common/token", response_model=TokenResponse)
async def get_token(
    request: TokenRequest,
    participant_id: str = Depends(validate_participant_header),
    api_version: str = Depends(validate_api_version_header)
):
    """
    OAuth 2.0 Token Endpoint
    
    Exchange authorization code for tokens, or refresh access token.
    """
    logger.info(f"Token request from TPP {participant_id}, grant_type: {request.grant_type}")
    
    # TODO: Implement token exchange or proxy to Next.js endpoint
    raise HTTPException(
        status_code=501,
        detail="Token endpoint is implemented in Next.js API. Use /bon/v1/common/token via Next.js API."
    )


@namibian_open_banking_router.post("/common/revoke")
async def revoke_token(
    request: RevokeRequest,
    participant_id: str = Depends(validate_participant_header),
    api_version: str = Depends(validate_api_version_header)
):
    """
    Token Revocation Endpoint
    
    Revokes an access token or refresh token, which also revokes the associated consent.
    Always returns 200 OK per RFC 7009.
    """
    logger.info(f"Revoke request from TPP {participant_id}")
    
    # TODO: Implement token revocation or proxy to Next.js endpoint
    # Always return 200 OK per RFC 7009
    return JSONResponse(
        status_code=200,
        content={}
    )


@namibian_open_banking_router.get("/health")
async def health_check():
    """Health check for Namibian Open Banking endpoints"""
    return {
        "status": "operational",
        "service": "Namibian Open Banking Standards v1.0",
        "endpoints": {
            "par": "/bon/v1/common/par",
            "token": "/bon/v1/common/token",
            "revoke": "/bon/v1/common/revoke",
        },
        "note": "Primary implementation in Next.js API routes. This router provides FastAPI access."
    }
