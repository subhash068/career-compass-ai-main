import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { AuthProvider } from "@/auth/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthWrapper } from "@/components/AuthWrapper";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { PageLoader } from "@/components/ui/skeleton-loader";

// Lazy load all pages for code splitting
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const SkillSelection = React.lazy(() => import("@/pages/SkillSelection"));
const Assessment = React.lazy(() => import("@/pages/AssessmentLanding"));
const Results = React.lazy(() => import("@/pages/Results"));
const GapAnalysis = React.lazy(() => import("@/pages/GapAnalysis"));
const Careers = React.lazy(() => import("@/pages/Careers"));
const Learning = React.lazy(() => import("@/pages/Learning"));
const Assistant = React.lazy(() => import("@/pages/Assistant"));
const Profile = React.lazy(() => import("@/pages/Profile"));
const Settings = React.lazy(() => import("@/pages/Settings"));
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const Login = React.lazy(() => import("@/pages/Login"));
const Register = React.lazy(() => import("@/pages/Register"));
const About = React.lazy(() => import("@/pages/About"));
const PrivacyPolicy = React.lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("@/pages/TermsOfService"));
const CookiePolicy = React.lazy(() => import("@/pages/CookiePolicy"));
const SkillExam = React.lazy(() => import("@/pages/SkillExam"));
const AssessmentHistory = React.lazy(() => import("@/pages/AssessmentHistory"));
const Notes = React.lazy(() => import("@/pages/Notes"));
const Resumes = React.lazy(() => import("@/pages/Resumes"));
const ResumeBuilder = React.lazy(() => import("@/pages/ResumeBuilder"));
const ATSChecker = React.lazy(() => import("@/pages/ATSChecker"));
const NotFound = React.lazy(() => import("./pages/NotFound"));


const queryClient = new QueryClient();

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { isDarkMode } = useApp();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <ChatProvider>
            <AuthProvider>
              <ThemeProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <AuthWrapper>
                    <MainLayout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/cookies" element={<CookiePolicy />} />
                        <Route path="/skill_selection" element={<SkillSelection />} />
                        <Route path="/skill_selection/assessment/:skillName" element={
                          <ProtectedRoute>
                            <SkillExam />
                          </ProtectedRoute>
                        } />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/skill_selection/assessment" element={<Assessment />} />
                        <Route path="/results" element={<Results />} />
                        <Route path="/gaps" element={<GapAnalysis />} />
                        <Route path="/careers" element={<Careers />} />
                        <Route path="/learning" element={<Learning />} />
                        <Route path="/assistant" element={<Assistant />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/assessment-history" element={
                          <ProtectedRoute>
                            <AssessmentHistory />
                          </ProtectedRoute>
                        } />
                        <Route path="/notes" element={
                          <ProtectedRoute>
                            <Notes />
                          </ProtectedRoute>
                        } />
                        <Route path="/resumes" element={
                          <ProtectedRoute>
                            <Resumes />
                          </ProtectedRoute>
                        } />
                        <Route path="/resumes/builder" element={
                          <ProtectedRoute>
                            <ResumeBuilder />
                          </ProtectedRoute>
                        } />
                        <Route path="/resumes/ats-checker" element={
                          <ProtectedRoute>
                            <ATSChecker />
                          </ProtectedRoute>
                        } />
                        <Route path="/admin" element={
                          <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                    </MainLayout>
                  </AuthWrapper>
                </BrowserRouter>
              </ThemeProvider>
            </AuthProvider>
          </ChatProvider>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
