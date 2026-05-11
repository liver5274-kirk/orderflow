import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Outlet, useLocation } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: { orderDate: "desc" },
    include: { supplier: { select: { name: true } }, items: true },
  });
  return { purchaseOrders };
}

const statusColor: Record<string, string> = {
  "待確認": "bg-yellow-100 text-yellow-700",
  "已確認": "bg-blue-100 text-blue-700",
  "運送中": "bg-purple-100 text-purple-700",
  "已收貨": "bg-green-100 text-green-700",
  "已取消": "bg-gray-100 text-gray-500",
};

export default function PurchaseList() {
  const { purchaseOrders } = useLoaderData<typeof loader>();
  const location = useLocation();
  const isChild = location.pathname !== "/suppliers/purchases";

  if (isChild) {
    return <Outlet />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">採購訂單</h2>
        <Link
          to="/suppliers/purchases/new"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
        >
          + 新增採購單
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">訂單編號</th>
              <th className="text-left px-4 py-3">供應商</th>
              <th className="text-center px-4 py-3">狀態</th>
              <th className="text-center px-4 py-3">品項</th>
              <th className="text-right px-4 py-3">總金額</th>
              <th className="text-left px-4 py-3">下單日期</th>
              <th className="text-left px-4 py-3">預計到貨</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/suppliers/purchases/${po.id}`} className="font-medium text-blue-600 hover:underline">
                    {po.orderNo}
                  </Link>
                </td>
                <td className="px-4 py-3">{po.supplier.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[po.status] || ""}`}>
                    {po.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">{po.items.length} 項</td>
                <td className="px-4 py-3 text-right font-medium">NT$ {po.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(po.orderDate).toLocaleDateString("zh-TW")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("zh-TW") : "—"}
                </td>
              </tr>
            ))}
            {purchaseOrders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  尚無採購單
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
