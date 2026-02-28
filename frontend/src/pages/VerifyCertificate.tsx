import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Share2, 
  ArrowLeft,
  Award,
  Calendar,
  User,
  BookOpen,
  Globe,
  Link,
  Blockchain,
  ExternalLink,
  Lock
} from 'lucide-react';

import axiosClient from '@/api/axiosClient';
import type { Certificate } from '@/types';

interface VerificationResult {
  valid: boolean;
  certificate?: Certificate & {
    recipient_name?: string;
    course_name?: string;
    is_expired?: boolean;
    blockchain_network?: string;
    blockchain_tx_id?: string;
    blockchain_hash?: string;
    blockchain_anchored_at?: string;
    is_anchored?: boolean;
    blockchain_verified?: boolean;
    blockchain_message?: string;
    hash_algorithm?: string;
  };
  message: string;
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

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      if (!certificateId) {
        setError('No certificate ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await axiosClient.get(`/certificate/verify/${certificateId}`);
        setVerification(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to verify certificate');
      } finally {
        setLoading(false);
      }
    };

    verifyCertificate();
  }, [certificateId]);

  const handleShare = async () => {
    if (!verification?.certificate) return;
    const url = verification.certificate.verification_url || `https://careercompass.ai/verify/${certificateId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Career Compass AI Certificate Verification',
          text: `Verify my certificate: ${verification.certificate.role_title}`,
          url: url,
        });
      } catch (err) {
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Verification URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying certificate...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error || 'An error occurred during verification'}</p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cert = verification.certificate;
  const skills = parseSkills(cert?.skills_covered);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Verification Status Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-center mb-4">
              {verification.valid ? (
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              ) : (
                <div className="flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-2">
              {verification.valid ? 'Certificate Verified' : 'Certificate Invalid'}
            </h1>
            
            <p className="text-center text-gray-600 mb-4">
              {verification.message}
            </p>

            {cert?.is_expired && (
              <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">This certificate has expired</span>
              </div>
            )}

            {/* Blockchain Verification Status */}
            {cert?.is_anchored && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <Blockchain className="w-5 h-5" />
                  <span className="font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Secured by Blockchain
                  </span>
                </div>
                {cert?.blockchain_verified && (
                  <p className="text-center text-sm text-green-600 mt-1">
                    ✓ Verified on {cert?.blockchain_network || 'Blockchain'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Certificate Details */}
        {verification.valid && cert && (
          <Card>
            <CardContent className="p-6">
              <div className="border-b pb-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-amber-500" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{cert.role_title}</h2>
                    <p className="text-sm text-gray-500">Professional Certification</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Recipient */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Recipient</p>
                    <p className="font-semibold text-gray-800">{cert.user_name}</p>
                  </div>
                </div>

                {/* Issue Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-semibold text-gray-800">{formatDate(cert.issued_at)}</p>
                  </div>
                </div>

                {/* Certificate ID */}
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Certificate ID</p>
                    <p className="font-mono font-semibold text-amber-600">{cert.certificate_unique_id}</p>
                  </div>
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="flex items-start gap-3">
                    <BookOpen className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Skills Covered</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance */}
                {cert.final_assessment_score && (
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Performance</p>
                      <div className="flex gap-4 mt-1">
                        <span className="font-semibold text-gray-800">
                          Score: {cert.final_assessment_score.toFixed(1)}%
                        </span>
                        {cert.performance_grade && (
                          <span className="font-semibold text-blue-800">
                            Grade: {cert.performance_grade}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Blockchain Info */}
              {cert?.is_anchored && (
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Blockchain className="w-4 h-4" />
                    <span>Blockchain Record:</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Network:</span>
                      <span className="font-medium text-purple-600 capitalize">
                        {cert?.blockchain_network || 'Sepolia Testnet'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Anchored:</span>
                      <span className="font-medium text-gray-800">
                        {cert?.blockchain_anchored_at ? formatDate(cert.blockchain_anchored_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Algorithm:</span>
                      <span className="font-medium text-gray-800">
                        {cert?.hash_algorithm || 'SHA-256'}
                      </span>
                    </div>
                    {cert?.blockchain_tx_id && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-500 mb-1">Transaction ID:</p>
                        <p className="font-mono text-xs text-blue-600 break-all">
                          {cert.blockchain_tx_id}
                        </p>
                        <a 
                          href={cert?.blockchain_network === 'polygon_amoy' 
                            ? `https://amoy.polygonscan.io/tx/${cert.blockchain_tx_id}`
                            : `https://sepolia.etherscan.io/tx/${cert.blockchain_tx_id}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Explorer
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification URL */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Link className="w-4 h-4" />
                  <span>Verification URL:</span>
                </div>
                <p className="font-mono text-sm text-amber-600 break-all mt-1">
                  {cert.verification_url || `https://careercompass.ai/verify/${cert.certificate_unique_id}`}
                </p>
              </div>

              {/* Actions */}

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={handleShare}
                  variant="outline"
                  className="flex-1 border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button 
                  onClick={() => window.open(cert.verification_url || `https://careercompass.ai/verify/${cert.certificate_unique_id}`, '_blank')}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Visit Website
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-amber-600">Career Compass AI</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Secure Certificate Verification System
          </p>
        </div>
      </div>
    </div>
  );
}
