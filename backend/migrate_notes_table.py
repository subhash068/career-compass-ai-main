"""
Migration script to create user_notes table
"""
import sys
import os

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from models.database import Base, engine, DATABASE_URL
from models.user_note import UserNote

def migrate():
    """Create user_notes table"""
    print("=" * 60)
    print("Creating user_notes table...")
    print("=" * 60)
    
    try:
        # Create the table
        UserNote.__table__.create(engine, checkfirst=True)
        print("✅ user_notes table created successfully!")
        
        # Verify table was created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if 'user_notes' in tables:
            print("✅ Table verified in database")
            
            # Show table columns
            columns = inspector.get_columns('user_notes')
            print("\nTable columns:")
            for col in columns:
                print(f"  - {col['name']}: {col['type']}")
            
            # Show indexes
            indexes = inspector.get_indexes('user_notes')
            print("\nTable indexes:")
            for idx in indexes:
                print(f"  - {idx['name']}: {', '.join(idx['column_names'])}")
        else:
            print("❌ Table not found in database")
            
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("Migration completed!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
