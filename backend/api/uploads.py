"""Upload & Analysis API — file upload endpoints."""

import os
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.database import get_db
from backend.config import settings
from backend.services.analysis_service import analyze_pcap, analyze_email_file, analyze_log_file

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analyze", tags=["Analysis"])

ALLOWED_PCAP = {".pcap", ".pcapng"}
ALLOWED_LOGS = {".log", ".txt", ".csv", ".json"}
ALLOWED_EMAIL = {".eml", ".txt", ".html"}


async def _save_upload(upload_file: UploadFile, allowed_extensions: set, subdir: str) -> tuple[str, str]:
    """Save uploaded file and return (file_path, original_filename)."""
    if not upload_file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(upload_file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {ext}. Allowed: {', '.join(allowed_extensions)}"
        )

    # Check file size
    content = await upload_file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=413, detail=f"File too large. Max size: {settings.max_upload_size // (1024*1024)}MB")

    # Save to uploads dir
    save_dir = settings.upload_dir / subdir
    save_dir.mkdir(parents=True, exist_ok=True)

    safe_name = f"{uuid.uuid4().hex}{ext}"
    file_path = save_dir / safe_name

    with open(file_path, "wb") as f:
        f.write(content)

    return str(file_path), upload_file.filename


@router.post("/pcap")
async def analyze_pcap_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyze a PCAP file."""
    file_path, filename = await _save_upload(file, ALLOWED_PCAP, "pcap")

    try:
        result = await analyze_pcap(db, file_path, filename)
        return result
    except Exception as e:
        logger.error(f"PCAP analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up uploaded file
        try:
            os.remove(file_path)
        except Exception:
            pass


@router.post("/email")
async def analyze_email_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyze an email file."""
    file_path, filename = await _save_upload(file, ALLOWED_EMAIL, "email")

    try:
        result = await analyze_email_file(db, file_path, filename)
        return result
    except Exception as e:
        logger.error(f"Email analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(file_path)
        except Exception:
            pass


@router.post("/logs")
async def analyze_log_upload(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and analyze a log file."""
    file_path, filename = await _save_upload(file, ALLOWED_LOGS, "logs")

    try:
        result = await analyze_log_file(db, file_path, filename)
        return result
    except Exception as e:
        logger.error(f"Log analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.remove(file_path)
        except Exception:
            pass
