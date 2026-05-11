import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const [statusCount, monthlyData] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _sum: { amount: true }, _count: true, where: { deleted: false } }),
    prisma.$queryRaw<{ month: string | null; revenue: number; count: bigint }[]>`
      SELECT strftime('%Y-%m', orderDate / 1000, 'unixepoch') as month, SUM(amount) as revenue, COUNT(*) as count
      FROM "Order"
      WHERE deleted = false
      GROUP BY strftime('%Y-%m', orderDate / 1000, 'unixepoch')
      ORDER BY month DESC
      LIMIT 12
    `,
  ]);

  const statusColors: Record<string, string> = {
    pending: "#eab308", processing: "#3b82f6", completed: "#22c55e", cancelled: "#ef4444",
  };
  const statusLabels: Record<string, string> = {
    pending: "待處理", processing: "處理中", completed: "已完成", cancelled: "已取消",
  };

  const pieData = statusCount.map((s) => ({
    name: statusLabels[s.status] || s.status,
    value: s._count,
    color: statusColors[s.status] || "#999",
  }));

  // Convert BigInt to Number for serialization
  const barData = [...monthlyData].reverse().map((d) => ({
    month: (d.month || "").slice(2),
    revenue: d.revenue,
    count: Number(d.count),
  }));

  return { pieData, barData };
}

export default function Reports() {
  const { pieData, barData } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📈 報表</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Status Pie */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">訂單狀態分佈</h2>
          {pieData.length === 0 ? (
            <p className="text-gray-400 text-center py-12">尚無資料</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">月營收趨勢（近 12 個月）</h2>
          {barData.length === 0 ? (
            <p className="text-gray-400 text-center py-12">尚無資料</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
