"""Bootstrap/CLI helper to promote or verify an admin account in the database."""

import sys
from app.db.session import SessionLocal
from app.models.user import User, ADMIN_ROLE

def main():
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if not user:
            print(f"Error: User with email '{email}' not found.")
            print("Existing users in database:")
            for u in db.query(User).all():
                print(f" - {u.email} (role: {u.role})")
            sys.exit(1)

        user.role = ADMIN_ROLE
        db.commit()
        print(f"Success: User '{email}' promoted to {ADMIN_ROLE}!")
    finally:
        db.close()

if __name__ == "__main__":
    main()

