import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);

  const [totalOrders, totalCustomers, monthRevenue, recentOrders, monthlyData] = await Promise.all([
    prisma.order.count({ where: { deleted: false } }),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        deleted: false,
        orderDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.order.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.$queryRaw<{ day: string | null; revenue: number }[]>`
      SELECT DATE(orderDate) as day, SUM(amount) as revenue
      FROM "Order"
      WHERE deleted = false AND orderDate >= date('now', '-30 days')
      GROUP BY DATE(orderDate)
      ORDER BY day
    `,
  ]);

  return {
    totalOrders,
    totalCustomers,
    monthRevenue: monthRevenue._sum.amount || 0,
    recentOrders,
    monthlyData: monthlyData
      .filter((d) => d.day !== null)
      .map((d) => ({
        day: d.day!.slice(5),
        revenue: d.revenue,
      })),
  };
}

const statusMap: Record<string, string> = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  cancelled: "已取消",
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const { totalOrders, totalCustomers, monthRevenue, recentOrders, monthlyData } =
    useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 儀表板</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">本月營收</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">
            NT$ {monthRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">總訂單數</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500 text-sm">客戶數</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{totalCustomers}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">近 30 天營收趨勢</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#1e293b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">最新訂單</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">訂單編號</th>
                <th className="text-left py-2">客戶</th>
                <th className="text-right py-2">金額</th>
                <th className="text-center py-2">狀態</th>
                <th className="text-right py-2">日期</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">
                    <a href={`/orders/${o.id}`} className="text-blue-600 hover:underline">
                      {o.orderNo}
                    </a>
                  </td>
                  <td className="py-2 text-gray-600">{o.customer.name}</td>
                  <td className="py-2 text-right">NT$ {o.amount.toLocaleString()}</td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[o.status]}`}>
                      {statusMap[o.status] || o.status}
                    </span>
                  </td>
                  <td className="py-2 text-right text-gray-500">
                    {new Date(o.orderDate).toLocaleDateString("zh-TW")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <a href="/orders" className="text-blue-600 hover:underline text-sm">查看全部 →</a>
        </div>
      </div>
    </div>
  );
}
