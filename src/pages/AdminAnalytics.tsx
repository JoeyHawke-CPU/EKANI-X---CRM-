import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

const COLORS = [
  "hsl(174, 62%, 41%)",
  "hsl(210, 60%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
  "hsl(152, 60%, 42%)",
  "hsl(270, 50%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(200, 70%, 45%)",
];

const AdminAnalytics = () => {
  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("date_added", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: reps = [] } = useQuery({
    queryKey: ["admin-reps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_executives")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    leads
      .filter((l) => l.status === "Closed – Delivered" && l.go_live_date)
      .forEach((l) => {
        const month = l.go_live_date!.substring(0, 7);
        map[month] = (map[month] || 0) + Number(l.final_agreed_amount_kd || 0);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: format(parseISO(month + "-01"), "MMM yy"),
        revenue: Number(revenue.toFixed(3)),
      }));
  }, [leads]);

  // Monthly commission trend
  const monthlyCommission = useMemo(() => {
    const map: Record<string, number> = {};
    leads
      .filter((l) => l.status === "Closed – Delivered" && l.go_live_date)
      .forEach((l) => {
        const month = l.go_live_date!.substring(0, 7);
        map[month] = (map[month] || 0) + Number(l.commission_amount_kwd || 0);
      });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, commission]) => ({
        month: format(parseISO(month + "-01"), "MMM yy"),
        commission: Number(commission.toFixed(3)),
      }));
  }, [leads]);

  // Lead source breakdown
  const leadSourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.lead_source || "Unknown";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Solution breakdown
  const solutionData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const sol = l.solution_selected || "Not Set";
      map[sol] = (map[sol] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [leads]);

  // Close rate by rep
  const repCloseRate = useMemo(() => {
    return reps
      .filter((r) => r.role !== "admin")
      .map((rep) => {
        const repLeads = leads.filter((l) => l.sales_exec_id === rep.user_id);
        const closed = repLeads.filter((l) => l.status === "Closed – Delivered").length;
        const rate = repLeads.length > 0 ? Number(((closed / repLeads.length) * 100).toFixed(1)) : 0;
        return { name: rep.full_name.split(" ")[0], rate, total: repLeads.length, closed };
      })
      .filter((r) => r.total > 0);
  }, [leads, reps]);

  // Average deal size
  const closedDeals = leads.filter((l) => l.status === "Closed – Delivered");
  const avgDealSize =
    closedDeals.length > 0
      ? (closedDeals.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0) / closedDeals.length).toFixed(3)
      : "0";

  // Refund rate
  const refundCount = leads.filter((l) => l.refund_cancellation).length;
  const refundRate = leads.length > 0 ? ((refundCount / leads.length) * 100).toFixed(1) : "0";

  const revenueConfig: ChartConfig = {
    revenue: { label: "Revenue (KD)", color: "hsl(174, 62%, 41%)" },
  };
  const commissionConfig: ChartConfig = {
    commission: { label: "Commission (KD)", color: "hsl(210, 60%, 50%)" },
  };
  const closeRateConfig: ChartConfig = {
    rate: { label: "Close Rate %", color: "hsl(174, 62%, 41%)" },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Sales performance insights</p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Avg Deal Size (KD)</p>
              <p className="text-2xl font-bold mt-1">{avgDealSize}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Refund Rate</p>
              <p className="text-2xl font-bold mt-1">{refundRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Closed Deals</p>
              <p className="text-2xl font-bold mt-1">{closedDeals.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyRevenue.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No closed deals with go-live dates yet.</p>
            ) : (
              <ChartContainer config={revenueConfig} className="h-[280px] w-full">
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Commission Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Commission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyCommission.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No commission data yet.</p>
            ) : (
              <ChartContainer config={commissionConfig} className="h-[280px] w-full">
                <LineChart data={monthlyCommission}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="commission" stroke="var(--color-commission)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Lead Source Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Lead Source Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {leadSourceData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No leads yet.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        fontSize={11}
                      >
                        {leadSourceData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solution Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Solution / Package Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {solutionData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No leads yet.</p>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={solutionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        fontSize={11}
                      >
                        {solutionData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Close Rate by Rep */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Close Rate by Rep</CardTitle>
          </CardHeader>
          <CardContent>
            {repCloseRate.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No rep data yet.</p>
            ) : (
              <ChartContainer config={closeRateConfig} className="h-[280px] w-full">
                <BarChart data={repCloseRate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminAnalytics;
