import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Calendar, 
  Share2, 
  X, 
  CheckCircle2,
  Shield,
  Medal,
  Globe,
  FileCheck,
  Link,
  Award,
  RefreshCw,
  BadgeCheck,
  ExternalLink
} from 'lucide-react';


import type { Certificate } from '@/types';
import { certificateApi } from '@/api/certificate.api';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


// Official Career Compass AI Logo SVG
const CareerCompassLogo = ({ size = 56 }: { size?: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 64 64" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fef3c7" />
      </linearGradient>
    </defs>
    {/* Outer Circle */}
    <circle cx="32" cy="32" r="30" fill="url(#logoGradient)" />
    {/* Inner Circle */}
    <circle cx="32" cy="32" r="24" fill="white" />
    {/* Compass Needle North */}
    <path d="M32 12 L36 32 L32 28 L28 32 Z" fill="#f59e0b" />
    {/* Compass Needle South */}
    <path d="M32 52 L36 32 L32 36 L28 32 Z" fill="#d97706" />
    {/* Compass Center */}
    <circle cx="32" cy="32" r="4" fill="url(#logoGradient)" />
    {/* Compass Ring */}
    <circle cx="32" cy="32" r="20" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
    {/* Direction Markers */}
    <circle cx="32" cy="16" r="2" fill="#f59e0b" />
    <circle cx="32" cy="48" r="2" fill="#d97706" />
    <circle cx="16" cy="32" r="2" fill="#d97706" />
    <circle cx="48" cy="32" r="2" fill="#d97706" />
  </svg>
);

// Digital Seal Badge Component
const DigitalSealBadge = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px'
  }}>
    <div style={{
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #92400e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
      border: '3px solid #fbbf24'
    }}>
      <Award size={36} color="white" fill="white" />
    </div>
    <span style={{
      fontSize: '8px',
      fontWeight: 'bold',
      color: '#92400e',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    }}>
      Verified
    </span>
  </div>
);


// QR Code Component (if available)
const QRCodeDisplay = ({ qrCode, verificationUrl }: { qrCode?: string; verificationUrl?: string }) => {
  if (qrCode) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px'
      }}>
        <img 
          src={qrCode} 
          alt="Verification QR Code" 
          style={{
            width: '80px',
            height: '80px',
            border: '2px solid #f59e0b',
            borderRadius: '4px',
            background: 'white'
          }}
        />
        <span style={{
          fontSize: '7px',
          color: '#6b7280',
          fontWeight: '600'
        }}>
          Scan to Verify
        </span>
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        border: '2px dashed #d1d5db',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb'
      }}>
        <Link size={24} color="#9ca3af" />
      </div>
      <span style={{
        fontSize: '7px',
        color: '#6b7280',
        fontWeight: '600'
      }}>
        {verificationUrl ? verificationUrl.replace('https://careercompass.ai', '') : '/verify/...'}
      </span>
    </div>
  );
};

interface CertificateDisplayProps {
  certificate: Certificate;
  onClose?: () => void;
}

// Parse skills from JSON string
const parseSkills = (skillsData: string | undefined): string[] => {
  if (!skillsData) return [];
  try {
    return JSON.parse(skillsData);
  } catch {
    return skillsData.split(',').map(s => s.trim());
  }
};

// Format date professionally
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Generate certificate ID format
const generateCertificateIdDisplay = (cert: Certificate) => {
  return cert.certificate_unique_id || `CCA-${cert.id.toString().padStart(6, '0')}-${new Date().getFullYear()}`;
};

