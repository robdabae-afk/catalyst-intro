import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const FeaturedProfileCard = () => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Profile Card */}
      <Card className="overflow-hidden border-border/50 bg-card shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/20 to-accent/20 px-6 py-4">
          <h2 className="text-2xl font-bold text-foreground">Connect.</h2>
        </div>

        {/* Profile Header Section */}
        <CardHeader className="pb-2 pt-4 px-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-background">
              <AvatarImage src="" alt="Rob and Stephen" />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">
                RS
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate">Rob and Stephen</CardTitle>
              <p className="text-sm text-muted-foreground truncate">stephenmonster88@gmail.com</p>
              <Badge variant="secondary" className="mt-1 capitalize">Founder</Badge>
            </div>
          </div>
        </CardHeader>

        {/* Content Section */}
        <CardContent className="space-y-3 pt-2 px-6 pb-6">
          {/* Startup Name */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">Catalyst Intro</h3>
          </div>

          {/* One-liner */}
          <p className="text-sm leading-snug text-foreground">
            Tinder for Founders and Investors
          </p>

          {/* Stage & Industry */}
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-xs">
              Pre-Seed
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Fiotech
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span>New York</span>
          </div>

          {/* Traction */}
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs font-medium text-muted-foreground">Traction</p>
            </div>
            <ul className="text-xs space-y-1 text-foreground">
              <li>-45 Users in 1st Week</li>
              <li>-Launched "pro" our initial monetization feature</li>
              <li>-Received investor interest & currently exploring allocation for 1st round</li>
            </ul>
          </div>

          {/* View Pitch Deck Button */}
          <Button variant="outline" className="w-full" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            View Pitch Deck
          </Button>
        </CardContent>
      </Card>

      {/* Call to Action Text */}
      <p className="text-2xl font-semibold text-center text-foreground">
        Swipe on profiles like us.
      </p>
    </div>
  );
};

