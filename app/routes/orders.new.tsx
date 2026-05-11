import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
  return { customers };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const customerId = form.get("customerId") as string;
  const amount = parseFloat(form.get("amount") as string);
  const status = form.get("status") as string;
  const notes = form.get("notes") as string;
  const orderDate = form.get("orderDate") as string;

  if (!customerId || isNaN(amount) || amount <= 0) {
    return { error: "請填寫客戶與有效金額" };
  }

  const date = new Date();
  const orderNo = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(Date.now() % 100000).padStart(5, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderNo, amount, status: status || "pending", notes,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      customerId, createdBy: userId,
    },
  });

  return redirect(`/orders/${order.id}`);
}

export default function NewOrder() {
  const { customers } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">📋 新增訂單</h1>
      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data?.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">客戶 <span className="text-red-500">*</span></label>
          <select name="customerId" required className="w-full p-2.5 border rounded-lg">
            <option value="">選擇客戶</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">找不到客戶？<a href="/customers/new" className="text-blue-600">新增客戶</a></p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">金額 <span className="text-red-500">*</span></label>
            <input name="amount" type="number" step="0.01" min="0" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">訂單日期</label>
            <input name="orderDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full p-2.5 border rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">狀態</label>
          <select name="status" className="w-full p-2.5 border rounded-lg">
            <option value="pending">待處理</option>
            <option value="processing">處理中</option>
            <option value="completed">已完成</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" rows={3} className="w-full p-2.5 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition">建立訂單</button>
          <a href="/orders" className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">取消</a>
        </div>
      </Form>
    </div>
  );
}
