import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Star,
  Target,
  GraduationCap,
  Loader2,
  Filter,
  BarChart3,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { careerApi } from '@/api/career.api';
import type { CareerMatch, TrendingCareer } from '@/types';

export default function Careers() {
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([]);
  const [trendingCareers, setTrendingCareers] = useState<TrendingCareer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<CareerMatch | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  
  // Filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [careerData, trendingData] = await Promise.all([
        careerApi.getRecommendations(),
        careerApi.getTrendingCareers(5)
      ]);

      setCareerMatches(careerData.recommendations);
      setTrendingCareers(trendingData);
    } catch (err) {
      console.error('Error fetching career data:', err);
      setError('Failed to load career recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCareer = (match: CareerMatch) => {
    localStorage.setItem('selectedCareer', JSON.stringify(match));
    window.location.href = '/learning';
  };

  const toggleCompareSelection = (roleId: number) => {
    setSelectedForCompare(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 careers
      }
      return [...prev, roleId];
    });
  };

  const clearFilters = () => {
    setLevelFilter('all');
    setMinMatchScore(0);
  };

  // Apply filters
  const filteredMatches = careerMatches.filter(match => {
    if (levelFilter !== 'all' && match.level !== levelFilter) return false;
    if ((match.match_percentage || match.matchScore) < minMatchScore) return false;
    return true;
  });

  const formatSalary = (min: number, max: number) => {
    return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
  };

  const getOutlookColor = (outlook: string) => {
    switch (outlook) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">Career Matches</h1>
          <p className="text-muted-foreground mt-1">
            Discover roles that align with your skills and market trends
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-muted")}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button 
            variant={compareMode ? "default" : "outline"}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedForCompare([]);
            }}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {compareMode ? 'Cancel Compare' : 'Compare'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Career Level</label>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="principal">Principal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Min Match Score: {minMatchScore}%</label>
              <Slider
                value={[minMatchScore]}
                onValueChange={([value]) => setMinMatchScore(value)}
                max={100}
                step={5}
                className="w-[200px]"
              />
            </div>

            <Button variant="ghost" onClick={clearFilters} className="mt-6">
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Compare Mode Banner */}
      {compareMode && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Select up to 4 careers to compare</p>
              <p className="text-sm text-muted-foreground">
                {selectedForCompare.length} selected
              </p>
            </div>
            {selectedForCompare.length >= 2 && (
              <Button onClick={() => {/* Navigate to comparison */}}>
                Compare Now
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Trending Careers Section */}
      {trendingCareers.length > 0 && !compareMode && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending Careers
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {trendingCareers.map((career, index) => (
              <Card key={career.roleId ? `trending-${career.roleId}` : `trending-idx-${index}`} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">{career.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      +{career.growthRate}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {formatSalary(career.averageSalary.min, career.averageSalary.max)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {career.keySkills.slice(0, 2).map((skill, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Career Matches Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Your Matches ({filteredMatches.length})
        </h2>
        
        {filteredMatches.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No careers match your filters. Try adjusting your criteria.</p>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredMatches.map((match, index) => {
              const matchScore = match.match_percentage || match.matchScore || 0;
              const isSelected = selectedForCompare.includes(match.roleId);
              const uniqueKey = match.roleId ? `match-${match.roleId}` : `match-idx-${index}-${match.title?.replace(/\s+/g, '-').toLowerCase() || 'unknown'}`;
              
              return (
                <Card
                  key={uniqueKey}
                  className={cn(
                    "relative overflow-hidden card-hover cursor-pointer transition-all",
                    index === 0 && "border-primary/50 ring-1 ring-primary/20",
                    compareMode && isSelected && "ring-2 ring-primary border-primary",
                    compareMode && !isSelected && "opacity-70"
                  )}
                  onClick={() => {
                    if (compareMode) {
                      toggleCompareSelection(match.roleId);
                    } else {
                      setDetailMatch(match);
                    }
                  }}
                >
                  {/* Best Match Badge */}
                  {index === 0 && !compareMode && (
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        <Star className="w-3 h-3" /> Best Match
                      </span>
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {compareMode && (
                    <div className="absolute top-3 right-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      )}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-4">
                      <ProgressRing value={matchScore} size={64} strokeWidth={5}>
                        <span className="text-sm font-bold">{Math.round(matchScore)}%</span>
                      </ProgressRing>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-display leading-tight line-clamp-2">
                          {match.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {match.level}
                          </Badge>
                          {match.marketOutlook && (
                            <Badge variant="secondary" className={cn("text-xs", getOutlookColor(match.marketOutlook))}>
                              {match.marketOutlook}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Salary & Growth */}
                    {match.averageSalary && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatSalary(match.averageSalary.min, match.averageSalary.max)}</span>
                        </div>
                        {match.growthRate && (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="w-4 h-4" />
                            <span>+{match.growthRate}% growth</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skill Match Summary */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Skills</span>
                          <span>{match.matchedCount || 0}/{match.totalRequirements || 0} matched</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${match.totalRequirements ? ((match.matchedCount || 0) / match.totalRequirements) * 100 : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Time to Qualify */}
                    {match.estimated_time_to_qualify && match.estimated_time_to_qualify !== 'Ready now' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Est. time to qualify: {match.estimated_time_to_qualify}</span>
                      </div>
                    )}

                    {/* Explanation */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {match.explanation || match.reasoning}
                    </p>

                    {/* Key Skills */}
                    {match.keySkills && match.keySkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {match.keySkills.slice(0, 3).map((skill, skillIndex) => (
                          <Badge key={`${uniqueKey}-skill-${skillIndex}`} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {match.keySkills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{match.keySkills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailMatch} onOpenChange={() => setDetailMatch(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {detailMatch && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <ProgressRing 
                    value={detailMatch.match_percentage || detailMatch.matchScore || 0} 
                    size={80} 
                    strokeWidth={6}
                  >
                    <span className="text-lg font-bold">
                      {Math.round(detailMatch.match_percentage || detailMatch.matchScore || 0)}%
                    </span>
                  </ProgressRing>
                  <div>
                    <DialogTitle className="text-2xl font-display">
                      {detailMatch.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {detailMatch.level}
                      </Badge>
                      {detailMatch.marketOutlook && (
                        <Badge className={getOutlookColor(detailMatch.marketOutlook)}>
                          {detailMatch.marketOutlook} Outlook
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Market Data */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Salary Range</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {detailMatch.averageSalary ? 
                        formatSalary(detailMatch.averageSalary.min, detailMatch.averageSalary.max) :
                        'Not available'
                      }
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Growth Rate</span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      +{detailMatch.growthRate || 5}%
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Time to Qualify</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {detailMatch.estimated_time_to_qualify || 'Unknown'}
                    </p>
                  </Card>
                </div>

                {/* Why This Match */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    Why This Match
                  </h4>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {detailMatch.explanation || detailMatch.reasoning}
                  </p>
                </div>

                {/* Skill Requirements */}
                {detailMatch.skillRequirements && detailMatch.skillRequirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Skill Requirements ({detailMatch.matchedCount}/{detailMatch.totalRequirements} met)
                    </h4>
                    <div className="space-y-2">
                      {detailMatch.skillRequirements.map((req, reqIndex) => (
                        <div 
                          key={req.skill_id ? `req-${req.skill_id}` : `req-idx-${reqIndex}`} 
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            req.is_matched ? "bg-green-50/50 border-green-200" : "bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              req.is_matched ? "bg-green-500" : "bg-yellow-500"
                            )} />
                            <div>
                              <p className="font-medium text-sm">{req.skill_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Required: {req.required_level} • Your level: {req.user_level}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {req.user_score}/{req.required_score}
                            </p>
                            {!req.is_matched && req.severity && (
                              <Badge variant="outline" className={cn("text-xs", getSeverityColor(req.severity))}>
                                {req.severity} gap
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills Severity */}
                {detailMatch.missingSeverity && detailMatch.missingSeverity.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-warning" />
                      Skill Gaps to Address
                    </h4>
                    <div className="space-y-2">
                      {detailMatch.missingSeverity.map((item, severityIndex) => (
                        <div 
                          key={item.skill_name ? `sev-${item.skill_name.replace(/\s+/g, '-')}` : `sev-idx-${severityIndex}`} 
                          className={cn(
                            "p-3 rounded-lg border",
                            getSeverityColor(item.severity)
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.skill_name}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {item.severity}
                            </Badge>
                          </div>
                          <p className="text-xs mt-1 opacity-80">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleSelectCareer(detailMatch);
                      setDetailMatch(null);
                    }}
                    asChild
                  >
                    <Link to="/learning">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Start Learning Path
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => setDetailMatch(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
