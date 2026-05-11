import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: { where: { deleted: false }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) throw new Response("Not Found", { status: 404 });
  return { customer };
}

const statusMap: Record<string, string> = {
  pending: "待處理", processing: "處理中", completed: "已完成", cancelled: "已取消",
};
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800", processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
};

export default function CustomerDetail() {
  const { customer } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">👤 {customer.name}</h1>
        <a href="/customers" className="text-gray-500 hover:text-gray-700">← 回列表</a>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-3">客戶資訊</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">電話：</span>{customer.phone || "-"}</div>
          <div><span className="text-gray-500">Email：</span>{customer.email || "-"}</div>
          <div><span className="text-gray-500">地址：</span>{customer.address || "-"}</div>
          <div><span className="text-gray-500">加入日期：</span>{new Date(customer.createdAt).toLocaleDateString("zh-TW")}</div>
        </div>
        {customer.notes && (
          <div className="mt-3 pt-3 border-t text-sm">
            <span className="text-gray-500">備註：</span>{customer.notes}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold mb-4">歷史訂單 ({customer.orders.length})</h2>
        {customer.orders.length === 0 ? (
          <p className="text-gray-400 text-sm">尚無訂單</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">訂單編號</th>
                <th className="text-right py-2">金額</th>
                <th className="text-center py-2">狀態</th>
                <th className="text-right py-2">日期</th>
              </tr>
            </thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2">
                    <a href={`/orders/${o.id}`} className="text-blue-600 hover:underline">{o.orderNo}</a>
                  </td>
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
        )}
      </div>
    </div>
  );
}
