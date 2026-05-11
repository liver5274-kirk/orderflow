import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration,
  useLoaderData, useLocation, Form,
} from "@remix-run/react";
import { getUser } from "./session.server";
import tailwind from "./tailwind.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwind },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

const navItems = [
  { to: "/dashboard", label: "📊 儀表板", icon: "📊" },
  { to: "/orders", label: "📋 訂單管理", icon: "📋" },
  { to: "/customers", label: "👤 客戶管理", icon: "👤" },
  { to: "/reports", label: "📈 報表", icon: "📈" },
  { to: "/inventory/materials", label: "📦 庫存", icon: "📦" },
];

export default function App() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {user ? (
          <div className="flex h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-800 text-white flex flex-col">
              <div className="p-5 border-b border-slate-700">
                <h1 className="text-xl font-bold">📦 OrderFlow</h1>
                <p className="text-slate-400 text-sm mt-1">訂單管理系統</p>
              </div>
              <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.to}
                    href={item.to}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      location.pathname.startsWith(item.to)
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </a>
                ))}
              </nav>
              <div className="p-4 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{user.name}</span>
                  <Form method="post" action="/logout">
                    <button className="text-xs text-slate-400 hover:text-white">
                      登出
                    </button>
                  </Form>
                </div>
              </div>
            </aside>
            {/* Main content */}
            <main className="flex-1 overflow-auto p-8">
              <Outlet />
            </main>
          </div>
        ) : (
          <Outlet />
        )}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
