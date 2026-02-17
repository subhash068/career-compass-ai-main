"""
Resume Service
Handles resume parsing and ATS (Applicant Tracking System) analysis
"""
import re
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from models.resume import Resume
from models.user import User


class ResumeService:
    """
    Service for resume operations and ATS analysis
    """
    
    # ATS Keywords for different job categories
    ATS_KEYWORDS = {
        "technical": [
            "python", "javascript", "java", "react", "node.js", "sql", "aws",
            "docker", "kubernetes", "git", "agile", "scrum", "ci/cd", "api",
            "rest", "graphql", "mongodb", "postgresql", "redis", "linux",
            "machine learning", "data analysis", "cloud", "devops", "frontend",
            "backend", "full stack", "microservices", "testing", "automation"
        ],
        "soft_skills": [
            "leadership", "communication", "teamwork", "problem solving",
            "critical thinking", "time management", "adaptability", "creativity",
            "collaboration", "project management", "analytical", "detail-oriented"
        ],
        "sections": [
            "experience", "education", "skills", "summary", "objective",
            "certifications", "projects", "achievements", "contact"
        ]
    }
    
    @staticmethod
    def create_resume(
        db: Session,
        user_id: int,
        title: str,
        personal_info: Dict[str, Any],
        summary: Optional[str] = None,
        experience: Optional[List[Dict]] = None,
        education: Optional[List[Dict]] = None,
        skills: Optional[List[str]] = None,
        certifications: Optional[List[Dict]] = None,
        projects: Optional[List[Dict]] = None
    ) -> Resume:
        """
        Create a new resume for a user
        """
        resume = Resume(
            user_id=user_id,
            title=title,
            personal_info=personal_info,
            summary=summary,
            experience=experience or [],
            education=education or [],
            skills=skills or [],
            certifications=certifications or [],
            projects=projects or []
        )
        
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    
    @staticmethod
    def update_resume(
        db: Session,
        resume_id: int,
        user_id: int,
        **kwargs
    ) -> Optional[Resume]:
        """
        Update an existing resume
        """
        resume = Resume.find_by_id(db, resume_id, user_id)
        if not resume:
            return None
        
        # Update fields
        for key, value in kwargs.items():
            if hasattr(resume, key) and value is not None:
                setattr(resume, key, value)
        
        db.commit()
        db.refresh(resume)
        return resume
    
    @staticmethod
    def delete_resume(db: Session, resume_id: int, user_id: int) -> bool:
        """
        Delete a resume
        """
        resume = Resume.find_by_id(db, resume_id, user_id)
        if not resume:
            return False
        
        db.delete(resume)
        db.commit()
        return True
    
    @staticmethod
    def get_user_resumes(db: Session, user_id: int) -> List[Resume]:
        """
        Get all resumes for a user
        """
        return Resume.find_by_user(db, user_id)
    
    @staticmethod
    def parse_resume_file(file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Parse uploaded resume file (PDF or DOCX)
        Returns extracted text and metadata
        """
        text_content = ""
        file_type = filename.lower().split('.')[-1] if '.' in filename else ''
        
        try:
            if file_type == 'pdf':
                text_content = ResumeService._parse_pdf(file_content)
            elif file_type in ['docx', 'doc']:
                text_content = ResumeService._parse_docx(file_content)
            else:
                # Try to decode as text
                try:
                    text_content = file_content.decode('utf-8')
                except:
                    text_content = file_content.decode('latin-1', errors='ignore')
            
            return {
                "success": True,
                "text": text_content,
                "file_type": file_type,
                "filename": filename
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "text": "",
                "file_type": file_type,
                "filename": filename
            }
    
    @staticmethod
    def _parse_pdf(file_content: bytes) -> str:
        """
        Parse PDF file content
        """
        try:
            from PyPDF2 import PdfReader
            import io
            
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
        except ImportError:
            # Fallback if PyPDF2 is not installed
            return "[PDF parsing requires PyPDF2 library]"
        except Exception as e:
            return f"[Error parsing PDF: {str(e)}]"
    
    @staticmethod
    def _parse_docx(file_content: bytes) -> str:
        """
        Parse DOCX file content
        """
        try:
            from docx import Document
            import io
            
            doc_file = io.BytesIO(file_content)
            doc = Document(doc_file)
            
            text = []
            for para in doc.paragraphs:
                text.append(para.text)
            
            return "\n".join(text).strip()
        except ImportError:
            # Fallback if python-docx is not installed
            return "[DOCX parsing requires python-docx library]"
        except Exception as e:
            return f"[Error parsing DOCX: {str(e)}]"
    
    @staticmethod
    def analyze_ats_score(resume_text: str, job_description: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze resume for ATS compatibility
        Returns detailed scoring and recommendations
        """
        if not resume_text:
            return {
                "overall_score": 0,
                "sections": {},
                "keywords": {},
                "formatting": {},
                "suggestions": ["No content to analyze"]
            }
        
        # Normalize text
        text_lower = resume_text.lower()
        
        # Analyze different aspects
        sections_score = ResumeService._analyze_sections(text_lower)
        keywords_score = ResumeService._analyze_keywords(text_lower, job_description)
        formatting_score = ResumeService._analyze_formatting(resume_text)
        
        # Calculate overall score
        overall_score = (
            sections_score["score"] * 0.3 +
            keywords_score["score"] * 0.4 +
            formatting_score["score"] * 0.3
        )
        
        # Generate suggestions
        suggestions = ResumeService._generate_suggestions(
            sections_score, keywords_score, formatting_score
        )
        
        return {
            "overall_score": round(overall_score, 1),
            "sections_analysis": sections_score,
            "keywords_analysis": keywords_score,
            "formatting_analysis": formatting_score,
            "suggestions": suggestions,
            "word_count": len(resume_text.split()),
            "analyzed_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def _analyze_sections(text: str) -> Dict[str, Any]:
        """
        Analyze if resume has required sections
        """
        required_sections = {
            "contact_info": ["email", "phone", "address", "linkedin"],
            "summary": ["summary", "objective", "profile", "about"],
            "experience": ["experience", "work", "employment", "career"],
            "education": ["education", "degree", "university", "college"],
            "skills": ["skills", "technologies", "competencies"]
        }
        
        found_sections = {}
        missing_sections = []
        
        for section, keywords in required_sections.items():
            found = any(keyword in text for keyword in keywords)
            found_sections[section] = found
            if not found:
                missing_sections.append(section)
        
        score = (len([s for s in found_sections.values() if s]) / len(required_sections)) * 100
        
        return {
            "score": score,
            "found": found_sections,
            "missing": missing_sections,
            "total_required": len(required_sections),
            "found_count": len([s for s in found_sections.values() if s])
        }
    
    @staticmethod
    def _analyze_keywords(text: str, job_description: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze keyword presence and relevance
        """
        found_technical = []
        found_soft_skills = []
        
        # Check technical keywords
        for keyword in ResumeService.ATS_KEYWORDS["technical"]:
            if keyword in text:
                found_technical.append(keyword)
        
        # Check soft skills
        for skill in ResumeService.ATS_KEYWORDS["soft_skills"]:
            if skill in text:
                found_soft_skills.append(skill)
        
        # Calculate scores
        technical_score = (len(found_technical) / len(ResumeService.ATS_KEYWORDS["technical"])) * 100
        soft_skills_score = (len(found_soft_skills) / len(ResumeService.ATS_KEYWORDS["soft_skills"])) * 100
        
        # Job description matching
        job_match_score = 0
        missing_job_keywords = []
        
        if job_description:
            job_lower = job_description.lower()
            job_keywords = [word for word in job_lower.split() if len(word) > 3]
            matched = [kw for kw in job_keywords if kw in text]
            job_match_score = (len(matched) / len(job_keywords)) * 100 if job_keywords else 0
            missing_job_keywords = [kw for kw in job_keywords[:20] if kw not in text][:10]
        
        overall_score = (technical_score * 0.5 + soft_skills_score * 0.3 + job_match_score * 0.2)
        
        return {
            "score": min(overall_score, 100),
            "technical_keywords": {
                "found": found_technical,
                "count": len(found_technical),
                "total": len(ResumeService.ATS_KEYWORDS["technical"])
            },
            "soft_skills": {
                "found": found_soft_skills,
                "count": len(found_soft_skills),
                "total": len(ResumeService.ATS_KEYWORDS["soft_skills"])
            },
            "job_match": {
                "score": job_match_score,
                "missing_keywords": missing_job_keywords
            } if job_description else None
        }
    
    @staticmethod
    def _analyze_formatting(text: str) -> Dict[str, Any]:
        """
        Analyze formatting issues that affect ATS parsing
        """
        issues = []
        score = 100
        
        # Check for tables (simplified detection)
        if "|" in text or "table" in text.lower():
            issues.append("Tables detected - may not parse correctly in ATS")
            score -= 15
        
        # Check for images (simplified)
        if "[image" in text.lower() or "img" in text.lower():
            issues.append("Images detected - ATS cannot read image content")
            score -= 20
        
        # Check for special characters
        special_chars = len([c for c in text if ord(c) > 127])
        if special_chars > 10:
            issues.append("Special characters detected - may cause parsing issues")
            score -= 10
        
        # Check length
        word_count = len(text.split())
        if word_count < 200:
            issues.append("Resume appears too short - consider adding more detail")
            score -= 10
        elif word_count > 1000:
            issues.append("Resume appears very long - consider condensing")
            score -= 5
        
        # Check for headers/sections
        has_headers = any(line.isupper() for line in text.split('\n') if len(line) > 3)
        if not has_headers:
            issues.append("No clear section headers found - use ALL CAPS for section titles")
            score -= 10
        
        return {
            "score": max(score, 0),
            "word_count": word_count,
            "issues": issues,
            "has_clear_headers": has_headers
        }
    
    @staticmethod
    def _generate_suggestions(sections: Dict, keywords: Dict, formatting: Dict) -> List[str]:
        """
        Generate improvement suggestions based on analysis
        """
        suggestions = []
        
        # Section suggestions
        if sections.get("missing"):
            for section in sections["missing"]:
                suggestions.append(f"Add a '{section.replace('_', ' ').title()}' section")
        
        # Keyword suggestions
        tech_keywords = keywords.get("technical_keywords", {})
        if tech_keywords.get("count", 0) < 5:
            suggestions.append("Add more technical skills relevant to your target role")
        
        soft_skills = keywords.get("soft_skills", {})
        if soft_skills.get("count", 0) < 3:
            suggestions.append("Include soft skills like leadership, communication, or teamwork")
        
        # Formatting suggestions
        for issue in formatting.get("issues", []):
            suggestions.append(issue)
        
        # General suggestions
        if not suggestions:
            suggestions.append("Your resume looks good! Consider tailoring it to specific job descriptions.")
        
        return suggestions[:10]  # Limit to top 10 suggestions
    
    @staticmethod
    def extract_resume_data(parsed_text: str) -> Dict[str, Any]:
        """
        Attempt to extract structured data from parsed resume text
        """
        data = {
            "personal_info": {},
            "summary": "",
            "experience": [],
            "education": [],
            "skills": []
        }
        
        lines = parsed_text.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect sections
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in ["experience", "work history", "employment"]):
                current_section = "experience"
                continue
            elif any(keyword in line_lower for keyword in ["education", "academic"]):
                current_section = "education"
                continue
            elif any(keyword in line_lower for keyword in ["skills", "technologies", "competencies"]):
                current_section = "skills"
                continue
            elif any(keyword in line_lower for keyword in ["summary", "objective", "profile"]):
                current_section = "summary"
                continue
            
            # Extract data based on current section
            if current_section == "summary":
                data["summary"] += line + " "
            elif current_section == "skills":
                # Parse skills (comma or bullet separated)
                skills = [s.strip() for s in re.split(r'[,•\-]', line) if s.strip()]
                data["skills"].extend(skills)
        
        data["summary"] = data["summary"].strip()
        data["skills"] = list(set(data["skills"]))  # Remove duplicates
        
        return data
