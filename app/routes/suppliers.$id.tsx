import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData, Link } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      materials: true,
      purchaseOrders: {
        orderBy: { orderDate: "desc" },
        take: 20,
        include: { items: { include: { material: true } } },
      },
    },
  });
  if (!supplier) throw new Response("Not Found", { status: 404 });
  return { supplier };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "edit") {
    const name = (form.get("name") as string)?.trim();
    if (!name) return { error: "請填寫供應商名稱" };

    await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name,
        contactPerson: (form.get("contactPerson") as string)?.trim() || "",
        phone: (form.get("phone") as string)?.trim() || "",
        email: (form.get("email") as string)?.trim() || "",
        address: (form.get("address") as string)?.trim() || "",
        taxId: (form.get("taxId") as string)?.trim() || "",
        paymentTerms: (form.get("paymentTerms") as string)?.trim() || "月結30天",
        notes: (form.get("notes") as string)?.trim() || "",
      },
    });
    return { success: true };
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

export default function SupplierDetail() {
  const { supplier } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-3xl space-y-6">
      <Link to="/suppliers/list" className="text-sm text-blue-600 hover:underline inline-block">
        ← 返回供應商列表
      </Link>

      {data && "success" in data && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">已更新</div>
      )}

      {/* Edit Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">供應商資訊</h2>
        <Form method="post" className="space-y-4 text-sm">
          <input type="hidden" name="intent" value="edit" />
          {data && "error" in data && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">供應商名稱</label>
            <input name="name" defaultValue={supplier.name} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">聯絡人</label>
              <input name="contactPerson" defaultValue={supplier.contactPerson} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">電話</label>
              <input name="phone" defaultValue={supplier.phone} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input name="email" defaultValue={supplier.email} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">統一編號</label>
              <input name="taxId" defaultValue={supplier.taxId} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">地址</label>
            <input name="address" defaultValue={supplier.address} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">付款條件</label>
              <select name="paymentTerms" defaultValue={supplier.paymentTerms} className="w-full p-2 border rounded-lg">
                <option value="現金">現金</option>
                <option value="月結30天">月結30天</option>
                <option value="月結60天">月結60天</option>
                <option value="貨到付款">貨到付款</option>
              </select>
            </div>
            <div />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">備註</label>
            <textarea name="notes" defaultValue={supplier.notes} className="w-full p-2 border rounded-lg" rows={2} />
          </div>

          <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700">
            儲存
          </button>
        </Form>
      </div>

      {/* Supplied Materials */}
      {supplier.materials.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-3">供應物料</h3>
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">物料名稱</th>
                <th className="text-left py-2">類別</th>
                <th className="text-right py-2">庫存</th>
                <th className="text-right py-2">單價</th>
                <th className="text-center py-2">狀態</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supplier.materials.map((m) => (
                <tr key={m.id} className="text-gray-600">
                  <td className="py-2">
                    <Link to={`/inventory/materials/${m.id}`} className="text-blue-600 hover:underline">
                      {m.name}
                    </Link>
                  </td>
                  <td className="py-2">{m.category}</td>
                  <td className="py-2 text-right">{m.currentStock} {m.unit}</td>
                  <td className="py-2 text-right">NT$ {m.unitCost.toFixed(2)}</td>
                  <td className="py-2 text-center">
                    {m.currentStock <= m.minStock ? (
                      <span className="text-red-600 text-xs font-medium">低庫存</span>
                    ) : (
                      <span className="text-green-600 text-xs">正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-3">採購記錄</h3>
        {supplier.purchaseOrders.length === 0 ? (
          <p className="text-gray-400 text-sm">尚無採購記錄</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">訂單編號</th>
                <th className="text-center py-2">狀態</th>
                <th className="text-right py-2">金額</th>
                <th className="text-left py-2">下單日期</th>
                <th className="text-left py-2">預計到貨</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {supplier.purchaseOrders.map((po) => (
                <tr key={po.id} className="text-gray-600">
                  <td className="py-2">
                    <Link to={`/suppliers/purchases/${po.id}`} className="text-blue-600 hover:underline">
                      {po.orderNo}
                    </Link>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor[po.status] || ""}`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">NT$ {po.totalAmount.toFixed(2)}</td>
                  <td className="py-2">{new Date(po.orderDate).toLocaleDateString("zh-TW")}</td>
                  <td className="py-2">
                    {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString("zh-TW") : "—"}
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
