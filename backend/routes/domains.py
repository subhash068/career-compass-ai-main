from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.database import get_db
from models.domain import Domain

router = APIRouter()

@router.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    """
    Get all domains
    """
    domains = db.query(Domain).all()
    return [domain.to_dict() for domain in domains]
