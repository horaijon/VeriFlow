import sqlite3
import time

DB_PATH = "veriflow.db"

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS otp_codes (
                email TEXT PRIMARY KEY,
                otp TEXT NOT NULL,
                expires_at REAL NOT NULL
            )
        """)
        conn.commit()

def store_otp(email: str, otp: str, expires_in_minutes: int = 5):
    expires_at = time.time() + (expires_in_minutes * 60)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO otp_codes (email, otp, expires_at) VALUES (?, ?, ?) "
            "ON CONFLICT(email) DO UPDATE SET otp=excluded.otp, expires_at=excluded.expires_at",
            (email, otp, expires_at)
        )
        conn.commit()

def verify_and_delete_otp(email: str, otp: str) -> bool:
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("SELECT otp, expires_at FROM otp_codes WHERE email = ?", (email,))
        row = cursor.fetchone()
        if not row:
            return False
        
        stored_otp, expires_at = row
        if stored_otp == otp and time.time() < expires_at:
            conn.execute("DELETE FROM otp_codes WHERE email = ?", (email,))
            conn.execute("INSERT OR IGNORE INTO users (email) VALUES (?)", (email,))
            conn.commit()
            return True
        return False
