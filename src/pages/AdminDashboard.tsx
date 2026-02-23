import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, CheckCircle, DollarSign, AlertTriangle, BarChart3, Clock, Target } from "lucide-react";

const AdminDashboard = () => {
  const { data: leads = [] } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("date_added", { ascending: false });
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

  const today = new Date().toISOString().split("T")[0];
  const totalLeads = leads.length;
  const totalRevenue = leads
    .filter((l) => l.status === "Closed – Delivered")
    .reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
  const pipelineValue = leads
    .filter((l) => l.status !== "Closed – Delivered" && l.status !== "Closed Lost")
    .reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
  const totalCommissions = leads.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
  const activeReps = reps.filter((r) => r.active_status).length;
  const overdueCount = leads.filter(
    (l) =>
      l.followup_due_date &&
      l.followup_due_date < today &&
      l.status !== "Closed – Delivered" &&
      l.status !== "Closed Lost"
  ).length;
  const closedDelivered = leads.filter((l) => l.status === "Closed – Delivered").length;
  const conversionRate = totalLeads > 0 ? ((closedDelivered / totalLeads) * 100).toFixed(1) : "0";
  const avgDaysToClose =
    closedDelivered > 0
      ? (
          leads
            .filter((l) => l.status === "Closed – Delivered" && l.days_to_close != null)
            .reduce((s, l) => s + (l.days_to_close || 0), 0) / closedDelivered
        ).toFixed(0)
      : "—";

  const kpis = [
    { label: "Total Leads", value: totalLeads, icon: Users },
    { label: "Revenue (KD)", value: totalRevenue.toFixed(3), icon: DollarSign },
    { label: "Pipeline (KD)", value: pipelineValue.toFixed(3), icon: TrendingUp },
    { label: "Commissions (KD)", value: totalCommissions.toFixed(3), icon: DollarSign },
    { label: "Active Reps", value: activeReps, icon: Users },
    { label: "Overdue Follow-Ups", value: overdueCount, icon: AlertTriangle },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: Target },
    { label: "Avg Days to Close", value: avgDaysToClose, icon: Clock },
  ];

  // Per-rep performance
  const repPerformance = reps.map((rep) => {
    const repLeads = leads.filter((l) => l.sales_exec_id === rep.user_id);
    const repClosed = repLeads.filter((l) => l.status === "Closed – Delivered");
    const repRevenue = repClosed.reduce((s, l) => s + Number(l.final_agreed_amount_kd || 0), 0);
    const repCommission = repLeads.reduce((s, l) => s + Number(l.commission_amount_kwd || 0), 0);
    const repMeetings = repLeads.filter((l) => l.status === "Meeting Scheduled").length;
    const repConfirmed = repLeads.filter((l) =>
      l.status === "Deal Confirmed – Pending Payment" ||
      l.status === "Paid – In Production" ||
      l.status === "Client Review" ||
      l.status === "Closed – Delivered"
    ).length;

    return {
      ...rep,
      leads: repLeads.length,
      meetings: repMeetings,
      confirmed: repConfirmed,
      closed: repClosed.length,
      revenue: repRevenue,
      commission: repCommission,
      conversion: repLeads.length > 0 ? ((repClosed.length / repLeads.length) * 100).toFixed(1) : "0",
      avgDays:
        repClosed.length > 0
          ? (
              repClosed
                .filter((l) => l.days_to_close != null)
                .reduce((s, l) => s + (l.days_to_close || 0), 0) / repClosed.length
            ).toFixed(0)
          : "—",
    };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Company-wide sales overview</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="rounded-lg bg-muted p-2.5 text-primary">
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rep Performance Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Sales Rep Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Rep</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Leads</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Meetings</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Confirmed</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Closed</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Revenue (KD)</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Commission (KD)</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Conv %</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Avg Days</th>
                  </tr>
                </thead>
                <tbody>
                  {repPerformance.map((rep) => (
                    <tr key={rep.user_id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="font-medium">{rep.full_name}</p>
                          <p className="text-xs text-muted-foreground">{rep.email}</p>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4">{rep.leads}</td>
                      <td className="py-2.5 pr-4">{rep.meetings}</td>
                      <td className="py-2.5 pr-4">{rep.confirmed}</td>
                      <td className="py-2.5 pr-4">{rep.closed}</td>
                      <td className="py-2.5 pr-4">{rep.revenue.toFixed(3)}</td>
                      <td className="py-2.5 pr-4">{rep.commission.toFixed(3)}</td>
                      <td className="py-2.5 pr-4">{rep.conversion}%</td>
                      <td className="py-2.5 pr-4">{rep.avgDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
