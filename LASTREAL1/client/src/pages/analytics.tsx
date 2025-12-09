import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, Package, Receipt, AlertTriangle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    totalProducts: number;
    lowStockCount: number;
  };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByDay: Array<{ date: string; amount: number }>;
  salesByCategory: Array<{ category: string; amount: number }>;
}

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#7c3aed", "#0891b2", "#be185d", "#65a30d"];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Өгөгдөл олдсонгүй</p>
      </div>
    );
  }

  const { summary, topProducts, salesByDay, salesByCategory } = data;

  const formattedSalesByDay = salesByDay.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("mn-MN", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Нийт орлого</p>
                <p className="text-2xl font-bold" data-testid="text-analytics-revenue">
                  {summary.totalRevenue.toLocaleString()}₮
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Нийт гүйлгээ</p>
                <p className="text-2xl font-bold" data-testid="text-analytics-transactions">
                  {summary.totalTransactions}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Нийт бүтээгдэхүүн</p>
                <p className="text-2xl font-bold" data-testid="text-analytics-products">
                  {summary.totalProducts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${summary.lowStockCount > 0 ? "bg-destructive/10" : "bg-muted"}`}>
                <AlertTriangle className={`h-6 w-6 ${summary.lowStockCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Бага үлдэгдэлтэй</p>
                <p className={`text-2xl font-bold ${summary.lowStockCount > 0 ? "text-destructive" : ""}`} data-testid="text-analytics-low-stock">
                  {summary.lowStockCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Өдөр тутмын борлуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            {formattedSalesByDay.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Өгөгдөл байхгүй</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formattedSalesByDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()}₮`, "Орлого"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ангилал бүрийн борлуулалт</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Өгөгдөл байхгүй</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    nameKey="category"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {salesByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()}₮`, "Орлого"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Шилдэг бүтээгдэхүүнүүд</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Package className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">Өгөгдөл байхгүй</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K₮`}
                  className="text-muted-foreground"
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  width={120}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [`${value.toLocaleString()}₮`, "Орлого"];
                    return [value, "Тоо хэмжээ"];
                  }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderColor: "hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
