from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError


def _client():
    return boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION", "us-east-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID") or None,
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY") or None,
        endpoint_url=os.getenv("S3_ENDPOINT") or None,
    )


def check_s3() -> Tuple[bool, str]:
    bucket = os.getenv("S3_BUCKET", "")
    if not bucket:
        return False, "S3_BUCKET not set"
    try:
        _client().head_bucket(Bucket=bucket)
        return True, f"bucket {bucket} reachable"
    except (BotoCoreError, ClientError) as exc:
        return False, str(exc)


def list_recent_objects(limit: int = 10) -> List[Dict[str, Any]]:
    bucket = os.getenv("S3_BUCKET", "")
    if not bucket:
        return []

    resp = _client().list_objects_v2(Bucket=bucket, MaxKeys=limit)
    contents = resp.get("Contents", [])
    rows: List[Dict[str, Any]] = []
    for obj in contents:
        last_modified = obj.get("LastModified")
        if isinstance(last_modified, datetime):
            last_modified = last_modified.astimezone(timezone.utc).isoformat()
        rows.append(
            {
                "key": obj.get("Key"),
                "size": obj.get("Size"),
                "last_modified": last_modified,
            }
        )
    return rows
