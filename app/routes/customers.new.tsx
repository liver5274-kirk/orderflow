import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader() {
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name") as string;
  const phone = form.get("phone") as string;
  const email = form.get("email") as string;
  const address = form.get("address") as string;
  const notes = form.get("notes") as string;

  if (!name) return { error: "請填寫客戶名稱" };

  const customer = await prisma.customer.create({
    data: { name, phone, email, address, notes },
  });

  return redirect(`/customers/${customer.id}`);
}

export default function NewCustomer() {
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">👤 新增客戶</h1>
      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data?.error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">客戶名稱 <span className="text-red-500">*</span></label>
          <input name="name" required className="w-full p-2.5 border rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">電話</label>
            <input name="phone" className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" className="w-full p-2.5 border rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">地址</label>
          <input name="address" className="w-full p-2.5 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" rows={3} className="w-full p-2.5 border rounded-lg" />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition">建立客戶</button>
          <a href="/customers" className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">取消</a>
        </div>
      </Form>
    </div>
  );
}
