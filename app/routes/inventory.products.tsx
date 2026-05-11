import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { requireUserId } from "~/session.server";
import { prisma } from "~/db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  const products = await prisma.product.findMany({
    include: { bomItems: { include: { material: true } } },
    orderBy: { createdAt: "desc" },
  });
  return { products };
}

export default function ProductsList() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">成品與 BOM 配方</h2>
        <Link to="/inventory/products/new" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700">
          + 新增成品
        </Link>
      </div>

      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Link to={`/inventory/products/${p.id}`} className="font-semibold text-blue-600 hover:underline">
                  {p.name}
                </Link>
                {p.description && <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>}
              </div>
              <span className="text-sm font-medium">NT$ {p.price.toFixed(0)}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {p.bomItems.map((bi) => (
                <span key={bi.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs">
                  {bi.material.name}
                  <span className="text-gray-400">{bi.quantity}{bi.material.unit}</span>
                </span>
              ))}
              {p.bomItems.length === 0 && (
                <span className="text-xs text-gray-400">尚未設定配方</span>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-400">尚無成品，請先新增</div>
        )}
      </div>
    </div>
  );
}
