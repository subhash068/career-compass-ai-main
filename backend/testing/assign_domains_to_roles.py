"""
Script to assign domains to existing job roles based on their titles.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal
from models.job_role import JobRole
from models.domain import Domain

def assign_domains():
    db = SessionLocal()
    
    try:
        # Get all domains
        domains = {d.name.lower(): d.id for d in db.query(Domain).all()}
        print(f"Found domains: {domains}")
        
        # Define role to domain mappings
        role_domain_mappings = {
            'frontend': ['frontend', 'front-end', 'front end', 'ui', 'ux', 'react', 'angular', 'vue'],
            'backend': ['backend', 'back-end', 'back end', 'api', 'server', 'node', 'python', 'java', 'go'],
            'full stack': ['full stack', 'fullstack', 'full-stack', 'web developer'],
            'devops': ['devops', 'dev-ops', 'sre', 'site reliability', 'infrastructure', 'cloud', 'aws', 'azure', 'gcp'],
            'qa': ['qa', 'quality assurance', 'test', 'testing', 'automation', 'selenium'],
            'ai/ml': ['ai', 'ml', 'machine learning', 'artificial intelligence', 'data scientist', 'deep learning', 'nlp'],
            'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin'],
            'security': ['security', 'cybersecurity', 'penetration', 'ethical hacker', 'security engineer'],
            'data': ['data engineer', 'data analyst', 'database', 'sql', 'etl', 'big data'],
        }
        
        # Get all job roles
        roles = db.query(JobRole).all()
        print(f"\nFound {len(roles)} job roles")
        
        updated_count = 0
        
        for role in roles:
            role_title_lower = role.title.lower()
            assigned_domain = None
            
            # Find matching domain
            for domain_name, keywords in role_domain_mappings.items():
                if any(keyword in role_title_lower for keyword in keywords):
                    assigned_domain = domain_name
                    break
            
            # Update role if domain found
            if assigned_domain and assigned_domain in domains:
                role.domain_id = domains[assigned_domain]
                print(f"✓ {role.title} → {assigned_domain} (ID: {domains[assigned_domain]})")
                updated_count += 1
            else:
                print(f"- {role.title} → No domain match")
        
        db.commit()
        print(f"\n=== Updated {updated_count} job roles with domains ===")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    assign_domains()
