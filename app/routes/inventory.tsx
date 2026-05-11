import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLocation, NavLink } from "@remix-run/react";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return {};
}

export default function InventoryLayout() {
  const location = useLocation();
  const isIndex = location.pathname === "/inventory";

  const tabs = [
    { to: "/inventory/materials", label: "🧪 原材料庫存" },
    { to: "/inventory/products", label: "📋 BOM 配方管理" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📦 庫存與 BOM</h1>
      <nav className="flex gap-1 mb-6 border-b">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-t-lg transition ${
                isActive
                  ? "bg-white text-slate-800 border border-b-0"
                  : "text-gray-500 hover:text-gray-700"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
