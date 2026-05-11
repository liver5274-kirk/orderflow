import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      bomItems: { include: { product: { select: { name: true } } } },
    },
  });
  if (!material) throw new Response("Not Found", { status: 404 });
  return { material };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  const material = await prisma.material.findUnique({ where: { id: params.id } });
  if (!material) throw new Response("Not Found", { status: 404 });

  // Stock adjustment
  if (intent === "adjust") {
    const type = form.get("type") as string;
    const qty = parseFloat(form.get("quantity") as string);
    const reason = form.get("reason") as string;

    if (isNaN(qty) || qty <= 0) return { error: "請輸入有效數量" };
    const beforeStock = material.currentStock;
    const afterStock = type === "進貨" ? beforeStock + qty : type === "消耗" ? beforeStock - qty : qty;

    await prisma.stockTransaction.create({
      data: { materialId: material.id, type, quantity: qty, beforeStock, afterStock, reason },
    });
    await prisma.material.update({
      where: { id: material.id },
      data: { currentStock: afterStock },
    });
    return { success: true };
  }

  // Edit material info
  const name = form.get("name") as string;
  const unitCost = parseFloat(form.get("unitCost") as string) || 0;
  const minStock = parseFloat(form.get("minStock") as string) || 0;
  if (!name) return { error: "請填寫名稱" };

  await prisma.material.update({
    where: { id: material.id },
    data: { name, unitCost, minStock },
  });
  return { success: true };
}

const typeColor: Record<string, string> = {
  進貨: "text-green-600", 消耗: "text-red-600", 調整: "text-blue-600", 報廢: "text-gray-500",
};

export default function MaterialDetail() {
  const { material } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-2xl space-y-6">
      {data && "success" in data && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">已更新</div>}

      {/* Info card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{material.name}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            material.currentStock <= 0 ? "bg-red-100 text-red-700" :
            material.currentStock <= material.minStock ? "bg-amber-100 text-amber-700" :
            "bg-green-100 text-green-700"
          }`}>
            庫存: {material.currentStock} {material.unit}
          </span>
        </div>

        <Form method="post" className="grid grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="intent" value="edit" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">名稱</label>
            <input name="name" defaultValue={material.name} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">單位成本</label>
            <input name="unitCost" type="number" step="0.01" defaultValue={material.unitCost} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">安全存量</label>
            <input name="minStock" type="number" step="0.1" defaultValue={material.minStock} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="col-span-3">
            <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700">儲存</button>
          </div>
        </Form>
      </div>

      {/* Stock adjustment form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-3">庫存異動</h3>
        <Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="adjust" />
          {data && "error" in data && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}
          <div className="flex gap-3">
            <select name="type" className="p-2.5 border rounded-lg w-28">
              <option value="進貨">進貨</option>
              <option value="消耗">消耗</option>
              <option value="調整">調整</option>
              <option value="報廢">報廢</option>
            </select>
            <input name="quantity" type="number" step="0.1" min="0.1" required className="w-32 p-2.5 border rounded-lg" placeholder="數量" />
            <span className="self-center text-gray-400">{material.unit}</span>
            <input name="reason" className="flex-1 p-2.5 border rounded-lg" placeholder="原因（選填）" />
            <button type="submit" className="bg-slate-800 text-white px-4 py-2.5 rounded-lg hover:bg-slate-700">執行</button>
          </div>
        </Form>
      </div>

      {/* BOM usage */}
      {material.bomItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-3">使用此原料的成品</h3>
          <div className="space-y-1 text-sm">
            {material.bomItems.map((bi) => (
              <div key={bi.id} className="flex justify-between">
                <span>{bi.product.name}</span>
                <span className="text-gray-500">{bi.quantity} {material.unit}／份</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-3">異動記錄</h3>
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">時間</th>
              <th className="text-center py-2">類型</th>
              <th className="text-right py-2">數量</th>
              <th className="text-right py-2">異動前</th>
              <th className="text-right py-2">異動後</th>
              <th className="text-left py-2">原因</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {material.transactions.map((t) => (
              <tr key={t.id} className="text-gray-600">
                <td className="py-2">{new Date(t.createdAt).toLocaleString("zh-TW")}</td>
                <td className={`py-2 text-center font-medium ${typeColor[t.type] || ""}`}>{t.type}</td>
                <td className="py-2 text-right">{t.quantity} {material.unit}</td>
                <td className="py-2 text-right">{t.beforeStock}</td>
                <td className="py-2 text-right">{t.afterStock}</td>
                <td className="py-2">{t.reason}</td>
              </tr>
            ))}
            {material.transactions.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-gray-400">尚無異動記錄</td></tr>
            )}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-3">← 回 <a href="/inventory/materials" className="text-blue-600 hover:underline">原材料列表</a></p>
      </div>
    </div>
  );
}