// Certificate content component for both display and PDF
function CertificateContent({ certificate, className = '' }: { certificate: Certificate; className?: string }) {
  const skills = parseSkills(certificate.skills_covered);
  
  return (
    <div className={className} style={{ 
      width: '800px', 
      minHeight: '560px',
      padding: '40px', 
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fde68a 100%)',
      fontFamily: "'Georgia', 'Times New Roman', serif",
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Watermark Background Logo */}
      <div style={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        opacity: 0.06,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <CareerCompassLogo size={350} />
      </div>

      {/* Border decoration */}
      <div style={{ 
        position: 'absolute', 
        top: '12px', 
        left: '12px', 
        right: '12px', 
        bottom: '12px', 
        border: '4px solid #f59e0b',
        borderRadius: '8px',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      <div style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '20px', 
        right: '20px', 
        bottom: '20px', 
        border: '2px solid #fbbf24',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '4px solid #f59e0b', paddingBottom: '16px' }}>
          {/* Official Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <CareerCompassLogo size={70} />
          </div>
          
          {/* Typography: Heading */}
          <p style={{ 
            color: '#b45309', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            letterSpacing: '3px', 
            textTransform: 'uppercase', 
            marginBottom: '4px',
            fontFamily: "'Arial', sans-serif"
          }}>
            Certificate of Professional Achievement
          </p>
          
          {/* Typography: Main Heading */}
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            fontFamily: "'Georgia', serif", 
            margin: '8px 0', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            letterSpacing: '1px'
          }}>
            Career Compass AI
          </h1>
          
          {/* Typography: Subheading */}
          <p style={{ 
            color: '#92400e', 
            fontSize: '11px', 
            fontWeight: '600', 
            letterSpacing: '2px', 
            textTransform: 'uppercase', 
            marginTop: '4px',
            fontFamily: "'Arial', sans-serif"
          }}>
            Professional Excellence Certification Program
          </p>
        </div>

        {/* Body */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          {/* Typography: Body */}
          <p style={{ 
            color: '#78350f', 
            marginBottom: '8px', 
            fontSize: '15px', 
            fontWeight: '500',
            fontFamily: "'Arial', sans-serif"
          }}>
            This is to certify that
          </p>
          
          {/* Typography: Recipient Name */}
          <h2 style={{ 
            fontSize: '30px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            fontFamily: "'Georgia', serif", 
            marginBottom: '12px', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
            letterSpacing: '0.5px'
          }}>
            {certificate.user_name}
          </h2>
          
          <p style={{ 
            color: '#78350f', 
            marginBottom: '12px', 
            fontSize: '15px', 
            fontWeight: '500',
            fontFamily: "'Arial', sans-serif"
          }}>
            has successfully completed the professional certification program for
          </p>
          
          {/* Typography: Highlight - Course Name */}
          <div style={{ 
            display: 'inline-block', 
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)', 
            padding: '12px 24px', 
            borderRadius: '8px', 
            border: '3px solid #f59e0b', 
            marginBottom: '16px', 
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#1f2937', 
              margin: 0,
              fontFamily: "'Georgia', serif"
            }}>
              {certificate.role_title}
            </h3>
          </div>

          {/* Course Details - Typography: Small */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '20px', 
            marginTop: '12px', 
            flexWrap: 'wrap', 
            fontSize: '12px', 
            color: '#6b7280',
            fontFamily: "'Arial', sans-serif"
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} /> {certificate.course_duration || '120 Hours Intensive Training'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileCheck size={14} /> {certificate.completion_mode || 'Online + Project Based'}
            </span>
          </div>

          {/* Skills Section - Typography: Small */}
          {skills.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p style={{ 
                fontSize: '11px', 
                color: '#92400e', 
                marginBottom: '8px', 
                fontWeight: '700',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontFamily: "'Arial', sans-serif"
              }}>
                Skills Covered
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '8px', 
                flexWrap: 'wrap', 
                maxWidth: '650px', 
                margin: '0 auto' 
              }}>
                {skills.slice(0, 10).map((skill, index) => (
                  <span key={index} style={{ 
                    padding: '4px 12px', 
                    background: '#ffffff', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    color: '#374151',
                    fontWeight: '600',
                    fontFamily: "'Arial', sans-serif"
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Performance & Project - Typography: Badge */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '14px', 
            marginTop: '16px', 
            flexWrap: 'wrap' 
          }}>
            <span style={{ 
              padding: '6px 16px', 
              background: '#166534', 
              color: '#ffffff', 
              fontSize: '12px', 
              fontWeight: '700', 
              borderRadius: '9999px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontFamily: "'Arial', sans-serif",
              boxShadow: '0 2px 4px rgba(22, 101, 52, 0.3)'
            }}>
              <CheckCircle2 size={14} /> Score: {certificate.final_assessment_score?.toFixed(1) || '85.0'}%
            </span>
            <span style={{ 
              padding: '6px 16px', 
              background: '#1d4ed8', 
              color: '#ffffff', 
              fontSize: '12px', 
              fontWeight: '700', 
              borderRadius: '9999px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontFamily: "'Arial', sans-serif",
              boxShadow: '0 2px 4px rgba(29, 78, 216, 0.3)'
            }}>
              <Medal size={14} /> Grade: {certificate.performance_grade || 'A'}
            </span>
            <span style={{ 
              padding: '6px 16px', 
              background: '#b45309', 
              color: '#ffffff', 
              fontSize: '12px', 
              fontWeight: '700', 
              borderRadius: '9999px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontFamily: "'Arial', sans-serif",
              boxShadow: '0 2px 4px rgba(180, 83, 9, 0.3)'
            }}>
              <Shield size={14} /> Project Completed
            </span>
          </div>
        </div>

        {/* Footer Section */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '2px solid #fde68a', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
        }}>
          {/* Left: Date and ID */}
          <div style={{ textAlign: 'left', minWidth: '180px' }}>
            <p style={{ 
              fontSize: '10px', 
              color: '#92400e', 
              marginBottom: '4px', 
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: "'Arial', sans-serif"
            }}>
              Issue Date
            </p>
            <p style={{ 
              fontSize: '13px', 
              color: '#1f2937', 
              fontWeight: '600',
              fontFamily: "'Georgia', serif"
            }}>
              {formatDate(certificate.issued_at)}
            </p>
            <p style={{ 
              fontSize: '10px', 
              color: '#92400e', 
              marginTop: '10px', 
              marginBottom: '4px', 
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontFamily: "'Arial', sans-serif"
            }}>
              Certificate ID
            </p>
            <p style={{ 
              fontSize: '14px', 
              color: '#f59e0b', 
              fontWeight: 'bold', 
              fontFamily: "'Courier New', monospace",
              letterSpacing: '1px'
            }}>
              {generateCertificateIdDisplay(certificate)}
            </p>
          </div>

          {/* Center: Digital Seal & Signature */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <DigitalSealBadge />
            <div style={{ width: '140px', height: '45px', borderBottom: '2px solid #1f2937', marginBottom: '2px' }}></div>
            <p style={{ 
              fontSize: '10px', 
              color: '#6b7280', 
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: "'Arial', sans-serif"
            }}>
              Authorized Signature
            </p>
            <p style={{ 
              fontSize: '9px', 
              color: '#9ca3af',
              fontFamily: "'Arial', sans-serif" 
            }}>
              Program Director
            </p>
          </div>

          {/* Right: QR Code & Verification */}
          <div style={{ textAlign: 'right', minWidth: '120px' }}>
            <QRCodeDisplay 
              qrCode={certificate.qr_code} 
              verificationUrl={certificate.verification_url} 
            />
          </div>
        </div>

        {/* Website URL - Typography: Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          paddingTop: '14px', 
          borderTop: '2px dashed #fbbf24' 
        }}>
          <p style={{ 
            fontSize: '11px', 
            color: '#92400e', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '6px',
            fontFamily: "'Arial', sans-serif",
            fontWeight: '600'
          }}>
            <Globe size={12} /> 
            www.careercompass.ai | Verify at careercompass.ai/verify/{generateCertificateIdDisplay(certificate)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CertificateDisplay({ certificate, onClose }: CertificateDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [isDownloadingOpenBadge, setIsDownloadingOpenBadge] = useState(false);
  const [currentCert, setCurrentCert] = useState<Certificate>(certificate);
  const hiddenRef = useRef<HTMLDivElement>(null);


  // Regenerate QR code if not present
  useEffect(() => {
    const regenerateQR = async () => {
      if (!currentCert.qr_code && currentCert.id) {
        setIsRegeneratingQR(true);
        try {
          const result = await certificateApi.regenerateQRCode(currentCert.id);
          if (result.certificate) {
            setCurrentCert(result.certificate);
          }
        } catch (error) {
          console.error('Failed to regenerate QR code:', error);
        } finally {
          setIsRegeneratingQR(false);
        }
      }
    };
    regenerateQR();
  }, [currentCert.id, currentCert.qr_code]);

  const handleDownload = async () => {

    setIsDownloading(true);
    
    try {
      const hiddenElement = hiddenRef.current;
      if (!hiddenElement) {
        throw new Error('Hidden element not found');
      }

      // Make visible temporarily for capture
      hiddenElement.style.display = 'block';
      
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(hiddenElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Hide again
      hiddenElement.style.display = 'none';

      // Create PDF - A4 Landscape (High resolution for printing)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate dimensions to fit A4 landscape
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

      const filename = `Certificate-${certificate.role_title.replace(/\s+/g, '-')}-${certificate.id}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareLinkedIn = () => {
    const verificationUrl = certificate.verification_url || `https://careercompass.ai/verify/${generateCertificateIdDisplay(certificate)}`;
    const url = encodeURIComponent(verificationUrl);
    const title = encodeURIComponent(`I earned a certificate for completing the ${certificate.role_title} learning path on Career Compass AI!`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleShare = async () => {
    setIsSharing(true);
    const verificationUrl = certificate.verification_url || `https://careercompass.ai/verify/${generateCertificateIdDisplay(certificate)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Career Compass AI Certificate',
          text: `I completed the ${certificate.role_title} learning path!`,
          url: verificationUrl,
        });
      } catch (err) {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(
        `I earned a certificate for completing the ${certificate.role_title} learning path on Career Compass AI!\n\nVerify at: ${verificationUrl}`
      );
      alert('Certificate details copied to clipboard!');
    }
    setIsSharing(false);
  };

  // Download Open Badge JSON (Mozilla Open Badges 2.0 compatible)
  const handleDownloadOpenBadge = async () => {
    setIsDownloadingOpenBadge(true);
    try {
      const openBadgeData = await certificateApi.downloadOpenBadgeJson(certificate.id);
      
      // Convert to JSON and download
      const jsonString = JSON.stringify(openBadgeData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `openbadge-${certificate.certificate_unique_id || certificate.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading Open Badge:', error);
      alert('Failed to download Open Badge. Please try again.');
    } finally {
      setIsDownloadingOpenBadge(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-auto">
      {/* Certificate Container */}
      <Card className="relative w-full max-w-5xl shadow-2xl" style={{ background: 'transparent', border: 'none' }}>
        <CardContent className="p-0" style={{ background: 'transparent' }}>
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg transition"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          )}

          {/* Display Certificate */}
          <CertificateContent certificate={currentCert} className="shadow-2xl" />

          {/* Action Buttons */}
          <div className="px-8 py-4 bg-white/90 backdrop-blur flex justify-center gap-3 mt-4 rounded-lg shadow-lg">
            <Button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
            
            <Button 
              onClick={handleShareLinkedIn}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 gap-2"
            >
              <Share2 className="w-4 h-4" />
              LinkedIn
            </Button>

            <Button 
              onClick={handleShare}
              disabled={isSharing}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>

            <Button 
              onClick={handleDownloadOpenBadge}
              disabled={isDownloadingOpenBadge}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 gap-2"
              title="Download Open Badge (Mozilla Open Badges 2.0 compatible)"
            >
              <BadgeCheck className="w-4 h-4" />
              {isDownloadingOpenBadge ? 'Downloading...' : 'Open Badge'}
            </Button>

            {onClose && (

              <Button 
                onClick={onClose}
                variant="ghost"
                className="text-gray-600 hover:bg-gray-100"
              >
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hidden container for PDF generation */}
      <div 
        ref={hiddenRef} 
        style={{ 
          display: 'none', 
          position: 'fixed', 
          top: 0, 
          left: 0,
          zIndex: -1,
          background: '#ffffff'
        }}
      >
        <CertificateContent certificate={currentCert} />
      </div>
    </div>
  );
}

interface CertificateCheckProps {
  pathId: number;
  onCertificateFound?: (certificate: Certificate) => void;
}

export function CertificateCheck({ pathId, onCertificateFound }: CertificateCheckProps) {
  return null;
}
