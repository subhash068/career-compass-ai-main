from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
import hashlib
import secrets
import json
import traceback

from models.database import get_db
from models.user import User
from models.certificate import Certificate
from models.learning_path import LearningPath
from models.learning_path import LearningPathStepAssociation
from models.job_role import JobRole

from routes.auth_fastapi import get_current_user

# Try to import QR generator
try:
    from utils.qr_generator import generate_verification_qr
    QR_AVAILABLE = True
    print("QR generator imported successfully")
except ImportError as e:
    QR_AVAILABLE = False
    print(f"QR generator import failed: {e}")
    def generate_verification_qr(verification_url: str):
        return None

# Try to import blockchain service
try:
    from services.blockchain_service import BlockchainService
    BLOCKCHAIN_AVAILABLE = True
    print("Blockchain service imported successfully")
except ImportError as e:
    BLOCKCHAIN_AVAILABLE = False
    BlockchainService = None
    print(f"Blockchain service import failed: {e}")

# Try to import Open Badge service
try:
    from services.open_badge_service import OpenBadgeService
    OPENBADGE_AVAILABLE = True
    print("Open Badge service imported successfully")
except ImportError as e:
    OPENBADGE_AVAILABLE = False
    OpenBadgeService = None
    print(f"Open Badge service import failed: {e}")


router = APIRouter(prefix="/certificate", tags=["Certificate"])


# ============== Pydantic Models ==============

class CertificateGenerateRequest(BaseModel):
    course_duration: Optional[str] = None
    completion_mode: Optional[str] = None
    skills: Optional[List[str]] = None
    final_assessment_score: Optional[float] = None
    performance_grade: Optional[str] = None
    project_completed: bool = False


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate: Optional[dict] = None
    message: str


# ============== Helper Functions ==============

def generate_certificate_id(role_title: str, certificate_id: int, db: Session = None) -> str:
    role_code = "".join([c.upper() for c in role_title if c.isalnum()])[:8]
    year = datetime.utcnow().year
    unique_num = str(certificate_id).zfill(4)
    base_id = f"CCA-{role_code}-{year}-{unique_num}"
    
    if db:
        counter = 0
        final_id = base_id
        while db.query(Certificate).filter(Certificate.certificate_unique_id == final_id).first():
            counter += 1
            final_id = f"CCA-{role_code}-{year}-{unique_num[:2]}{counter:02d}"
        return final_id
    
    return base_id


def generate_certificate_hash(cert_data: dict) -> str:
    data = f"{cert_data['user_id']}:{cert_data['learning_path_id']}:{cert_data['role_title']}:{cert_data['user_name']}:{datetime.utcnow().isoformat()}:{secrets.token_hex(16)}"
    return hashlib.sha256(data.encode()).hexdigest()


def generate_digital_signature(certificate: Certificate) -> str:
    cert_id = certificate.certificate_unique_id or "UNKNOWN"
    cert_hash = certificate.certificate_hash or "UNKNOWN"
    issued = certificate.issued_at.isoformat() if certificate.issued_at else datetime.utcnow().isoformat()
    data = f"{cert_id}:{cert_hash}:{issued}"
    return hashlib.sha256(data.encode()).hexdigest()[:64]


def calculate_performance_grade(score: Optional[float]) -> str:
    if score is None:
        return "N/A"
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    else:
        return "E"


def get_default_course_duration(learning_path: LearningPath) -> str:
    if learning_path.total_duration:
        return learning_path.total_duration
    steps_count = len(learning_path.steps) if learning_path.steps else 10
    hours = steps_count * 12
    return f"{hours} Hours Intensive Training"


def get_skills_from_learning_path(learning_path: LearningPath) -> List[str]:
    skills = []
    if learning_path.steps:
        for assoc in learning_path.steps:
            if assoc.step and assoc.step.skill:
                skills.append(assoc.step.skill.name)
    return skills[:10]


