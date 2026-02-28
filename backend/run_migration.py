#!/usr/bin/env python
"""Run database migrations"""
import sys
sys.path.insert(0, '.')

from alembic.config import Config
from alembic import command

def run_migrations():
    try:
        cfg = Config('alembic.ini')
        command.upgrade(cfg, 'head')
        print("Migrations completed successfully!")
    except Exception as e:
        print(f"Error running migrations: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_migrations()
