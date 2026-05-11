import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: {
      supplier: true,
      items: { include: { material: true } },
    },
  });
  if (!po) throw new Response("Not Found", { status: 404 });

  const materials = await prisma.material.findMany({ orderBy: { category: "asc" } });
  return { po, materials };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!po) throw new Response("Not Found", { status: 404 });

  // ── Status transitions ──
  if (intent === "status") {
    const newStatus = form.get("status") as string;
    const validTransitions: Record<string, string[]> = {
      "待確認": ["已確認", "已取消"],
      "已確認": ["運送中", "已取消"],
      "運送中": ["已收貨", "已取消"],
      "已收貨": [],
      "已取消": [],
    };

    if (!validTransitions[po.status]?.includes(newStatus)) {
      return { error: `無法從「${po.status}」變更為「${newStatus}」` };
    }

    // If transitioning to "received", create stock transactions
    if (newStatus === "已收貨") {
      for (const item of po.items) {
        const material = await prisma.material.findUnique({ where: { id: item.materialId } });
        if (!material) continue;

        const beforeStock = material.currentStock;
        const afterStock = beforeStock + item.quantity;

        await prisma.stockTransaction.create({
          data: {
            materialId: item.materialId,
            type: "進貨",
            quantity: item.quantity,
            beforeStock,
            afterStock,
            reason: `採購單 ${po.orderNo} 收貨`,
            orderNo: po.orderNo,
          },
        });
        await prisma.material.update({
          where: { id: item.materialId },
          data: { currentStock: afterStock },
        });
      }
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus, receivedDate: new Date() },
      });
    } else {
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newStatus },
      });
    }

    return { success: true, message: `訂單狀態已更新為「${newStatus}」` };
  }

  // ── Add item ──
  if (intent === "addItem") {
    const materialId = form.get("materialId") as string;
    const quantity = parseFloat(form.get("quantity") as string);
    const unitPrice = parseFloat(form.get("unitPrice") as string) || 0;

    if (!materialId || isNaN(quantity) || quantity <= 0) {
      return { error: "請填寫完整物料資訊" };
    }

    const subtotal = Math.round(quantity * unitPrice * 100) / 100;

    try {
      await prisma.purchaseOrderItem.create({
        data: { purchaseOrderId: po.id, materialId, quantity, unitPrice, subtotal },
      });
    } catch {
      return { error: "該物料已存在於此採購單中" };
    }

    const newTotal = po.totalAmount + subtotal;
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { totalAmount: newTotal },
    });

    return { success: true, message: "物料已加入" };
  }

  // ── Remove item ──
  if (intent === "removeItem") {
    const itemId = form.get("itemId") as string;
    const item = await prisma.purchaseOrderItem.findUnique({ where: { id: itemId } });
    if (!item) return { error: "找不到該項目" };

    const newTotal = po.totalAmount - item.subtotal;
    await prisma.purchaseOrderItem.delete({ where: { id: itemId } });
    await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { totalAmount: newTotal },
    });

    return { success: true, message: "物料已移除" };
  }

  return { error: "未知操作" };
}

const statusColor: Record<string, string> = {
  "待確認": "bg-yellow-100 text-yellow-700",
  "已確認": "bg-blue-100 text-blue-700",
  "運送中": "bg-purple-100 text-purple-700",
  "已收貨": "bg-green-100 text-green-700",
  "已取消": "bg-gray-100 text-gray-500",
};

const statusProgress = ["待確認", "已確認", "運送中", "已收貨"];

