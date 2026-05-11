import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, Outlet, useLocation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";

  const where: any = { deleted: false };
  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { customer: { name: { contains: search } } },
    ];
  }
  if (status) where.status = status;

  const orders = await prisma.order.findMany({
    where,
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return { orders, search, status };
}

const statusMap: Record<string, string> = {
  pending: "待處理", processing: "處理中", completed: "已完成", cancelled: "已取消",
};
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};

export default function Orders() {
  const { orders, search, status } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isIndex = location.pathname === "/orders";

  return (
    <div>
      {isIndex && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">📋 訂單管理</h1>
            <a href="/orders/new" className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">
              + 新增訂單
            </a>
          </div>

          {/* Filters */}
          <Form className="flex gap-3 mb-6">
            <input name="q" defaultValue={search} placeholder="搜尋訂單編號或客戶..." className="flex-1 p-2 border rounded-lg" />
            <select name="status" defaultValue={status} className="p-2 border rounded-lg">
              <option value="">全部狀態</option>
              <option value="pending">待處理</option>
              <option value="processing">處理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
            <button type="submit" className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">篩選</button>
          </Form>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3">訂單編號</th>
                  <th className="text-left px-6 py-3">客戶</th>
                  <th className="text-right px-6 py-3">金額</th>
                  <th className="text-center px-6 py-3">狀態</th>
                  <th className="text-right px-6 py-3">日期</th>
                  <th className="text-center px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{o.orderNo}</td>
                    <td className="px-6 py-3 text-gray-600">{o.customer.name}</td>
                    <td className="px-6 py-3 text-right">NT$ {o.amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[o.status]}`}>
                        {statusMap[o.status] || o.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-500">
                      {new Date(o.orderDate).toLocaleDateString("zh-TW")}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <a href={`/orders/${o.id}`} className="text-blue-600 hover:underline text-xs">查看</a>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">尚無訂單</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Outlet />
    </div>
  );
}