def safe_serialize_cert(certificate: Certificate, include_blockchain: bool = True) -> dict:
    try:
        result = {
            "id": certificate.id,
            "user_id": certificate.user_id,
            "learning_path_id": certificate.learning_path_id,
            "role_title": certificate.role_title,
            "user_name": certificate.user_name,
            "certificate_unique_id": certificate.certificate_unique_id or f"CCA-LEGACY-{certificate.id}",
            "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
            "expiry_date": certificate.expiry_date.isoformat() if certificate.expiry_date else None,
            "course_duration": certificate.course_duration,
            "completion_mode": certificate.completion_mode,
            "skills_covered": certificate.skills_covered,
            "final_assessment_score": certificate.final_assessment_score,
            "performance_grade": certificate.performance_grade,
            "project_completed": certificate.project_completed,
            "certificate_hash": certificate.certificate_hash or "",
            "verification_url": certificate.verification_url or "",
            "qr_code": certificate.qr_code,
            "certificate_url": certificate.certificate_url,
            "digital_signature": certificate.digital_signature,
        }
        
        if include_blockchain:
            result.update({
                "blockchain_network": certificate.blockchain_network,
                "blockchain_tx_id": certificate.blockchain_tx_id,
                "blockchain_hash": certificate.blockchain_hash,
                "blockchain_anchored_at": certificate.blockchain_anchored_at.isoformat() if certificate.blockchain_anchored_at else None,
                "hash_algorithm": certificate.hash_algorithm or "SHA-256",
                "is_anchored": certificate.blockchain_tx_id is not None,
            })
        
        return result
    except Exception as e:
        return {
            "id": certificate.id,
            "user_id": certificate.user_id,
            "learning_path_id": certificate.learning_path_id,
            "role_title": certificate.role_title,
            "user_name": certificate.user_name,
            "error": str(e)
        }


# ============== Certificate Endpoints =============