export default function PurchaseOrderDetail() {
  const { po, materials } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  const isEditable = !["已收貨", "已取消"].includes(po.status);

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/suppliers/purchases" className="text-sm text-blue-600 hover:underline inline-block">
        ← 返回採購列表
      </Link>

      {data && "success" in data && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">{data.message}</div>
      )}
      {data && "error" in data && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
      )}

      {/* Order header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">採購單 {po.orderNo}</h2>
            <p className="text-sm text-gray-500">
              供應商：<Link to={`/suppliers/${po.supplierId}`} className="text-blue-600 hover:underline">{po.supplier.name}</Link>
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[po.status] || ""}`}>
            {po.status}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-4">
          {statusProgress.map((step, i) => {
            const currentIdx = statusProgress.indexOf(po.status);
            const isCompleted = currentIdx >= 0 && i <= currentIdx && po.status !== "已取消";
            const isCurrent = step === po.status && po.status !== "已取消";
            return (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`h-2 rounded-full flex-1 ${
                    isCurrent ? "bg-blue-500" : isCompleted ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
                {i < statusProgress.length - 1 && <div className="w-1" />}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          {statusProgress.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>

        {/* Status actions */}
        {isEditable && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {po.status === "待確認" && (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="status" />
                <input type="hidden" name="status" value="已確認" />
                <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700">
                  ✓ 確認訂單
                </button>
              </Form>
            )}
            {po.status === "已確認" && (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="status" />
                <input type="hidden" name="status" value="運送中" />
                <button className="bg-purple-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-purple-700">
                  🚚 標記運送中
                </button>
              </Form>
            )}
            {po.status === "運送中" && (
              <Form method="post" className="inline">
                <input type="hidden" name="intent" value="status" />
                <input type="hidden" name="status" value="已收貨" />
                <button className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700">
                  📦 確認收貨
                </button>
              </Form>
            )}
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="status" />
              <input type="hidden" name="status" value="已取消" />
              <button className="border border-red-300 text-red-600 px-4 py-1.5 rounded-lg text-sm hover:bg-red-50">
                取消訂單
              </button>
            </Form>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-3">採購明細</h3>
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">物料</th>
              <th className="text-right py-2">數量</th>
              <th className="text-right py-2">單價</th>
              <th className="text-right py-2">小計</th>
              {isEditable && <th className="text-center py-2 w-16" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {po.items.map((item) => (
              <tr key={item.id} className="text-gray-600">
                <td className="py-2">
                  <Link to={`/inventory/materials/${item.materialId}`} className="text-blue-600 hover:underline">
                    {item.material.name}
                  </Link>
                  <span className="text-gray-400 ml-1">({item.material.unit})</span>
                </td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">NT$ {item.unitPrice.toFixed(2)}</td>
                <td className="py-2 text-right font-medium">NT$ {item.subtotal.toFixed(2)}</td>
                {isEditable && (
                  <td className="py-2 text-center">
                    <Form method="post">
                      <input type="hidden" name="intent" value="removeItem" />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button className="text-red-400 hover:text-red-600 text-xs" title="移除">
                        ✕
                      </button>
                    </Form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td colSpan={3} className="py-3 text-right">總計</td>
              <td className="py-3 text-right">NT$ {po.totalAmount.toFixed(2)}</td>
              {isEditable && <td />}
            </tr>
          </tfoot>
        </table>

        {/* Add item form */}
        {isEditable && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">新增物料</p>
            <Form method="post" className="flex gap-2 items-start">
              <input type="hidden" name="intent" value="addItem" />
              <select name="materialId" required className="flex-1 p-2 border rounded-lg text-sm">
                <option value="">選擇物料...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>
              <input name="quantity" type="number" step="0.1" min="0.1" required className="w-20 p-2 border rounded-lg text-sm" placeholder="數量" />
              <input name="unitPrice" type="number" step="0.01" min="0" className="w-24 p-2 border rounded-lg text-sm" placeholder="單價" />
              <button type="submit" className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-700">
                + 加入
              </button>
            </Form>
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="bg-white rounded-xl shadow-sm p-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">下單日期：</span>
          {new Date(po.orderDate).toLocaleDateString("zh-TW")}
        </div>
        <div>
          <span className="text-gray-500">預計到貨：</span>
          {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("zh-TW") : "—"}
        </div>
        <div>
          <span className="text-gray-500">實際收貨：</span>
          {po.receivedDate ? new Date(po.receivedDate).toLocaleDateString("zh-TW") : "—"}
        </div>
        <div>
          <span className="text-gray-500">付款條件：</span>
          {po.supplier.paymentTerms}
        </div>
        {po.notes && (
          <div className="col-span-2">
            <span className="text-gray-500">備註：</span>
            {po.notes}
          </div>
        )}
      </div>
    </div>
  );
}
