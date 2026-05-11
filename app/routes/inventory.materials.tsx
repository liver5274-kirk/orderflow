import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const materials = await prisma.material.findMany({
    orderBy: { category: "asc" },
  });

  const lowStock = materials.filter((m) => m.currentStock <= m.minStock);
  return { materials, lowStock };
}

const categoryColors: Record<string, string> = {
  原料: "bg-amber-100 text-amber-800",
  包裝: "bg-blue-100 text-blue-800",
  耗材: "bg-gray-100 text-gray-700",
};

export default function MaterialsList() {
  const { materials, lowStock } = useLoaderData<typeof loader>();

  return (
    <div>
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-red-700 mb-2">⚠️ 低庫存警示</h2>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((m) => (
              <Link
                key={m.id}
                to={`/inventory/materials/${m.id}`}
                className="bg-white text-red-600 px-3 py-1 rounded-full text-sm border border-red-200 hover:bg-red-50"
              >
                {m.name} ({m.currentStock} {m.unit})
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">原材料列表</h2>
        <Link to="/inventory/materials/new" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增原材料
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">名稱</th>
              <th className="text-left px-4 py-3">類別</th>
              <th className="text-right px-4 py-3">庫存</th>
              <th className="text-right px-4 py-3">安全存量</th>
              <th className="text-right px-4 py-3">單位成本</th>
              <th className="text-center px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {materials.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/inventory/materials/${m.id}`} className="font-medium text-blue-600 hover:underline">
                    {m.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${categoryColors[m.category] || "bg-gray-100"}`}>
                    {m.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {m.currentStock} {m.unit}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  {m.minStock} {m.unit}
                </td>
                <td className="px-4 py-3 text-right text-gray-500">
                  NT$ {m.unitCost.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  {m.currentStock <= 0 ? (
                    <span className="text-red-600 text-xs font-medium">缺貨</span>
                  ) : m.currentStock <= m.minStock ? (
                    <span className="text-amber-600 text-xs font-medium">不足</span>
                  ) : (
                    <span className="text-green-600 text-xs">正常</span>
                  )}
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">尚無原材料，請先新增</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
