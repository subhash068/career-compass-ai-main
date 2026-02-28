"""
Open Badge Service for Mozilla Open Badges 2.0 Compatible Format

This service generates Open Badge JSON structures for certificates,
making them globally compatible with platforms like Credly, Badgr, and LinkedIn.

Open Badges 2.0 Specification: https://1edtech.github.io/openbadges-specification/
"""

import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional, List

from models.certificate import Certificate
from models.user import User


class OpenBadgeService:
    """Service for generating Open Badge 2.0 compatible certificates"""

    # Base URL for CareerCompass AI
    BASE_URL = "https://careercompass.ai"
    ISSUER_URL = f"{BASE_URL}"
    ISSUER_NAME = "CareerCompass AI"
    ISSUER_EMAIL = "badges@careercompass.ai"

    # BadgeClass defaults
    DEFAULT_IMAGE_URL = f"{BASE_URL}/images/badge-default.png"
    DEFAULT_CRITERIA_URL = f"{BASE_URL}/criteria"

    @staticmethod
    def _generate_role_badge_class_id(role_title: str) -> str:
        """Generate a URL-safe badge class ID from role title"""
        # Convert role title to lowercase, replace spaces with hyphens, remove special chars
        clean_role = "".join(c.lower() if c.isalnum() or c == '-' else '-' for c in role_title)
        clean_role = clean_role.strip('-')
        return f"{OpenBadgeService.BASE_URL}/badge/{clean_role}.json"

    @staticmethod
    def _get_role_criteria(role_title: str) -> str:
        """Get criteria URL for a specific role"""
        role_slug = "".join(c.lower() if c.isalnum() else '-' for c in role_title)
        role_slug = role_slug.strip('-')
        return f"{OpenBadgeService.BASE_URL}/criteria/{role_slug}"

    @staticmethod
    def _hash_email(email: str) -> str:
        """
        Hash email using SHA-256 for privacy.
        Open Badges uses this format: sha256$<hash>
        """
        if not email:
            return None
        
        # Normalize email (lowercase, strip whitespace)
        normalized_email = email.lower().strip()
        
        # Create SHA-256 hash
        hash_obj = hashlib.sha256(normalized_email.encode('utf-8'))
        email_hash = hash_obj.hexdigest()
        
        # Return in Open Badges format
        return f"sha256${email_hash}"

    @staticmethod
    def generate_issuer() -> Dict[str, Any]:
        """
        Generate the Issuer JSON-LD object for Open Badges.
        This represents CareerCompass AI as the issuing organization.
        """
        return {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Issuer",
            "id": OpenBadgeService.ISSUER_URL,
            "name": OpenBadgeService.ISSUER_NAME,
            "url": OpenBadgeService.ISSUER_URL,
            "email": OpenBadgeService.ISSUER_EMAIL,
            "description": "CareerCompass AI - AI-Powered Career Development Platform",
            "verification": {
                "type": "hosted"
            }
        }

    @staticmethod
    def generate_badge_class(
        role_title: str,
        description: Optional[str] = None,
        skills: Optional[List[str]] = None,
        criteria_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a BadgeClass JSON object for a specific role/certification.
        
        The BadgeClass defines the criteria and metadata for a type of badge.
        """
        badge_class_id = OpenBadgeService._generate_role_badge_class_id(role_title)
        
        if criteria_url is None:
            criteria_url = OpenBadgeService._get_role_criteria(role_title)
        
        # Build description if not provided
        if description is None:
            description = "Professional certification for " + role_title + " role. " \
                         "Holder has demonstrated competency in required skills through " \
                         "completion of AI-powered learning path and assessments."
        
        # Build skills text
        skills_text = ""
        if skills and len(skills) > 0:
            skills_text = " Skills covered: " + ", ".join(skills[:5])
            if len(skills) > 5:
                skills_text += " and " + str(len(skills) - 5) + " more."
        
        return {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "BadgeClass",
            "id": badge_class_id,
            "name": role_title + " Professional Certification",
            "description": description + skills_text,
            "image": OpenBadgeService.DEFAULT_IMAGE_URL,
            "criteria": {
                "type": "Criteria",
                "id": criteria_url,
                "narrative": "The recipient has successfully completed all required "
                           "learning modules and assessments for the " + role_title + " "
                           "professional certification track. This includes demonstrating "
                           "proficiency in all required skills through practical "
                           "assessments and completing a final capstone project."
            },
            "issuer": OpenBadgeService.ISSUER_URL,
            "tags": [
                "career",
                "professional",
                "certification",
                "careercompass",
                role_title.lower().replace(" ", "-")
            ],
            "alignment": [
                {
                    "targetName": role_title,
                    "targetUrl": OpenBadgeService.BASE_URL + "/roles/" + role_title.lower().replace(" ", "-"),
                    "targetDescription": "Professional certification for " + role_title + " role"
                }
            ],
            "validityPeriod": {
                "type": "ValidityPeriod",
                "months": 36
            }
        }

    @staticmethod
    def generate_assertion(
        certificate: Certificate,
        user: Optional[User] = None,
        include_email: bool = False
    ) -> Dict[str, Any]:
        """
        Generate an Assertion JSON object for a specific certificate.
        
        The Assertion links a recipient to a BadgeClass and provides
        evidence of completion.
        """
        # Generate assertion ID
        assertion_id = OpenBadgeService.BASE_URL + "/assertions/" + str(certificate.certificate_unique_id)
        
        # Get badge class ID
        badge_class_id = OpenBadgeService._generate_role_badge_class_id(certificate.role_title)
        
        # Prepare recipient data
        recipient_data = {
            "type": "email"
        }
        
        if include_email and user and user.email:
            recipient_data["hashed"] = False
            recipient_data["identity"] = user.email
        elif user and user.email:
            # Hash the email for privacy
            recipient_data["hashed"] = True
            recipient_data["identity"] = OpenBadgeService._hash_email(user.email)
        else:
            # Use certificate ID as fallback identity
            recipient_data["hashed"] = False
            recipient_data["identity"] = str(certificate.certificate_unique_id)
        
        # Parse skills if available
        skills = []
        if certificate.skills_covered:
            try:
                skills = json.loads(certificate.skills_covered)
            except (json.JSONDecodeError, TypeError):
                skills = str(certificate.skills_covered).split(',')
        
        # Build evidence URL
        evidence_url = OpenBadgeService.BASE_URL + "/certificate/" + str(certificate.certificate_unique_id)
        
        # Build verification object
        verification = {
            "type": "HostedBadge"
        }
        
        # If blockchain anchored, add verification
        if certificate.blockchain_tx_id:
            verification = {
                "type": "HostedBadge",
                "anchored": True,
                "blockchain": certificate.blockchain_network or "sepolia",
                "txId": certificate.blockchain_tx_id
            }
        
        # Build narrative
        narrative = "Successfully completed " + certificate.role_title + " professional " \
                    "certification with performance grade: " + str(certificate.performance_grade or "N/A") + ". " \
                    "Final assessment score: " + str(certificate.final_assessment_score or "N/A") + "%. " \
                    "Project completed: " + ("Yes" if certificate.project_completed else "No") + "."
        
        # Build assertion
        assertion = {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Assertion",
            "id": assertion_id,
            "recipient": recipient_data,
            "badge": badge_class_id,
            "verification": verification,
            "issuedOn": certificate.issued_at.isoformat() if certificate.issued_at else datetime.utcnow().isoformat(),
            "evidence": [
                {
                    "type": "Evidence",
                    "id": evidence_url,
                    "narrative": narrative
                }
            ]
        }
        
        # Add expiry if available
        if certificate.expiry_date:
            assertion["expires"] = certificate.expiry_date.isoformat()
        
        # Add verification URL
        if certificate.verification_url:
            assertion["verify"] = {
                "type": "hosted",
                "url": certificate.verification_url
            }
        
        return assertion

    @staticmethod
    def generate_full_badge_package(
        certificate: Certificate,
        user: Optional[User] = None,
        include_email: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a complete Open Badge package including:
        - Issuer
        - BadgeClass  
        - Assertion
        """
        # Parse skills
        skills = []
        if certificate.skills_covered:
            try:
                skills = json.loads(certificate.skills_covered)
            except (json.JSONDecodeError, TypeError):
                skills = str(certificate.skills_covered).split(',')
        
        return {
            "issuer": OpenBadgeService.generate_issuer(),
            "badgeClass": OpenBadgeService.generate_badge_class(
                role_title=certificate.role_title,
                skills=skills
            ),
            "assertion": OpenBadgeService.generate_assertion(
                certificate=certificate,
                user=user,
                include_email=include_email
            )
        }

    @staticmethod
    def validate_open_badge_structure(badge_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate that a badge structure follows Open Badges 2.0 specification.
        Returns validation result with any errors.
        """
        errors = []
        warnings = []
        
        # Check for required fields in Assertion
        assertion = badge_data.get("assertion", {})
        
        required_assertion_fields = ["@context", "type", "id", "recipient", "badge", "verification", "issuedOn"]
        for field in required_assertion_fields:
            if field not in assertion:
                errors.append("Missing required assertion field: " + field)
        
        # Check type is Assertion
        if assertion.get("type") != "Assertion":
            errors.append("Assertion type must be 'Assertion'")
        
        # Check context
        if assertion.get("@context") != "https://w3id.org/openbadges/v2":
            warnings.append("Context should be 'https://w3id.org/openbadges/v2'")
        
        # Check recipient has required fields
        recipient = assertion.get("recipient", {})
        if "identity" not in recipient:
            errors.append("Recipient must have 'identity' field")
        
        # Check badge is a valid URL
        badge_url = assertion.get("badge", "")
        if not badge_url or not badge_url.startswith("http"):
            errors.append("Badge must be a valid URL")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    @staticmethod
    def get_well_known_issuer() -> Dict[str, Any]:
        """
        Generate the /.well-known/issuer.json endpoint response.
        This is used for issuer verification in Open Badges.
        """
        return {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Issuer",
            "id": OpenBadgeService.ISSUER_URL,
            "name": OpenBadgeService.ISSUER_NAME,
            "url": OpenBadgeService.ISSUER_URL,
            "email": OpenBadgeService.ISSUER_EMAIL,
            "description": "CareerCompass AI - AI-Powered Career Development Platform providing professional certifications",
            "verification": {
                "type": "hosted"
            },
            "issuerOrganization": {
                "name": OpenBadgeService.ISSUER_NAME,
                "url": OpenBadgeService.ISSUER_URL
            }
        }
