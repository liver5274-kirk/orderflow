import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUserId(request);
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { customer: true, user: { select: { name: true } } },
  });
  if (!order) throw new Response("Not Found", { status: 404 });
  return { order };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "delete") {
    await prisma.order.update({ where: { id: params.id }, data: { deleted: true } });
    return redirect("/orders");
  }

  const amount = parseFloat(form.get("amount") as string);
  const status = form.get("status") as string;
  const notes = form.get("notes") as string;

  if (isNaN(amount) || amount <= 0) return { error: "請輸入有效金額" };

  await prisma.order.update({
    where: { id: params.id },
    data: { amount, status, notes },
  });
  return { success: true };
}

const statusMap: Record<string, string> = {
  pending: "待處理", processing: "處理中", completed: "已完成", cancelled: "已取消",
};

export default function OrderDetail() {
  const { order } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">訂單 {order.orderNo}</h1>
        <a href="/orders" className="text-gray-500 hover:text-gray-700">← 回列表</a>
      </div>

      {data?.success && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">已更新</div>}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-3">訂單資訊</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">客戶：</span>{order.customer.name}</div>
          <div><span className="text-gray-500">建立者：</span>{order.user.name}</div>
          <div><span className="text-gray-500">建立時間：</span>{new Date(order.createdAt).toLocaleString("zh-TW")}</div>
          <div><span className="text-gray-500">訂單日期：</span>{new Date(order.orderDate).toLocaleDateString("zh-TW")}</div>
        </div>
      </div>

      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data?.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">金額</label>
            <input name="amount" type="number" step="0.01" defaultValue={order.amount} className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">狀態</label>
            <select name="status" defaultValue={order.status} className="w-full p-2.5 border rounded-lg">
              <option value="pending">待處理</option>
              <option value="processing">處理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" rows={3} defaultValue={order.notes} className="w-full p-2.5 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition">儲存變更</button>
          <button type="submit" name="intent" value="delete" className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
            onClick={(e) => { if (!confirm("確定刪除此訂單？")) e.preventDefault(); }}>
            刪除訂單
          </button>
        </div>
      </Form>
    </div>
  );
}
