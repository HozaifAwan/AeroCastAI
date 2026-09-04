"""Manual email smoke test. Requires environment credentials and explicit recipient."""

import argparse

from notifications import send_email


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("email", help="Recipient for this explicit manual test")
    args = parser.parse_args()
    send_email(
        args.email,
        "AeroCastAI email test",
        "Email delivery is configured. This is a manual test, not a weather alert.",
    )
    print("Email provider accepted the test message.")


if __name__ == "__main__":
    main()
