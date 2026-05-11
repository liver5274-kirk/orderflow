import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form, useSearchParams } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { customers, search };
}

export default function Customers() {
  const { customers, search } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">👤 客戶管理</h1>
        <a href="/customers/new" className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition">
          + 新增客戶
        </a>
      </div>

      <Form className="flex gap-3 mb-6">
        <input name="q" defaultValue={search} placeholder="搜尋客戶名稱/電話/Email..." className="flex-1 p-2 border rounded-lg" />
        <button type="submit" className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">搜尋</button>
      </Form>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3">客戶名稱</th>
              <th className="text-left px-6 py-3">電話</th>
              <th className="text-left px-6 py-3">Email</th>
              <th className="text-center px-6 py-3">訂單數</th>
              <th className="text-right px-6 py-3">加入日期</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <a href={`/customers/${c.id}`} className="font-medium text-blue-600 hover:underline">{c.name}</a>
                </td>
                <td className="px-6 py-3 text-gray-600">{c.phone || "-"}</td>
                <td className="px-6 py-3 text-gray-600">{c.email || "-"}</td>
                <td className="px-6 py-3 text-center">{c._count.orders}</td>
                <td className="px-6 py-3 text-right text-gray-500">
                  {new Date(c.createdAt).toLocaleDateString("zh-TW")}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">尚無客戶</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
