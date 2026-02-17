import React, { useState, useCallback, useEffect } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ArrowLeft, 
  Loader2,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resumeApi, Resume, ATSAnalysis } from '@/api/resume.api';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function ATSChecker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [atsAnalysis, setAtsAnalysis] = useState<ATSAnalysis | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [parsedTextPreview, setParsedTextPreview] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();


  useEffect(() => {
    if (resumeId) {
      loadResumeAnalysis(parseInt(resumeId));
    }
  }, [resumeId]);

  const loadResumeAnalysis = async (id: number) => {
    try {
      setAnalyzing(true);
      const response = await resumeApi.getATSAnalysis(id);
      if (response.success) {
        setAtsAnalysis(response.ats_analysis);
        // Also load resume details
        const resumeResponse = await resumeApi.getResume(id);
        if (resumeResponse.success) {
          setResume(resumeResponse.resume);
        }
      }
    } catch (error) {
      console.error('Error loading ATS analysis:', error);
      // If no analysis exists, we'll show the upload UI
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF or DOCX file only.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    
    try {
      setUploading(true);
      const response = await resumeApi.uploadResume(file);
      
      if (response.success) {
        setResume(response.resume);
        setAtsAnalysis(response.ats_analysis);
        setParsedTextPreview(response.parsed_text_preview);
        toast({
          title: 'Success',
          description: 'Resume uploaded and analyzed successfully!',
        });
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload and analyze resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };


  const handleReanalyze = async () => {
    if (!resume) return;
    
    try {
      setAnalyzing(true);
      const response = await resumeApi.analyzeATSScore(resume.id, jobDescription);
      
      if (response.success) {
        setAtsAnalysis(response.ats_analysis);
        toast({
          title: 'Analysis Complete',
          description: 'ATS score has been updated.',
        });
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    return <XCircle className="w-6 h-6 text-red-600" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/resumes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ATS Resume Checker</h1>
            <p className="text-gray-600 text-sm">
              Upload your resume and check its ATS compatibility score
            </p>
          </div>
        </div>
        {resume && (
          <Button onClick={handleReanalyze} disabled={analyzing}>
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reanalyze
              </>
            )}
          </Button>
        )}
      </div>

      {!atsAnalysis ? (
        /* Upload Section */
        <Card className="border-2 border-dashed">
          <CardContent className="pt-6">
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileInput}
                className="hidden"
              />
              
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium text-gray-900">Uploading and analyzing...</p>
                  <p className="text-sm text-gray-500 mt-1">Please wait while we process your resume</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    or click to browse files
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>Supports PDF, DOCX (Max 5MB)</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      ) : (
        /* Results Section */
        <div className="space-y-6">
          {/* Overall Score Card */}
          <Card className={`${getScoreBgColor(atsAnalysis.overall_score)} border-2`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getScoreIcon(atsAnalysis.overall_score)}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      ATS Score: {atsAnalysis.overall_score.toFixed(1)}%
                    </h2>
                    <p className={`text-lg font-medium ${getScoreColor(atsAnalysis.overall_score)}`}>
                      {getScoreLabel(atsAnalysis.overall_score)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Word Count</p>
                  <p className="text-lg font-semibold text-gray-900">{atsAnalysis.word_count}</p>
                </div>
              </div>
              <Progress 
                value={atsAnalysis.overall_score} 
                className="mt-4 h-3"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Analysis Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sections Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Sections
                  </CardTitle>
                  <CardDescription>
                    Analysis of required resume sections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Sections Score</span>
                    <Badge variant="secondary" className={getScoreColor(atsAnalysis.sections_analysis.score)}>
                      {atsAnalysis.sections_analysis.score.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={atsAnalysis.sections_analysis.score} 
                    className="mb-4"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(atsAnalysis.sections_analysis.found).map(([section, found]) => (
                      <div 
                        key={section}
                        className={`flex items-center gap-2 p-2 rounded ${
                          found ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {found ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span className="text-sm capitalize">{section.replace('_', ' ')}</span>
                      </div>
                    ))}
                  </div>
                  
                  {atsAnalysis.sections_analysis.missing.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Missing Sections:</p>
                      <p className="text-sm text-yellow-700">
                        {atsAnalysis.sections_analysis.missing.map(s => s.replace('_', ' ')).join(', ')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Keywords Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Keywords & Skills
                  </CardTitle>
                  <CardDescription>
                    Technical skills and soft skills detected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Keywords Score</span>
                      <Badge variant="secondary" className={getScoreColor(atsAnalysis.keywords_analysis.score)}>
                        {atsAnalysis.keywords_analysis.score.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress value={atsAnalysis.keywords_analysis.score} />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Technical Keywords ({atsAnalysis.keywords_analysis.technical_keywords.count} found)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsAnalysis.keywords_analysis.technical_keywords.found.map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="bg-blue-100 text-blue-700">
                            {keyword}
                          </Badge>
                        ))}
                        {atsAnalysis.keywords_analysis.technical_keywords.found.length === 0 && (
                          <p className="text-sm text-gray-500">No technical keywords detected</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Soft Skills ({atsAnalysis.keywords_analysis.soft_skills.count} found)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {atsAnalysis.keywords_analysis.soft_skills.found.map((skill) => (
                          <Badge key={skill} variant="secondary" className="bg-purple-100 text-purple-700">
                            {skill}
                          </Badge>
                        ))}
                        {atsAnalysis.keywords_analysis.soft_skills.found.length === 0 && (
                          <p className="text-sm text-gray-500">No soft skills detected</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formatting Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Formatting & Readability
                  </CardTitle>
                  <CardDescription>
                    Check for formatting issues that may affect ATS parsing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Formatting Score</span>
                    <Badge variant="secondary" className={getScoreColor(atsAnalysis.formatting_analysis.score)}>
                      {atsAnalysis.formatting_analysis.score.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={atsAnalysis.formatting_analysis.score} 
                    className="mb-4"
                  />

                  {atsAnalysis.formatting_analysis.issues.length > 0 ? (
                    <div className="space-y-2">
                      {atsAnalysis.formatting_analysis.issues.map((issue, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-red-50 text-red-700 rounded">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{issue}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">No formatting issues detected!</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Suggestions & Job Description */}
            <div className="space-y-6">
              {/* Job Description Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Target Job Description</CardTitle>
                  <CardDescription>
                    Paste a job description for targeted analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the job description here to check keyword matching..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[150px] mb-3"
                  />
                  <Button 
                    onClick={handleReanalyze} 
                    disabled={analyzing || !jobDescription.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Analyze with Job Description
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Improvement Suggestions</CardTitle>
                  <CardDescription>
                    Recommendations to improve your ATS score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {atsAnalysis.suggestions.map((suggestion, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-sm text-left">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="truncate">Suggestion {index + 1}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 pl-6">
                          {suggestion}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {atsAnalysis.suggestions.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No suggestions - your resume looks great!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Parsed Text Preview */}
              {parsedTextPreview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Parsed Content Preview</CardTitle>
                    <CardDescription>
                      How ATS systems see your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-[200px] overflow-y-auto">
                      <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                        {parsedTextPreview}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/resumes')}
                >
                  Back to Resumes
                </Button>
                {resume && (
                  <Button 
                    className="flex-1"
                    onClick={() => navigate(`/resumes/builder?id=${resume.id}`)}
                  >
                    Edit Resume
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
