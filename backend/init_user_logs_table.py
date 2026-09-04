"""Deprecated compatibility wrapper. This no longer drops existing log data."""

from database import initialize_database

if __name__ == "__main__":
    initialize_database()
    print("V3 prediction logging schema is ready; existing data was preserved.")
