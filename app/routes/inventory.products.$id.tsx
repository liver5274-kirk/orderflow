import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const [product, materials] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { bomItems: { include: { material: true } } },
    }),
    prisma.material.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) throw new Response("Not Found", { status: 404 });
  return { product, materials };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "addBom") {
    const materialId = form.get("materialId") as string;
    const quantity = parseFloat(form.get("quantity") as string);
    if (!materialId || isNaN(quantity) || quantity <= 0) return { error: "請選擇原料並填寫有效用量" };

    await prisma.bOMItem.upsert({
      where: { productId_materialId: { productId: params.id!, materialId } },
      update: { quantity },
      create: { productId: params.id!, materialId, quantity },
    });
    return { success: true };
  }

  if (intent === "removeBom") {
    const bomId = form.get("bomId") as string;
    await prisma.bOMItem.delete({ where: { id: bomId } });
    return { success: true };
  }

  if (intent === "edit") {
    const name = form.get("name") as string;
    const price = parseFloat(form.get("price") as string) || 0;
    if (!name) return { error: "請填寫名稱" };
    await prisma.product.update({ where: { id: params.id }, data: { name, price } });
    return { success: true };
  }

  return { error: "未知操作" };
}

export default function ProductDetail() {
  const { product, materials } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  // Filter out materials already in BOM
  const availableMaterials = materials.filter(
    (m) => !product.bomItems.some((bi) => bi.materialId === m.id)
  );

  const totalCost = product.bomItems.reduce((sum, bi) => sum + bi.quantity * bi.material.unitCost, 0);

  return (
    <div className="max-w-2xl space-y-6">
      {data && "success" in data && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">已更新</div>}

      {/* Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">{product.name}</h2>
        <Form method="post" className="grid grid-cols-2 gap-4">
          <input type="hidden" name="intent" value="edit" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">名稱</label>
            <input name="name" defaultValue={product.name} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">售價</label>
            <input name="price" type="number" defaultValue={product.price} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div className="col-span-2 text-xs text-gray-400">
            原料成本合計：NT$ {totalCost.toFixed(2)}
            {totalCost > 0 && (
              <span className={totalCost > product.price ? "text-red-500 ml-2" : "text-green-500 ml-2"}>
                (毛利率 {((1 - totalCost / product.price) * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700">儲存</button>
        </Form>
      </div>

      {/* BOM Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-3">BOM 配方</h3>
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">原材料</th>
              <th className="text-right py-2">用量</th>
              <th className="text-right py-2">單位成本</th>
              <th className="text-right py-2">小計</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {product.bomItems.map((bi) => (
              <tr key={bi.id} className="text-gray-600">
                <td className="py-2">{bi.material.name}</td>
                <td className="py-2 text-right">{bi.quantity} {bi.material.unit}</td>
                <td className="py-2 text-right">NT$ {bi.material.unitCost.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">
                  NT$ {(bi.quantity * bi.material.unitCost).toFixed(2)}
                </td>
                <td className="py-2 text-right">
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="intent" value="removeBom" />
                    <input type="hidden" name="bomId" value={bi.id} />
                    <button type="submit" className="text-red-400 hover:text-red-600 text-xs">✕</button>
                  </Form>
                </td>
              </tr>
            ))}
            {product.bomItems.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4 text-gray-400">尚未設定配方，請新增原材料</td></tr>
            )}
          </tbody>
        </table>

        {/* Add BOM item */}
        {availableMaterials.length > 0 && (
          <Form method="post" className="flex gap-3 mt-4 pt-4 border-t">
            <input type="hidden" name="intent" value="addBom" />
            {data && "error" in data && <div className="text-red-500 text-xs">{data.error}</div>}
            <select name="materialId" className="flex-1 p-2.5 border rounded-lg text-sm">
              <option value="">選擇原材料...</option>
              {availableMaterials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
              ))}
            </select>
            <input name="quantity" type="number" step="0.01" min="0.01" className="w-24 p-2.5 border rounded-lg text-sm" placeholder="用量" />
            <button type="submit" className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-slate-700">加入</button>
          </Form>
        )}
        {availableMaterials.length === 0 && (
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t">所有原材料已加入配方 → <a href="/inventory/materials/new" className="text-blue-600 hover:underline">新增原材料</a></p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        ← 回 <a href="/inventory/products" className="text-blue-600 hover:underline">成品列表</a>
      </p>
    </div>
  );
}
