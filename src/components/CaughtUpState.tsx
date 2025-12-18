import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SlidersHorizontal, 
  RotateCcw, 
  Heart, 
  ExternalLink, 
  Megaphone,
  Sparkles
} from 'lucide-react';
import type { AdProfile } from '@/hooks/useSwipeQueue';

interface CaughtUpStateProps {
  userType: 'founder' | 'investor';
  totalOrganic: number;
  isPro: boolean;
  adProfile: AdProfile | null;
  onReset: () => void;
  onExpandFilters: () => void;
}

export const CaughtUpState = ({ 
  userType, 
  totalOrganic, 
  isPro, 
  adProfile,
  onReset,
  onExpandFilters
}: CaughtUpStateProps) => {
  const navigate = useNavigate();
  const oppositeType = userType === 'founder' ? 'investors' : 'founders';

  return (
    <div className="space-y-6">
      {/* Ad Profile for non-Pro users */}
      {!isPro && adProfile && (
        <Card className="overflow-hidden border-amber-500/30">
          <div className="relative">
            {/* Ad Badge */}
            <div className="absolute top-3 right-3 z-10">
              <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                <Megaphone className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            </div>

            {/* Banner/Image */}
            {(adProfile.banner_url || adProfile.image_url) && (
              <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20">
                <img 
                  src={adProfile.banner_url || adProfile.image_url || ''} 
                  alt={adProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">
                  {adProfile.company_name || adProfile.firm_name || adProfile.name}
                </h3>
                {adProfile.one_liner && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {adProfile.one_liner}
                  </p>
                )}
              </div>

              {/* Industries/Sectors */}
              {(adProfile.industry || adProfile.sectors_of_interest) && (
                <div className="flex flex-wrap gap-1">
                  {(adProfile.industry || adProfile.sectors_of_interest || []).slice(0, 3).map((item: string) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTA */}
              {adProfile.cta_url && (
                <a
                  href={adProfile.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full" size="sm">
                    <ExternalLink className="w-3 h-3 mr-2" />
                    {adProfile.cta_text || 'Learn More'}
                  </Button>
                </a>
              )}
            </CardContent>
          </div>
        </Card>
      )}

      {/* Pro users see a cleaner message */}
      {isPro && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Pro Member</span>
          </div>
        </div>
      )}

      {/* All Caught Up Message */}
      <div className="text-center py-6 px-4">
        <div className="mb-4 text-5xl">✨</div>
        <h3 className="text-xl font-bold mb-2 text-foreground">
          You've seen everyone!
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {totalOrganic === 0 
            ? `No ${oppositeType} match your current filters yet.`
            : `You've reviewed all ${oppositeType} matching your preferences.`
          }
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Button 
            onClick={onExpandFilters} 
            className="w-full"
            variant="default"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Expand Filters
          </Button>
          
          <Button onClick={onReset} variant="outline" className="w-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Review Again
          </Button>
          
          <Button 
            onClick={() => navigate('/matches')} 
            variant="ghost" 
            className="w-full"
          >
            <Heart className="w-4 h-4 mr-2" />
            View Your Matches
          </Button>
        </div>
      </div>
    </div>
  );
};
