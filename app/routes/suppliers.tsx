import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, NavLink } from "@remix-run/react";
import { requireUserId } from "~/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUserId(request);
  return {};
}

export default function SuppliersLayout() {
  const tabs = [
    { to: "/suppliers/list", label: "🏭 供應商" },
    { to: "/suppliers/purchases", label: "📋 採購訂單" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔗 供應鏈管理</h1>
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
