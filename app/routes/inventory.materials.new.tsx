import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name") as string;
  const category = form.get("category") as string;
  const unit = form.get("unit") as string;
  const currentStock = parseFloat(form.get("currentStock") as string) || 0;
  const minStock = parseFloat(form.get("minStock") as string) || 0;
  const unitCost = parseFloat(form.get("unitCost") as string) || 0;
  const notes = form.get("notes") as string;

  if (!name) return { error: "請填寫名稱" };

  const material = await prisma.material.create({
    data: { name, category, unit, currentStock, minStock, unitCost, notes },
  });

  // Log initial stock as transaction
  if (currentStock > 0) {
    await prisma.stockTransaction.create({
      data: {
        materialId: material.id, type: "進貨",
        quantity: currentStock, beforeStock: 0, afterStock: currentStock,
        reason: "初始庫存",
      },
    });
  }

  return redirect(`/inventory/materials/${material.id}`);
}

export default function NewMaterial() {
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4">🧪 新增原材料</h2>
      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data && "error" in data && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">名稱 <span className="text-red-500">*</span></label>
          <input name="name" required className="w-full p-2.5 border rounded-lg" placeholder="例：珍珠粉圓" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">類別</label>
            <select name="category" className="w-full p-2.5 border rounded-lg">
              <option value="原料">原料</option>
              <option value="包裝">包裝</option>
              <option value="耗材">耗材</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">單位</label>
            <select name="unit" className="w-full p-2.5 border rounded-lg">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="個">個</option>
              <option value="包">包</option>
              <option value="箱">箱</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">初始庫存</label>
            <input name="currentStock" type="number" step="0.1" min="0" className="w-full p-2.5 border rounded-lg" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">安全存量</label>
            <input name="minStock" type="number" step="0.1" min="0" className="w-full p-2.5 border rounded-lg" placeholder="10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">單位成本</label>
            <input name="unitCost" type="number" step="0.01" min="0" className="w-full p-2.5 border rounded-lg" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" rows={2} className="w-full p-2.5 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition">建立</button>
          <a href="/inventory/materials" className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">取消</a>
        </div>
      </Form>
    </div>
  );
}
