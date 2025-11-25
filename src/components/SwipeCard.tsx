import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, TrendingUp, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SwipeCardProps {
  profile: any;
  onSwipe: (direction: 'like' | 'pass') => void;
  userType: 'founder' | 'investor';
}

export const SwipeCard = ({ profile, onSwipe, userType }: SwipeCardProps) => {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    if (!dragStart) return;

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      onSwipe(dragOffset.x > 0 ? 'like' : 'pass');
    }

    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const rotation = dragOffset.x / 20;
  const opacity = 1 - Math.abs(dragOffset.x) / 300;

  const profileData = userType === 'founder' 
    ? profile.investor_profiles?.[0] 
    : profile.founder_profiles?.[0];

  return (
    <div className="relative w-full max-w-md mx-auto h-[600px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-2xl"
        style={{
          transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
        }}
        onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
        onMouseMove={(e) => isDragging && handleDragMove(e.clientX, e.clientY)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => isDragging && handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleDragEnd}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-start justify-between text-2xl">
            <span>
              {userType === 'investor' 
                ? profileData?.startup_name 
                : profileData?.firm_name || profile.name}
            </span>
            <Building2 className="w-6 h-6 text-muted-foreground flex-shrink-0" />
          </CardTitle>
          <p className="text-lg text-muted-foreground">{profile.name}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {userType === 'investor' && (
            <>
              <p className="text-base leading-relaxed">{profileData?.one_liner}</p>
              {profileData?.industry && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-medium">{profileData.industry}</span>
                </div>
              )}
              {profileData?.traction && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Traction</p>
                  <p className="text-sm">{profileData.traction}</p>
                </div>
              )}
              {profileData?.preferred_city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  {profileData.preferred_city}
                </div>
              )}
            </>
          )}

          {userType === 'founder' && (
            <>
              {profileData?.typical_check_size && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Check Size</p>
                  <p className="text-base">{profileData.typical_check_size}</p>
                </div>
              )}
              {profileData?.preferred_stage && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Stage</p>
                  <p className="text-base">{profileData.preferred_stage}</p>
                </div>
              )}
              {profileData?.sectors_of_interest && profileData.sectors_of_interest.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Sectors of Interest</p>
                  <div className="flex flex-wrap gap-2">
                    {profileData.sectors_of_interest.map((sector: string) => (
                      <span key={sector} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profileData?.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  {profileData.location}
                </div>
              )}
            </>
          )}
        </CardContent>

        {/* Swipe indicators */}
        <div 
          className="absolute top-8 left-8 text-6xl font-bold text-red-500 opacity-0 rotate-[-30deg] pointer-events-none"
          style={{ opacity: dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 150, 1) : 0 }}
        >
          PASS
        </div>
        <div 
          className="absolute top-8 right-8 text-6xl font-bold text-green-500 opacity-0 rotate-[30deg] pointer-events-none"
          style={{ opacity: dragOffset.x > 50 ? Math.min(dragOffset.x / 150, 1) : 0 }}
        >
          LIKE
        </div>
      </Card>

      {/* Action buttons */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex gap-6">
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 hover:border-red-500 hover:text-red-500"
          onClick={() => onSwipe('pass')}
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-16 h-16 rounded-full border-2 hover:border-green-500 hover:text-green-500"
          onClick={() => onSwipe('like')}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
};
