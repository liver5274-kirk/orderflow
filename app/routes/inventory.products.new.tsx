import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name") as string;
  const description = form.get("description") as string;
  const price = parseFloat(form.get("price") as string) || 0;

  if (!name) return { error: "請填寫成品名稱" };

  const product = await prisma.product.create({ data: { name, description, price } });
  return redirect(`/inventory/products/${product.id}`);
}

export default function NewProduct() {
  const data = useActionData<typeof action>();

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold mb-4">📋 新增成品</h2>
      <Form method="post" className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        {data && "error" in data && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">成品名稱 <span className="text-red-500">*</span></label>
          <input name="name" required className="w-full p-2.5 border rounded-lg" placeholder="例：珍珠奶茶" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">描述</label>
          <input name="description" className="w-full p-2.5 border rounded-lg" placeholder="例：700cc 經典款" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">售價</label>
          <input name="price" type="number" step="1" min="0" className="w-48 p-2.5 border rounded-lg" placeholder="0" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition">建立</button>
          <a href="/inventory/products" className="px-6 py-2.5 border rounded-lg hover:bg-gray-50">取消</a>
        </div>
      </Form>

      <p className="text-xs text-gray-400 mt-3">建立後可在成品詳情頁設定 BOM 配方（原材料用量）</p>
    </div>
  );
}
