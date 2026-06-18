import os
import base64
import boto3
from pathlib import Path
from botocore.config import Config
from database import load_dotenv

# Load settings from .env file
load_dotenv()

# Storage Configuration
# Cloudflare R2 / Supabase Storage / Tigris or any S3-compatible storage
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL")
S3_ACCESS_KEY_ID = os.environ.get("S3_ACCESS_KEY_ID")
S3_SECRET_ACCESS_KEY = os.environ.get("S3_SECRET_ACCESS_KEY")
S3_BUCKET = os.environ.get("S3_BUCKET", "smart-attendance-photos")
S3_PUBLIC_URL_TEMPLATE = os.environ.get("S3_PUBLIC_URL_TEMPLATE") # e.g. "https://pub-xxxx.r2.dev/{key}" or "https://{bucket}.s3.amazonaws.com/{key}"

# Local Upload Fallback Configuration
LOCAL_UPLOAD_DIR = Path(__file__).parent / "data" / "uploads"
LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
HOST_URL = os.environ.get("HOST_URL", "http://localhost:8000")

def is_s3_configured() -> bool:
    return bool(S3_ENDPOINT_URL and S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY)

def upload_profile_photo(b64_string: str, roll_number: str) -> str:
    """
    Decodes the base64 image, uploads it to S3-compatible storage (or local filesystem fallback),
    and returns the public access URL.
    """
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    
    img_data = base64.b64decode(b64_string)
    filename = f"{roll_number.replace('/', '_')}.jpg"

    if is_s3_configured():
        try:
            # Create S3 client (compatible with R2, Supabase, etc.)
            s3_client = boto3.client(
                's3',
                endpoint_url=S3_ENDPOINT_URL,
                aws_access_key_id=S3_ACCESS_KEY_ID,
                aws_secret_access_key=S3_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4')
            )
            
            # Upload file
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=filename,
                Body=img_data,
                ContentType='image/jpeg'
            )
            
            # Resolve public access URL
            if S3_PUBLIC_URL_TEMPLATE:
                return S3_PUBLIC_URL_TEMPLATE.format(bucket=S3_BUCKET, key=filename)
            else:
                # Fallback template if template is not specified
                if "r2.cloudflarestorage.com" in S3_ENDPOINT_URL:
                    # Cloudflare R2 default format
                    account_id = S3_ENDPOINT_URL.split("//")[1].split(".")[0]
                    return f"https://{S3_BUCKET}.{account_id}.r2.dev/{filename}"
                else:
                    # Standard S3 endpoint format
                    return f"{S3_ENDPOINT_URL.rstrip('/')}/{S3_BUCKET}/{filename}"
        except Exception as e:
            print(f"S3 upload failed: {e}. Falling back to local file storage.")
            # Fallback to local storage if S3 fails
            return _save_locally(img_data, filename)
    else:
        # Save locally in development
        return _save_locally(img_data, filename)

def _save_locally(img_data: bytes, filename: str) -> str:
    filepath = LOCAL_UPLOAD_DIR / filename
    with open(filepath, "wb") as f:
        f.write(img_data)
    
    # Return endpoint path matching FastAPI StaticFiles
    return f"{HOST_URL.rstrip('/')}/static/uploads/{filename}"