@router.get("/user")
def get_user_certificates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificates = db.query(Certificate).filter(
            Certificate.user_id == current_user.id
        ).order_by(Certificate.issued_at.desc()).all()
        
        return {
            "certificates": [safe_serialize_cert(cert) for cert in certificates],
            "count": len(certificates)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certificates: {str(e)}")


@router.post("/generate/{path_id}")
def generate_certificate(
    path_id: int,
    request: CertificateGenerateRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        path = db.query(LearningPath).options(
            joinedload(LearningPath.target_role)
        ).filter(
            LearningPath.id == path_id,
            LearningPath.user_id == current_user.id
        ).first()
        
        if not path:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        if path.progress < 100:
            raise HTTPException(
                status_code=400, 
                detail="Cannot generate certificate. Learning path not yet completed."
            )
        
        existing_cert = db.query(Certificate).filter(
            Certificate.learning_path_id == path_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if existing_cert:
            if not existing_cert.qr_code and QR_AVAILABLE:
                existing_cert.qr_code = generate_verification_qr(existing_cert.verification_url)
                db.commit()
                db.refresh(existing_cert)
            return {
                "message": "Certificate already exists",
                "certificate": safe_serialize_cert(existing_cert)
            }
        
        role_title = "Unknown Role"
        try:
            if path.target_role:
                role_title = path.target_role.title or role_title
        except Exception:
            job_role = db.query(JobRole).filter(JobRole.id == path.target_role_id).first()
            if job_role:
                role_title = job_role.title or role_title
        
        skills = []
        try:
            if path.steps:
                for assoc in path.steps:
                    try:
                        if assoc.step and assoc.step.skill:
                            skills.append(assoc.step.skill.name)
                    except Exception:
                        pass
        except Exception:
            pass
        
        if request and request.skills:
            skills = request.skills + skills[:10-len(request.skills)]
        
        course_duration = request.course_duration if request and request.course_duration else get_default_course_duration(path)
        completion_mode = request.completion_mode if request and request.completion_mode else "Online + Project Based"
        assessment_score = request.final_assessment_score if request and request.final_assessment_score else 85.0
        grade = request.performance_grade if request and request.performance_grade else calculate_performance_grade(assessment_score)
        project_completed = request.project_completed if request else True
        
        certificate = Certificate(
            user_id=current_user.id,
            learning_path_id=path_id,
            role_title=role_title,
            user_name=current_user.name,
            course_duration=course_duration,
            completion_mode=completion_mode,
            skills_covered=json.dumps(skills) if skills else None,
            final_assessment_score=assessment_score,
            performance_grade=grade,
            project_completed=project_completed,
            expiry_date=datetime.utcnow() + timedelta(days=365*3),
        )
        
        db.add(certificate)
        db.flush()
        
        certificate.certificate_unique_id = generate_certificate_id(role_title, certificate.id, db)
        certificate.certificate_hash = generate_certificate_hash({
            'user_id': certificate.user_id,
            'learning_path_id': certificate.learning_path_id,
            'role_title': certificate.role_title,
            'user_name': certificate.user_name,
        })
        certificate.verification_url = certificate.generate_verification_url()
        certificate.digital_signature = generate_digital_signature(certificate)
        
        if QR_AVAILABLE:
            try:
                certificate.qr_code = generate_verification_qr(certificate.verification_url)
            except Exception as qr_err:
                print(f"QR generation error: {qr_err}")
                certificate.qr_code = None
        
        db.commit()
        db.refresh(certificate)
        
        return {
            "message": "Certificate generated successfully",
            "certificate": safe_serialize_cert(certificate)
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Certificate generation error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error generating certificate: {str(e)}")


@router.get("/path/{path_id}")
def get_certificate_for_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.learning_path_id == path_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            return {"exists": False, "certificate": None}
        
        return {"exists": True, "certificate": safe_serialize_cert(certificate)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certificate: {str(e)}")


# ============== Open Badge Endpoints (MUST come before generic /{certificate_id}) =============

@router.get("/.well-known/issuer.json")
def get_issuer_metadata():
    """Get issuer metadata for Open Badges 2.0 verification."""
    if not OPENBADGE_AVAILABLE or not OpenBadgeService:
        return {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Issuer",
            "id": "https://careercompass.ai",
            "name": "CareerCompass AI",
            "url": "https://careercompass.ai",
            "email": "badges@careercompass.ai",
            "verification": {"type": "hosted"},
            "error": "Open Badge service not available"
        }
    
    return OpenBadgeService.get_well_known_issuer()


@router.get("/badge/{role_title}")
def get_badge_class(role_title: str, db: Session = Depends(get_db)):
    """Get BadgeClass for a specific role."""
    if not OPENBADGE_AVAILABLE or not OpenBadgeService:
        raise HTTPException(status_code=503, detail="Open Badge service not available")
    
    try:
        import urllib.parse
        role_title = urllib.parse.unquote(role_title)
        badge_class = OpenBadgeService.generate_badge_class(role_title=role_title)
        return badge_class
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating badge class: {str(e)}")


@router.get("/assertions/{certificate_id}")
def get_assertion(certificate_id: str, db: Session = Depends(get_db)):
    """Get Open Badge Assertion for a certificate. Public endpoint."""
    if not OPENBADGE_AVAILABLE or not OpenBadgeService:
        raise HTTPException(status_code=503, detail="Open Badge service not available")
    
    try:
        certificate = db.query(Certificate).filter(
            Certificate.certificate_unique_id == certificate_id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        user = None
        try:
            user = db.query(User).filter_by(id=certificate.user_id).first()
        except Exception:
            pass
        
        assertion = OpenBadgeService.generate_assertion(
            certificate=certificate,
            user=user,
            include_email=False
        )
        
        return assertion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating assertion: {str(e)}")


@router.get("/openbadge/{certificate_id}")
def get_open_badge_package(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete Open Badge package. Requires authentication."""
    if not OPENBADGE_AVAILABLE or not OpenBadgeService:
        raise HTTPException(status_code=503, detail="Open Badge service not available")
    
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        user = db.query(User).filter_by(id=current_user.id).first()
        
        package = OpenBadgeService.generate_full_badge_package(
            certificate=certificate,
            user=user,
            include_email=True
        )
        
        return {
            "message": "Open Badge package retrieved successfully",
            "package": package,
            "open_badge_version": "2.0",
            "compatible_platforms": ["Credly", "Badgr", "LinkedIn"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating badge package: {str(e)}")


@router.get("/openbadge/{certificate_id}/download")
def download_open_badge_json(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download Open Badge JSON file. Requires authentication."""
    if not OPENBADGE_AVAILABLE or not OpenBadgeService:
        raise HTTPException(status_code=503, detail="Open Badge service not available")
    
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        user = db.query(User).filter_by(id=current_user.id).first()
        
        assertion = OpenBadgeService.generate_assertion(
            certificate=certificate,
            user=user,
            include_email=True
        )
        
        return assertion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating badge: {str(e)}")


# ============== Generic Certificate Endpoints (MUST be after specific routes) =============

@router.get("/{certificate_id}")
def get_certificate(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        return safe_serialize_cert(certificate)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certificate: {str(e)}")


# ============== Public Verification Endpoints =============

@router.get("/verify/{certificate_id}")
def verify_certificate_public(certificate_id: str, db: Session = Depends(get_db)):
    """Public endpoint to verify certificate. No authentication required."""
    try:
        certificate = db.query(Certificate).filter(
            Certificate.certificate_unique_id == certificate_id
        ).first()
        
        if not certificate:
            return CertificateVerifyResponse(
                valid=False,
                certificate=None,
                message="Certificate not found."
            )
        
        expected_hash = generate_certificate_hash({
            'user_id': certificate.user_id,
            'learning_path_id': certificate.learning_path_id,
            'role_title': certificate.role_title,
            'user_name': certificate.user_name,
        })
        
        if certificate.certificate_hash != expected_hash:
            return CertificateVerifyResponse(
                valid=False,
                certificate=None,
                message="Certificate integrity check failed."
            )
        
        is_expired = False
        if certificate.expiry_date and certificate.expiry_date < datetime.utcnow():
            is_expired = True
        
        blockchain_verified = False
        blockchain_message = ""
        if certificate.blockchain_tx_id and certificate.blockchain_hash:
            if BlockchainService:
                try:
                    bc_result = BlockchainService.verify_on_blockchain(
                        certificate_hash=certificate.blockchain_hash,
                        certificate_id=certificate.certificate_unique_id or str(certificate.id),
                        network=certificate.blockchain_network or "sepolia"
                    )
                    blockchain_verified = bc_result.get("valid", False)
                    blockchain_message = bc_result.get("message", "")
                except Exception as e:
                    print(f"Blockchain verification error: {e}")
                    blockchain_verified = True
            else:
                blockchain_verified = True
        
        cert_data = safe_serialize_cert(certificate)
        cert_data.update({
            "is_expired": is_expired,
            "recipient_name": certificate.user_name,
            "course_name": f"{certificate.role_title} Professional Certification",
            "blockchain_verified": blockchain_verified,
            "blockchain_message": blockchain_message,
        })
        
        is_valid = True if not is_expired else blockchain_verified
        
        message = "Certificate is valid and verified."
        if is_expired:
            message = "Certificate is valid but has expired."
        if blockchain_verified and certificate.blockchain_tx_id:
            message += " Verified on Blockchain."
        
        return CertificateVerifyResponse(
            valid=is_valid,
            certificate=cert_data,
            message=message
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying certificate: {str(e)}")


@router.post("/verify")
def verify_certificate_with_hash(
    certificate_hash: str = Query(...),
    certificate_id: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.certificate_unique_id == certificate_id,
            Certificate.certificate_hash == certificate_hash
        ).first()
        
        if not certificate:
            return CertificateVerifyResponse(
                valid=False,
                certificate=None,
                message="Certificate verification failed."
            )
        
        return CertificateVerifyResponse(
            valid=True,
            certificate=safe_serialize_cert(certificate),
            message="Certificate verified successfully."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying certificate: {str(e)}")


# ============== Regenerate QR Code =============

@router.post("/regenerate-qr/{certificate_id}")
def regenerate_qr_code(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        if not certificate.verification_url:
            certificate.verification_url = certificate.generate_verification_url()
        
        if QR_AVAILABLE:
            certificate.qr_code = generate_verification_qr(certificate.verification_url)
            db.commit()
            db.refresh(certificate)
            return {
                "message": "QR code regenerated successfully",
                "qr_code": certificate.qr_code is not None,
                "certificate": safe_serialize_cert(certificate)
            }
        else:
            return {
                "message": "QR code generation not available",
                "qr_code": False,
                "certificate": safe_serialize_cert(certificate)
            }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error regenerating QR code: {str(e)}")


# ============== Certificate Details =============

@router.get("/details/{certificate_id}")
def get_certificate_details(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        skills = []
        if certificate.skills_covered:
            try:
                skills = json.loads(certificate.skills_covered)
            except:
                skills = certificate.skills_covered.split(',')
        
        return {
            "certificate": safe_serialize_cert(certificate),
            "skills": skills,
            "verification_url": certificate.verification_url,
            "is_expired": certificate.expiry_date < datetime.utcnow() if certificate.expiry_date else False,
            "is_anchored": certificate.blockchain_tx_id is not None,
            "blockchain_network": certificate.blockchain_network,
            "blockchain_tx_id": certificate.blockchain_tx_id,
            "blockchain_anchored_at": certificate.blockchain_anchored_at.isoformat() if certificate.blockchain_anchored_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching certificate details: {str(e)}")


# ============== Blockchain Anchoring Endpoints =============

@router.post("/anchor/{certificate_id}")
def anchor_certificate_to_blockchain(
    certificate_id: int,
    network: str = Query("sepolia", description="Blockchain network: sepolia, polygon_amoy"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.id == certificate_id,
            Certificate.user_id == current_user.id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        if certificate.blockchain_tx_id:
            return {
                "message": "Certificate already anchored to blockchain",
                "anchored": True,
                "network": certificate.blockchain_network,
                "tx_id": certificate.blockchain_tx_id,
                "anchored_at": certificate.blockchain_anchored_at.isoformat() if certificate.blockchain_anchored_at else None,
                "explorer_url": f"https://{certificate.blockchain_network or 'sepolia'}.etherscan.io/tx/{certificate.blockchain_tx_id}" if certificate.blockchain_network else None,
            }
        
        cert_data = {
            "certificate_id": certificate.certificate_unique_id or f"CCA-LEGACY-{certificate.id}",
            "user_id": certificate.user_id,
            "learning_path_id": certificate.learning_path_id,
            "role_title": certificate.role_title,
            "user_name": certificate.user_name,
            "issued_at": certificate.issued_at.isoformat() if certificate.issued_at else None,
            "skills": certificate.skills_covered,
            "score": certificate.final_assessment_score,
        }
        
        if BlockchainService:
            blockchain_hash = BlockchainService.generate_certificate_hash(cert_data)
        else:
            blockchain_hash = certificate.certificate_hash or generate_certificate_hash(cert_data)
        
        if BlockchainService:
            result = BlockchainService.anchor_certificate(
                certificate_hash=blockchain_hash,
                certificate_id=certificate.certificate_unique_id or str(certificate.id),
                network=network,
                algorithm="SHA-256"
            )
        else:
            import secrets
            result = {
                "success": True,
                "network": network,
                "tx_id": f"0x{secrets.token_hex(32)}",
                "blockchain_hash": blockchain_hash,
                "anchored_at": datetime.utcnow().isoformat(),
                "message": "Certificate anchored (simulated). Configure blockchain for real anchoring.",
                "simulated": True
            }
        
        certificate.blockchain_network = result.get("network", network)
        certificate.blockchain_tx_id = result.get("tx_id")
        certificate.blockchain_hash = result.get("blockchain_hash", blockchain_hash)
        certificate.blockchain_anchored_at = datetime.utcnow()
        certificate.hash_algorithm = "SHA-256"
        
        db.commit()
        db.refresh(certificate)
        
        explorer_base = "https://sepolia.etherscan.io"
        if certificate.blockchain_network == "polygon_amoy":
            explorer_base = "https://amoy.polygonscan.com"
        
        return {
            "message": result.get("message", "Certificate anchored successfully"),
            "anchored": True,
            "network": certificate.blockchain_network,
            "tx_id": certificate.blockchain_tx_id,
            "blockchain_hash": certificate.blockchain_hash,
            "anchored_at": certificate.blockchain_anchored_at.isoformat(),
            "explorer_url": f"{explorer_base}/tx/{certificate.blockchain_tx_id}",
            "simulated": result.get("simulated", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Blockchain anchoring error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error anchoring certificate: {str(e)}")


@router.get("/networks")
def get_available_networks():
    if BlockchainService:
        return {
            "networks": BlockchainService.list_available_networks(),
            "default": "sepolia"
        }
    else:
        return {
            "networks": [
                {"network": "sepolia", "available": False, "message": "Configure RPC URL"},
                {"network": "polygon_amoy", "available": False, "message": "Configure RPC URL"},
            ],
            "default": "sepolia",
            "message": "Blockchain service not available. Install web3 for full functionality."
        }


@router.post("/verify-blockchain/{certificate_id}")
def verify_certificate_on_blockchain(
    certificate_id: str,
    network: str = Query("sepolia", description="Blockchain network"),
    db: Session = Depends(get_db),
):
    try:
        certificate = db.query(Certificate).filter(
            Certificate.certificate_unique_id == certificate_id
        ).first()
        
        if not certificate:
            raise HTTPException(status_code=404, detail="Certificate not found")
        
        if not certificate.blockchain_tx_id:
            return {
                "verified": False,
                "message": "Certificate not anchored to blockchain",
                "certificate_id": certificate_id,
            }
        
        if BlockchainService:
            result = BlockchainService.verify_on_blockchain(
                certificate_hash=certificate.blockchain_hash or certificate.certificate_hash,
                certificate_id=certificate_id,
                network=network
            )
        else:
            result = {
                "valid": True,
                "network": network,
                "message": "Blockchain verification simulated",
                "details": {"simulated": True}
            }
        
        return {
            "verified": result.get("valid", False),
            "message": result.get("message", ""),
            "certificate_id": certificate_id,
            "network": result.get("network", network),
            "blockchain_hash": certificate.blockchain_hash,
            "tx_id": certificate.blockchain_tx_id,
            "anchored_at": certificate.blockchain_anchored_at.isoformat() if certificate.blockchain_anchored_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying on blockchain: {str(e)}")
