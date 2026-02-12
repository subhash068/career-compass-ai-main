import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressRing } from '@/components/ui/progress-ring';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  Star,
  Target,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { careerApi } from '@/api/career.api';
import type { CareerMatch } from '@/types';

export default function Careers() {
  const [careerMatches, setCareerMatches] = useState<CareerMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<CareerMatch | null>(null);

  useEffect(() => {
    const fetchCareerMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const careerData = await careerApi.getRecommendations();
        setCareerMatches(careerData.recommendations);
      } catch (err) {
        console.error('Error fetching career matches:', err);
        setError('Failed to load career recommendations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCareerMatches();
  }, []);

  const handleSelectCareer = (match: CareerMatch) => {
    // Store selected career for learning path generation
    localStorage.setItem('selectedCareer', JSON.stringify(match));
    // Navigate to learning page
    window.location.href = '/learning';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display">Career Matches</h1>
        <p className="text-muted-foreground mt-1">
          Discover roles that align with your skills and interests
        </p>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      )}

      {/* Career Cards Grid */}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {careerMatches.map((match, index) => (
          <Card
            key={match.roleId}
            className={cn(
              "relative overflow-hidden card-hover cursor-pointer",
              index === 0 && "border-primary/50 ring-1 ring-primary/20"
            )}
            onClick={() => setDetailMatch(match)}
          >
            {index === 0 && (
              <div className="absolute top-3 right-3">
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  <Star className="w-3 h-3" /> Best Match
                </span>
              </div>
            )}

            <CardHeader className="pb-2">
              <div className="flex items-start gap-4">
                <ProgressRing value={match.matchScore} size={64} strokeWidth={5}>
                  <span className="text-sm font-bold">{match.matchScore}%</span>
                </ProgressRing>
                <div className="flex-1">
                  <CardTitle className="text-lg font-display leading-tight">
                    {match.role.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Why this match:</p>
                <p className="text-sm text-muted-foreground">
                  {match.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailMatch} onOpenChange={() => setDetailMatch(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {detailMatch && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <ProgressRing value={detailMatch.matchScore} size={72} strokeWidth={6}>
                    <span className="text-lg font-bold">{detailMatch.matchScore}%</span>
                  </ProgressRing>
                  <div>
                    <DialogTitle className="text-2xl font-display">
                      {detailMatch.role.title}
                    </DialogTitle>
                    <DialogDescription>
                      AI-powered career match analysis
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h4 className="font-semibold mb-3">Why This Match</h4>
                  <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                    {detailMatch.reasoning}
                  </p>
                </div>

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
