import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      materials: { select: { id: true } },
      purchaseOrders: { select: { id: true, status: true } },
    },
  });
  return { suppliers };
}

export default function SupplierList() {
  const { suppliers } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">供應商列表</h2>
        <Link
          to="/suppliers/new"
          className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700"
        >
          + 新增供應商
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">名稱</th>
              <th className="text-left px-4 py-3">聯絡人</th>
              <th className="text-left px-4 py-3">電話</th>
              <th className="text-left px-4 py-3">統一編號</th>
              <th className="text-center px-4 py-3">供應物料</th>
              <th className="text-center px-4 py-3">進行中訂單</th>
              <th className="text-left px-4 py-3">付款條件</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {suppliers.map((s) => {
              const activePOs = s.purchaseOrders.filter(
                (po) => !["已收貨", "已取消"].includes(po.status)
              );
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/suppliers/${s.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{s.taxId || "—"}</td>
                  <td className="px-4 py-3 text-center">{s.materials.length}</td>
                  <td className="px-4 py-3 text-center">
                    {activePOs.length > 0 ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {activePOs.length} 筆
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{s.paymentTerms}</td>
                </tr>
              );
            })}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  尚無供應商，請先新增
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
