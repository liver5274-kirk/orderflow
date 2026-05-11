import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  const materials = await prisma.material.findMany({
    orderBy: { category: "asc" },
  });
  return { suppliers, materials };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();

  const supplierId = form.get("supplierId") as string;
  if (!supplierId) return { error: "請選擇供應商" };

  const expectedDateStr = (form.get("expectedDate") as string) || "";
  const notes = (form.get("notes") as string)?.trim() || "";

  // Parse items from form: itemMaterialId[], itemQuantity[], itemUnitPrice[]
  const materialIds = form.getAll("itemMaterialId") as string[];
  const quantities = form.getAll("itemQuantity") as string[];
  const unitPrices = form.getAll("itemUnitPrice") as string[];

  if (materialIds.length === 0) return { error: "請至少新增一項物料" };

  type Item = { materialId: string; quantity: number; unitPrice: number; subtotal: number };
  const items: Item[] = [];
  let totalAmount = 0;

  for (let i = 0; i < materialIds.length; i++) {
    const mid = materialIds[i];
    const qty = parseFloat(quantities[i]);
    const price = parseFloat(unitPrices[i]);

    if (!mid || isNaN(qty) || qty <= 0) continue;
    const subtotal = Math.round(qty * price * 100) / 100;
    totalAmount += subtotal;
    items.push({ materialId: mid, quantity: qty, unitPrice: isNaN(price) ? 0 : price, subtotal });
  }

  if (items.length === 0) return { error: "沒有有效的物料項目" };

  // Generate order number: PO-YYYYMMDD-XXX
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.purchaseOrder.count({
    where: { orderNo: { startsWith: `PO-${today}` } },
  });
  const orderNo = `PO-${today}-${String(count + 1).padStart(3, "0")}`;

  await prisma.purchaseOrder.create({
    data: {
      orderNo,
      supplierId,
      status: "待確認",
      totalAmount,
      orderDate: new Date(),
      expectedDate: expectedDateStr ? new Date(expectedDateStr) : null,
      notes,
      items: {
        create: items.map((item) => ({
          materialId: item.materialId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      },
    },
  });

  return redirect(`/suppliers/purchases`);
}

export default function NewPurchaseOrder() {
  const { suppliers, materials } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-2xl">
      <Link to="/suppliers/purchases" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← 返回採購列表
      </Link>
      <h2 className="text-lg font-semibold mb-4">新增採購單</h2>

      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data && "error" in data && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
        )}

        {/* Step 1: Select supplier */}
        <div>
          <label className="block text-sm font-medium mb-1">
            供應商 <span className="text-red-500">*</span>
          </label>
          <select name="supplierId" required className="w-full p-2.5 border rounded-lg">
            <option value="">請選擇供應商...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {suppliers.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              尚無供應商，請先<Link to="/suppliers/new" className="underline">新增供應商</Link>
            </p>
          )}
        </div>

        {/* Step 2: Add materials */}
        <div>
          <label className="block text-sm font-medium mb-2">訂購物料</label>
          <p className="text-xs text-gray-400 mb-2">
            以下為 JavaScript 輔助欄位（前端計算），使用 JavaScript 動態新增行。
            如需多行物料，請先儲存後再到詳情頁編輯。
          </p>

          {/* Single static line */}
          <div className="flex gap-2 items-start mb-2">
            <select name="itemMaterialId" className="flex-1 p-2 border rounded-lg">
              <option value="">選擇物料...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category}) — 庫存 {m.currentStock} {m.unit}
                </option>
              ))}
            </select>
            <input
              name="itemQuantity"
              type="number"
              step="0.1"
              min="0.1"
              required
              className="w-24 p-2 border rounded-lg"
              placeholder="數量"
            />
            <input
              name="itemUnitPrice"
              type="number"
              step="0.01"
              min="0"
              className="w-28 p-2 border rounded-lg"
              placeholder="單價"
            />
            <span className="self-center text-xs text-gray-400">NT$</span>
          </div>
          <p className="text-xs text-gray-400">
            💡 目前支援單項物料。如需多項，請在建立後到詳情頁新增。
          </p>
        </div>

        {/* Step 3: Expected date & notes */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">預計到貨日</label>
            <input name="expectedDate" type="date" className="w-full p-2.5 border rounded-lg" />
          </div>
          <div />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" className="w-full p-2.5 border rounded-lg" rows={2} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700">
            建立採購單
          </button>
          <Link to="/suppliers/purchases" className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">
            取消
          </Link>
        </div>
      </Form>
    </div>
  );
}
