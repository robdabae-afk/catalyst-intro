import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Building2, DollarSign, Rocket, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface AnalyticsData {
  totalFounders: number;
  totalInvestors: number;
  stageBreakdown: { name: string; value: number }[];
  industryBreakdown: { name: string; count: number }[];
  foundersWithMrr: number;
  foundersBackedBefore: number;
}

const STAGE_COLORS = ["#C5A059", "#D4AF37", "#FFD700", "#F5DEB3"];
const INDUSTRY_COLORS = ["#C5A059", "#8B7355", "#A0522D", "#CD853F", "#DEB887", "#D2B48C", "#BC8F8F", "#F4A460"];

export const AdminAnalyticsPanel = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, user_type");

        if (profilesError) throw profilesError;

        const totalFounders = profiles?.filter((p) => p.user_type === "founder").length || 0;
        const totalInvestors = profiles?.filter((p) => p.user_type === "investor").length || 0;

        // Fetch founder profiles for stage breakdown
        const { data: founderProfiles, error: founderError } = await supabase
          .from("founder_profiles")
          .select("stage, industry, mrr, backed_by");

        if (founderError) throw founderError;

        // Stage breakdown
        const stageCounts: Record<string, number> = {};
        founderProfiles?.forEach((fp) => {
          const stage = fp.stage || "Unknown";
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        });

        const stageBreakdown = Object.entries(stageCounts).map(([name, value]) => ({
          name: formatStage(name),
          value,
        }));

        // Industry breakdown
        const industryCounts: Record<string, number> = {};
        founderProfiles?.forEach((fp) => {
          if (fp.industry && Array.isArray(fp.industry)) {
            fp.industry.forEach((ind: string) => {
              industryCounts[ind] = (industryCounts[ind] || 0) + 1;
            });
          }
        });

        const industryBreakdown = Object.entries(industryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // Founders with MRR
        const foundersWithMrr = founderProfiles?.filter((fp) => fp.mrr && fp.mrr.trim() !== "").length || 0;

        // Founders backed before
        const foundersBackedBefore = founderProfiles?.filter((fp) => fp.backed_by && fp.backed_by.trim() !== "").length || 0;

        setData({
          totalFounders,
          totalInvestors,
          stageBreakdown,
          industryBreakdown,
          foundersWithMrr,
          foundersBackedBefore,
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatStage = (stage: string) => {
    return stage.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-8 text-muted-foreground">Failed to load analytics</div>;
  }

  const userRatioData = [
    { name: "Founders", value: data.totalFounders },
    { name: "Investors", value: data.totalInvestors },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalFounders}</p>
                <p className="text-sm text-muted-foreground">Founders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Building2 className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalInvestors}</p>
                <p className="text-sm text-muted-foreground">Investors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.foundersWithMrr}</p>
                <p className="text-sm text-muted-foreground">Reporting MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Rocket className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.foundersBackedBefore}</p>
                <p className="text-sm text-muted-foreground">Previously Backed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Ratio Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userRatioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#C5A059" />
                    <Cell fill="#6B7280" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#C5A059]" />
                <span className="text-sm">Founders ({data.totalFounders})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#6B7280]" />
                <span className="text-sm">Investors ({data.totalInvestors})</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stage Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Funding Stage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.stageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.stageBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            Top Industries (Market Map)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.industryBreakdown} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#C5A059" radius={[0, 4, 4, 0]}>
                  {data.industryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
