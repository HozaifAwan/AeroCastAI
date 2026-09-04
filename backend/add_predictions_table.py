"""Deprecated compatibility wrapper; use the V3 database initializer."""

from database import initialize_database

if __name__ == "__main__":
    initialize_database()
    print("V3 prediction logging schema is ready.")
