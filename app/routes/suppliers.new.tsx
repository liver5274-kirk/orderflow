import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, Link } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();

  const name = (form.get("name") as string)?.trim();
  if (!name) return { error: "請填寫供應商名稱" };

  const contactPerson = (form.get("contactPerson") as string)?.trim() || "";
  const phone = (form.get("phone") as string)?.trim() || "";
  const email = (form.get("email") as string)?.trim() || "";
  const address = (form.get("address") as string)?.trim() || "";
  const taxId = (form.get("taxId") as string)?.trim() || "";
  const paymentTerms = (form.get("paymentTerms") as string)?.trim() || "月結30天";
  const notes = (form.get("notes") as string)?.trim() || "";

  await prisma.supplier.create({
    data: { name, contactPerson, phone, email, address, taxId, paymentTerms, notes },
  });

  return redirect("/suppliers/list");
}

export default function NewSupplier() {
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <Link to="/suppliers/list" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        ← 返回供應商列表
      </Link>
      <h2 className="text-lg font-semibold mb-4">新增供應商</h2>

      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data && "error" in data && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            供應商名稱 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            className="w-full p-2.5 border rounded-lg"
            placeholder="例：台糖公司"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">聯絡人</label>
            <input name="contactPerson" className="w-full p-2.5 border rounded-lg" placeholder="例：王大明" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">電話</label>
            <input name="phone" className="w-full p-2.5 border rounded-lg" placeholder="例：02-1234-5678" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" className="w-full p-2.5 border rounded-lg" placeholder="example@supplier.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">統一編號</label>
            <input name="taxId" className="w-full p-2.5 border rounded-lg" placeholder="例：12345678" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">地址</label>
          <input name="address" className="w-full p-2.5 border rounded-lg" placeholder="例：台北市中山區..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">付款條件</label>
            <select name="paymentTerms" defaultValue="月結30天" className="w-full p-2.5 border rounded-lg">
              <option value="現金">現金</option>
              <option value="月結30天">月結30天</option>
              <option value="月結60天">月結60天</option>
              <option value="貨到付款">貨到付款</option>
            </select>
          </div>
          <div />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">備註</label>
          <textarea name="notes" className="w-full p-2.5 border rounded-lg" rows={3} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700">
            建立供應商
          </button>
          <Link to="/suppliers/list" className="px-6 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">
            取消
          </Link>
        </div>
      </Form>
    </div>
  );
}
