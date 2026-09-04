from mailjet_rest import Client

from config import settings


def send_email(to_email: str, subject: str, text: str) -> None:
    if not settings.mailjet_api_key or not settings.mailjet_api_secret:
        raise RuntimeError("Email service is not configured.")
    result = Client(
        auth=(settings.mailjet_api_key, settings.mailjet_api_secret), version="v3.1"
    ).send.create(data={
        "Messages": [{
            "From": {"Email": settings.mailjet_from_email, "Name": "AeroCastAI"},
            "To": [{"Email": to_email, "Name": "AeroCastAI User"}],
            "Subject": subject,
            "TextPart": text,
        }]
    })
    if result.status_code >= 400:
        raise RuntimeError(f"Email provider returned HTTP {result.status_code}")
