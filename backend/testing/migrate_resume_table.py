"""
Migration script to create resumes table using SQLAlchemy ORM
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def create_resumes_table():
    """Create the resumes table using SQLAlchemy ORM"""
    
    try:
        # Import all models to ensure they're registered with Base
        from models.database import Base, engine, create_tables
        from models.user import User  # Import User first to ensure users table exists
        from models.resume import Resume  # Import Resume to register it
        
        print("📦 Importing models...")
        
        # Create all tables (including resumes)
        print("🔨 Creating tables...")
        create_tables()
        
        print("✅ Successfully created 'resumes' table")
        
        # Verify table was created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        if 'resumes' in inspector.get_table_names():
            print("✅ Table 'resumes' verified in database")
            
            # Get column info
            columns = inspector.get_columns('resumes')
            print(f"\n📊 Table structure:")
            print(f"   - Total columns: {len(columns)}")
            for col in columns:
                print(f"   - {col['name']}: {col['type']}")
            
            # Get index info
            indexes = inspector.get_indexes('resumes')
            print(f"\n📈 Indexes created: {len(indexes)}")
            for idx in indexes:
                print(f"   - {idx['name']}: {', '.join(idx['column_names'])}")
                
        return True
        
    except Exception as e:
        print(f"❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Resume Table Migration")
    print("=" * 60)
    
    success = create_resumes_table()
    
    if success:
        print("\n✅ Migration completed successfully!")
        print("\nYou can now use the Resume Builder and ATS Checker features.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
