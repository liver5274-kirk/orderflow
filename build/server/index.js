import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, createCookieSessionStorage, redirect } from "@remix-run/node";
import { RemixServer, useLoaderData, useLocation, Meta, Links, Form, Outlet, ScrollRestoration, Scripts, LiveReload, useActionData } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Cell } from "recharts";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) : handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext);
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url, abortDelay: ABORT_DELAY }),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, { headers: responseHeaders, status: responseStatusCode })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(RemixServer, { context: remixContext, url: request.url, abortDelay: ABORT_DELAY }),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, { headers: responseHeaders, status: responseStatusCode })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  prisma = global.__prisma;
}
const sessionSecret = process.env.SESSION_SECRET || "orderflow-dev-secret-change-in-prod";
const storage = createCookieSessionStorage({
  cookie: {
    name: "orderflow_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    // 7 days
    httpOnly: true
  }
});
async function createUserSession(userId, redirectTo) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await storage.commitSession(session) }
  });
}
async function getUserSession(request) {
  return storage.getSession(request.headers.get("Cookie"));
}
async function getUserId(request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}
async function requireUserId(request, redirectTo = "/login") {
  const userId = await getUserId(request);
  if (!userId) throw redirect(redirectTo);
  return userId;
}
async function getUser(request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
}
async function logout(request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: { "Set-Cookie": await storage.destroySession(session) }
  });
}
async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await bcryptjs.compare(password, user.password);
  if (!valid) return null;
  return user;
}
async function register(email, password, name) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "此 Email 已註冊" };
  const hashed = await bcryptjs.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, name }
  });
  return { user };
}
const tailwind = "/assets/tailwind-BzcP3xTv.css";
const links = () => [
  { rel: "stylesheet", href: tailwind }
];
async function loader$c({ request }) {
  const user = await getUser(request);
  return { user };
}
const navItems = [
  { to: "/dashboard", label: "📊 儀表板", icon: "📊" },
  { to: "/orders", label: "📋 訂單管理", icon: "📋" },
  { to: "/customers", label: "👤 客戶管理", icon: "👤" },
  { to: "/reports", label: "📈 報表", icon: "📈" }
];
function App() {
  const { user } = useLoaderData();
  const location = useLocation();
  return /* @__PURE__ */ jsxs("html", { lang: "zh-TW", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { className: "bg-gray-50 min-h-screen", children: [
      user ? /* @__PURE__ */ jsxs("div", { className: "flex h-screen", children: [
        /* @__PURE__ */ jsxs("aside", { className: "w-64 bg-slate-800 text-white flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-700", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "📦 OrderFlow" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm mt-1", children: "訂單管理系統" })
          ] }),
          /* @__PURE__ */ jsx("nav", { className: "flex-1 p-3 space-y-1", children: navItems.map((item) => /* @__PURE__ */ jsxs(
            "a",
            {
              href: item.to,
              className: `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${location.pathname.startsWith(item.to) ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}`,
              children: [
                /* @__PURE__ */ jsx("span", { children: item.icon }),
                item.label
              ]
            },
            item.to
          )) }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-700", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-300", children: user.name }),
            /* @__PURE__ */ jsx(Form, { method: "post", action: "/logout", children: /* @__PURE__ */ jsx("button", { className: "text-xs text-slate-400 hover:text-white", children: "登出" }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsx("main", { className: "flex-1 overflow-auto p-8", children: /* @__PURE__ */ jsx(Outlet, {}) })
      ] }) : /* @__PURE__ */ jsx(Outlet, {}),
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {}),
      /* @__PURE__ */ jsx(LiveReload, {})
    ] })
  ] });
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App,
  links,
  loader: loader$c
}, Symbol.toStringTag, { value: "Module" }));
async function loader$b({ request, params }) {
  await requireUserId(request);
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      orders: { where: { deleted: false }, orderBy: { createdAt: "desc" } }
    }
  });
  if (!customer) throw new Response("Not Found", { status: 404 });
  return { customer };
}
const statusMap$2 = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  cancelled: "已取消"
};
const statusColor$2 = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function CustomerDetail() {
  const { customer } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
        "👤 ",
        customer.name
      ] }),
      /* @__PURE__ */ jsx("a", { href: "/customers", className: "text-gray-500 hover:text-gray-700", children: "← 回列表" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "客戶資訊" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "電話：" }),
          customer.phone || "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Email：" }),
          customer.email || "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "地址：" }),
          customer.address || "-"
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "加入日期：" }),
          new Date(customer.createdAt).toLocaleDateString("zh-TW")
        ] })
      ] }),
      customer.notes && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "備註：" }),
        customer.notes
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-semibold mb-4", children: [
        "歷史訂單 (",
        customer.orders.length,
        ")"
      ] }),
      customer.orders.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-sm", children: "尚無訂單" }) : /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-2", children: "訂單編號" }),
          /* @__PURE__ */ jsx("th", { className: "text-right py-2", children: "金額" }),
          /* @__PURE__ */ jsx("th", { className: "text-center py-2", children: "狀態" }),
          /* @__PURE__ */ jsx("th", { className: "text-right py-2", children: "日期" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: customer.orders.map((o) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2", children: /* @__PURE__ */ jsx("a", { href: `/orders/${o.id}`, className: "text-blue-600 hover:underline", children: o.orderNo }) }),
          /* @__PURE__ */ jsxs("td", { className: "py-2 text-right", children: [
            "NT$ ",
            o.amount.toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${statusColor$2[o.status]}`, children: statusMap$2[o.status] || o.status }) }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-right text-gray-500", children: new Date(o.orderDate).toLocaleDateString("zh-TW") })
        ] }, o.id)) })
      ] })
    ] })
  ] });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: CustomerDetail,
  loader: loader$b
}, Symbol.toStringTag, { value: "Module" }));
async function loader$a() {
  return {};
}
async function action$5({ request }) {
  await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name");
  const phone = form.get("phone");
  const email = form.get("email");
  const address = form.get("address");
  const notes = form.get("notes");
  if (!name) return { error: "請填寫客戶名稱" };
  const customer = await prisma.customer.create({
    data: { name, phone, email, address, notes }
  });
  return redirect(`/customers/${customer.id}`);
}
function NewCustomer() {
  const data = useActionData();
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "👤 新增客戶" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "bg-white rounded-xl shadow-sm p-6 space-y-4", children: [
      (data == null ? void 0 : data.error) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: data.error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium mb-1", children: [
          "客戶名稱 ",
          /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
        ] }),
        /* @__PURE__ */ jsx("input", { name: "name", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "電話" }),
          /* @__PURE__ */ jsx("input", { name: "phone", className: "w-full p-2.5 border rounded-lg" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "Email" }),
          /* @__PURE__ */ jsx("input", { name: "email", type: "email", className: "w-full p-2.5 border rounded-lg" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "地址" }),
        /* @__PURE__ */ jsx("input", { name: "address", className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "備註" }),
        /* @__PURE__ */ jsx("textarea", { name: "notes", rows: 3, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition", children: "建立客戶" }),
        /* @__PURE__ */ jsx("a", { href: "/customers", className: "px-6 py-2.5 border rounded-lg hover:bg-gray-50", children: "取消" })
      ] })
    ] })
  ] });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$5,
  default: NewCustomer,
  loader: loader$a
}, Symbol.toStringTag, { value: "Module" }));
async function loader$9({ request, params }) {
  await requireUserId(request);
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { customer: true, user: { select: { name: true } } }
  });
  if (!order) throw new Response("Not Found", { status: 404 });
  return { order };
}
async function action$4({ request, params }) {
  await requireUserId(request);
  const form = await request.formData();
  const intent = form.get("intent");
  if (intent === "delete") {
    await prisma.order.update({ where: { id: params.id }, data: { deleted: true } });
    return redirect("/orders");
  }
  const amount = parseFloat(form.get("amount"));
  const status = form.get("status");
  const notes = form.get("notes");
  if (isNaN(amount) || amount <= 0) return { error: "請輸入有效金額" };
  await prisma.order.update({
    where: { id: params.id },
    data: { amount, status, notes }
  });
  return { success: true };
}
function OrderDetail() {
  const { order } = useLoaderData();
  const data = useActionData();
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold", children: [
        "訂單 ",
        order.orderNo
      ] }),
      /* @__PURE__ */ jsx("a", { href: "/orders", className: "text-gray-500 hover:text-gray-700", children: "← 回列表" })
    ] }),
    (data == null ? void 0 : data.success) && /* @__PURE__ */ jsx("div", { className: "bg-green-50 text-green-600 p-3 rounded-lg mb-4", children: "已更新" }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 mb-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-semibold mb-3", children: "訂單資訊" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "客戶：" }),
          order.customer.name
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "建立者：" }),
          order.user.name
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "建立時間：" }),
          new Date(order.createdAt).toLocaleString("zh-TW")
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "訂單日期：" }),
          new Date(order.orderDate).toLocaleDateString("zh-TW")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "bg-white rounded-xl shadow-sm p-6 space-y-4", children: [
      (data == null ? void 0 : data.error) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: data.error }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "金額" }),
          /* @__PURE__ */ jsx("input", { name: "amount", type: "number", step: "0.01", defaultValue: order.amount, className: "w-full p-2.5 border rounded-lg" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "狀態" }),
          /* @__PURE__ */ jsxs("select", { name: "status", defaultValue: order.status, className: "w-full p-2.5 border rounded-lg", children: [
            /* @__PURE__ */ jsx("option", { value: "pending", children: "待處理" }),
            /* @__PURE__ */ jsx("option", { value: "processing", children: "處理中" }),
            /* @__PURE__ */ jsx("option", { value: "completed", children: "已完成" }),
            /* @__PURE__ */ jsx("option", { value: "cancelled", children: "已取消" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "備註" }),
        /* @__PURE__ */ jsx("textarea", { name: "notes", rows: 3, defaultValue: order.notes, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition", children: "儲存變更" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            name: "intent",
            value: "delete",
            className: "px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50",
            onClick: (e) => {
              if (!confirm("確定刪除此訂單？")) e.preventDefault();
            },
            children: "刪除訂單"
          }
        )
      ] })
    ] })
  ] });
}
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4,
  default: OrderDetail,
  loader: loader$9
}, Symbol.toStringTag, { value: "Module" }));
async function loader$8({ request }) {
  await requireUserId(request);
  const customers = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
  return { customers };
}
async function action$3({ request }) {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const customerId = form.get("customerId");
  const amount = parseFloat(form.get("amount"));
  const status = form.get("status");
  const notes = form.get("notes");
  const orderDate = form.get("orderDate");
  if (!customerId || isNaN(amount) || amount <= 0) {
    return { error: "請填寫客戶與有效金額" };
  }
  const date = /* @__PURE__ */ new Date();
  const orderNo = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(Date.now() % 1e5).padStart(5, "0")}`;
  const order = await prisma.order.create({
    data: {
      orderNo,
      amount,
      status: status || "pending",
      notes,
      orderDate: orderDate ? new Date(orderDate) : /* @__PURE__ */ new Date(),
      customerId,
      createdBy: userId
    }
  });
  return redirect(`/orders/${order.id}`);
}
function NewOrder() {
  const { customers } = useLoaderData();
  const data = useActionData();
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "📋 新增訂單" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "bg-white rounded-xl shadow-sm p-6 space-y-4", children: [
      (data == null ? void 0 : data.error) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: data.error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium mb-1", children: [
          "客戶 ",
          /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
        ] }),
        /* @__PURE__ */ jsxs("select", { name: "customerId", required: true, className: "w-full p-2.5 border rounded-lg", children: [
          /* @__PURE__ */ jsx("option", { value: "", children: "選擇客戶" }),
          customers.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.name }, c.id))
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 mt-1", children: [
          "找不到客戶？",
          /* @__PURE__ */ jsx("a", { href: "/customers/new", className: "text-blue-600", children: "新增客戶" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium mb-1", children: [
            "金額 ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx("input", { name: "amount", type: "number", step: "0.01", min: "0", required: true, className: "w-full p-2.5 border rounded-lg" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "訂單日期" }),
          /* @__PURE__ */ jsx("input", { name: "orderDate", type: "date", defaultValue: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), className: "w-full p-2.5 border rounded-lg" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "狀態" }),
        /* @__PURE__ */ jsxs("select", { name: "status", className: "w-full p-2.5 border rounded-lg", children: [
          /* @__PURE__ */ jsx("option", { value: "pending", children: "待處理" }),
          /* @__PURE__ */ jsx("option", { value: "processing", children: "處理中" }),
          /* @__PURE__ */ jsx("option", { value: "completed", children: "已完成" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1", children: "備註" }),
        /* @__PURE__ */ jsx("textarea", { name: "notes", rows: 3, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-4", children: [
        /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition", children: "建立訂單" }),
        /* @__PURE__ */ jsx("a", { href: "/orders", className: "px-6 py-2.5 border rounded-lg hover:bg-gray-50", children: "取消" })
      ] })
    ] })
  ] });
}
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  default: NewOrder,
  loader: loader$8
}, Symbol.toStringTag, { value: "Module" }));
async function loader$7({ request }) {
  await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } }
    ];
  }
  const customers = await prisma.customer.findMany({
    where,
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" }
  });
  return { customers, search };
}
function Customers() {
  const { customers, search } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "👤 客戶管理" }),
      /* @__PURE__ */ jsx("a", { href: "/customers/new", className: "bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition", children: "+ 新增客戶" })
    ] }),
    /* @__PURE__ */ jsxs(Form, { className: "flex gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("input", { name: "q", defaultValue: search, placeholder: "搜尋客戶名稱/電話/Email...", className: "flex-1 p-2 border rounded-lg" }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300", children: "搜尋" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-6 py-3", children: "客戶名稱" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-6 py-3", children: "電話" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-6 py-3", children: "Email" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-6 py-3", children: "訂單數" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-6 py-3", children: "加入日期" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
        customers.map((c) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3", children: /* @__PURE__ */ jsx("a", { href: `/customers/${c.id}`, className: "font-medium text-blue-600 hover:underline", children: c.name }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-gray-600", children: c.phone || "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-gray-600", children: c.email || "-" }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: c._count.orders }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-gray-500", children: new Date(c.createdAt).toLocaleDateString("zh-TW") })
        ] }, c.id)),
        customers.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "text-center py-8 text-gray-400", children: "尚無客戶" }) })
      ] })
    ] }) })
  ] });
}
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Customers,
  loader: loader$7
}, Symbol.toStringTag, { value: "Module" }));
async function loader$6({ request }) {
  await requireUserId(request);
  const [totalOrders, totalCustomers, monthRevenue, recentOrders, monthlyData] = await Promise.all([
    prisma.order.count({ where: { deleted: false } }),
    prisma.customer.count(),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        deleted: false,
        orderDate: {
          gte: new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1)
        }
      }
    }),
    prisma.order.findMany({
      where: { deleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } }
    }),
    prisma.$queryRaw`
      SELECT DATE(orderDate) as day, SUM(amount) as revenue
      FROM "Order"
      WHERE deleted = false AND orderDate >= date('now', '-30 days')
      GROUP BY DATE(orderDate)
      ORDER BY day
    `
  ]);
  return {
    totalOrders,
    totalCustomers,
    monthRevenue: monthRevenue._sum.amount || 0,
    recentOrders,
    monthlyData: monthlyData.map((d) => ({
      day: d.day.slice(5),
      revenue: d.revenue
    }))
  };
}
const statusMap$1 = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  cancelled: "已取消"
};
const statusColor$1 = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function Dashboard() {
  const { totalOrders, totalCustomers, monthRevenue, recentOrders, monthlyData } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "📊 儀表板" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "本月營收" }),
        /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-slate-800 mt-1", children: [
          "NT$ ",
          monthRevenue.toLocaleString()
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "總訂單數" }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-slate-800 mt-1", children: totalOrders })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-sm", children: "客戶數" }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold text-slate-800 mt-1", children: totalCustomers })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6 mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4", children: "近 30 天營收趨勢" }),
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: monthlyData, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "day", fontSize: 12 }),
        /* @__PURE__ */ jsx(YAxis, { fontSize: 12 }),
        /* @__PURE__ */ jsx(Tooltip, {}),
        /* @__PURE__ */ jsx(Bar, { dataKey: "revenue", fill: "#1e293b", radius: [4, 4, 0, 0] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4", children: "最新訂單" }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left py-2", children: "訂單編號" }),
          /* @__PURE__ */ jsx("th", { className: "text-left py-2", children: "客戶" }),
          /* @__PURE__ */ jsx("th", { className: "text-right py-2", children: "金額" }),
          /* @__PURE__ */ jsx("th", { className: "text-center py-2", children: "狀態" }),
          /* @__PURE__ */ jsx("th", { className: "text-right py-2", children: "日期" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: recentOrders.map((o) => /* @__PURE__ */ jsxs("tr", { className: "border-b last:border-0 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "py-2", children: /* @__PURE__ */ jsx("a", { href: `/orders/${o.id}`, className: "text-blue-600 hover:underline", children: o.orderNo }) }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-gray-600", children: o.customer.name }),
          /* @__PURE__ */ jsxs("td", { className: "py-2 text-right", children: [
            "NT$ ",
            o.amount.toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${statusColor$1[o.status]}`, children: statusMap$1[o.status] || o.status }) }),
          /* @__PURE__ */ jsx("td", { className: "py-2 text-right text-gray-500", children: new Date(o.orderDate).toLocaleDateString("zh-TW") })
        ] }, o.id)) })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsx("a", { href: "/orders", className: "text-blue-600 hover:underline text-sm", children: "查看全部 →" }) })
    ] })
  ] });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Dashboard,
  loader: loader$6
}, Symbol.toStringTag, { value: "Module" }));
async function loader$5({ request }) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}
async function action$2({ request }) {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  const name = form.get("name");
  if (!email || !password || !name) return { error: "請填寫所有欄位" };
  if (password.length < 6) return { error: "密碼至少 6 碼" };
  const result = await register(email, password, name);
  if ("error" in result) return result;
  return createUserSession(result.user.id, "/dashboard");
}
function Register() {
  const data = useActionData();
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center mb-2", children: "📦 OrderFlow" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-center mb-8", children: "建立新帳號" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-4", children: [
      (data == null ? void 0 : data.error) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: data.error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "姓名" }),
        /* @__PURE__ */ jsx("input", { name: "name", type: "text", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }),
        /* @__PURE__ */ jsx("input", { name: "email", type: "email", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "密碼（至少 6 碼）" }),
        /* @__PURE__ */ jsx("input", { name: "password", type: "password", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 transition", children: "註冊" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-500 mt-6", children: [
      "已經有帳號？",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "登入" })
    ] })
  ] }) });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  default: Register,
  loader: loader$5
}, Symbol.toStringTag, { value: "Module" }));
async function loader$4({ request }) {
  await requireUserId(request);
  const [statusCount, monthlyData] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _sum: { amount: true }, _count: true, where: { deleted: false } }),
    prisma.$queryRaw`
      SELECT strftime('%Y-%m', orderDate) as month, SUM(amount) as revenue, COUNT(*) as count
      FROM "Order"
      WHERE deleted = false
      GROUP BY strftime('%Y-%m', orderDate)
      ORDER BY month DESC
      LIMIT 12
    `
  ]);
  const statusColors = {
    pending: "#eab308",
    processing: "#3b82f6",
    completed: "#22c55e",
    cancelled: "#ef4444"
  };
  const statusLabels = {
    pending: "待處理",
    processing: "處理中",
    completed: "已完成",
    cancelled: "已取消"
  };
  const pieData = statusCount.map((s) => ({
    name: statusLabels[s.status] || s.status,
    value: s._count,
    color: statusColors[s.status] || "#999"
  }));
  const barData = [...monthlyData].reverse().map((d) => ({
    month: d.month.slice(2),
    revenue: d.revenue,
    count: d.count
  }));
  return { pieData, barData };
}
function Reports() {
  const { pieData, barData } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "📈 報表" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4", children: "訂單狀態分佈" }),
        pieData.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-center py-12", children: "尚無資料" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(PieChart, { children: [
          /* @__PURE__ */ jsx(Pie, { data: pieData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 100, label: true, children: pieData.map((entry2, i) => /* @__PURE__ */ jsx(Cell, { fill: entry2.color }, i)) }),
          /* @__PURE__ */ jsx(Tooltip, {})
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-6 mt-4", children: pieData.map((d) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full", style: { backgroundColor: d.color } }),
          d.name,
          " (",
          d.value,
          ")"
        ] }, d.name)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-sm p-6", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4", children: "月營收趨勢（近 12 個月）" }),
        barData.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-gray-400 text-center py-12", children: "尚無資料" }) : /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 300, children: /* @__PURE__ */ jsxs(BarChart, { data: barData, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", fontSize: 12 }),
          /* @__PURE__ */ jsx(YAxis, { fontSize: 12 }),
          /* @__PURE__ */ jsx(Tooltip, {}),
          /* @__PURE__ */ jsx(Bar, { dataKey: "revenue", fill: "#1e293b", radius: [4, 4, 0, 0] })
        ] }) })
      ] })
    ] })
  ] });
}
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Reports,
  loader: loader$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3() {
  return redirect("/dashboard");
}
const route9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
async function action$1({ request }) {
  return logout(request);
}
async function loader$2() {
  return null;
}
const route10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
async function loader$1({ request }) {
  await requireUserId(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const where = { deleted: false };
  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { customer: { name: { contains: search } } }
    ];
  }
  if (status) where.status = status;
  const orders = await prisma.order.findMany({
    where,
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return { orders, search, status };
}
const statusMap = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  cancelled: "已取消"
};
const statusColor = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800"
};
function Orders() {
  const { orders, search, status } = useLoaderData();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "📋 訂單管理" }),
      /* @__PURE__ */ jsx("a", { href: "/orders/new", className: "bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition", children: "+ 新增訂單" })
    ] }),
    /* @__PURE__ */ jsxs(Form, { className: "flex gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("input", { name: "q", defaultValue: search, placeholder: "搜尋訂單編號或客戶...", className: "flex-1 p-2 border rounded-lg" }),
      /* @__PURE__ */ jsxs("select", { name: "status", defaultValue: status, className: "p-2 border rounded-lg", children: [
        /* @__PURE__ */ jsx("option", { value: "", children: "全部狀態" }),
        /* @__PURE__ */ jsx("option", { value: "pending", children: "待處理" }),
        /* @__PURE__ */ jsx("option", { value: "processing", children: "處理中" }),
        /* @__PURE__ */ jsx("option", { value: "completed", children: "已完成" }),
        /* @__PURE__ */ jsx("option", { value: "cancelled", children: "已取消" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300", children: "篩選" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl shadow-sm overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "min-w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-gray-50 border-b", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-left px-6 py-3", children: "訂單編號" }),
        /* @__PURE__ */ jsx("th", { className: "text-left px-6 py-3", children: "客戶" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-6 py-3", children: "金額" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-6 py-3", children: "狀態" }),
        /* @__PURE__ */ jsx("th", { className: "text-right px-6 py-3", children: "日期" }),
        /* @__PURE__ */ jsx("th", { className: "text-center px-6 py-3", children: "操作" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { className: "divide-y", children: [
        orders.map((o) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 font-medium", children: o.orderNo }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-gray-600", children: o.customer.name }),
          /* @__PURE__ */ jsxs("td", { className: "px-6 py-3 text-right", children: [
            "NT$ ",
            o.amount.toLocaleString()
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${statusColor[o.status]}`, children: statusMap[o.status] || o.status }) }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-right text-gray-500", children: new Date(o.orderDate).toLocaleDateString("zh-TW") }),
          /* @__PURE__ */ jsx("td", { className: "px-6 py-3 text-center", children: /* @__PURE__ */ jsx("a", { href: `/orders/${o.id}`, className: "text-blue-600 hover:underline text-xs", children: "查看" }) })
        ] }, o.id)),
        orders.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "text-center py-8 text-gray-400", children: "尚無訂單" }) })
      ] })
    ] }) })
  ] });
}
const route11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Orders,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
async function loader({ request }) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}
async function action({ request }) {
  const form = await request.formData();
  const email = form.get("email");
  const password = form.get("password");
  if (!email || !password) return { error: "請填寫所有欄位" };
  const user = await login(email, password);
  if (!user) return { error: "Email 或密碼錯誤" };
  return createUserSession(user.id, "/dashboard");
}
function Login() {
  const data = useActionData();
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900", children: /* @__PURE__ */ jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-xl w-full max-w-md", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-center mb-2", children: "📦 OrderFlow" }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-500 text-center mb-8", children: "登入您的帳號" }),
    /* @__PURE__ */ jsxs(Form, { method: "post", className: "space-y-4", children: [
      (data == null ? void 0 : data.error) && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 rounded-lg text-sm", children: data.error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }),
        /* @__PURE__ */ jsx("input", { name: "email", type: "email", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "密碼" }),
        /* @__PURE__ */ jsx("input", { name: "password", type: "password", required: true, className: "w-full p-2.5 border rounded-lg" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 transition", children: "登入" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-500 mt-6", children: [
      "還沒有帳號？",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/register", className: "text-blue-600 hover:underline", children: "註冊" })
    ] })
  ] }) });
}
const route12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action,
  default: Login,
  loader
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-D8PRcScc.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-CJ3Nt1xj.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/customers.$id": { "id": "routes/customers.$id", "parentId": "routes/customers", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/customers._id-3wxvt_ql.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/customers.new": { "id": "routes/customers.new", "parentId": "routes/customers", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/customers.new-y5Fyg-A0.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/orders.$id": { "id": "routes/orders.$id", "parentId": "routes/orders", "path": ":id", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/orders._id-dvIlA9Bz.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/orders.new": { "id": "routes/orders.new", "parentId": "routes/orders", "path": "new", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/orders.new-BUgRZO-m.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/customers": { "id": "routes/customers", "parentId": "root", "path": "customers", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/customers-Cwe3jKFR.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/dashboard": { "id": "routes/dashboard", "parentId": "root", "path": "dashboard", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/dashboard-C8LsNG8L.js", "imports": ["/assets/components-D2q5DVoI.js", "/assets/BarChart-DFEBXHFf.js"], "css": [] }, "routes/register": { "id": "routes/register", "parentId": "root", "path": "register", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/register-bqsOZANB.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/reports": { "id": "routes/reports", "parentId": "root", "path": "reports", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/reports-Czw69zk5.js", "imports": ["/assets/components-D2q5DVoI.js", "/assets/BarChart-DFEBXHFf.js"], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/logout": { "id": "routes/logout", "parentId": "root", "path": "logout", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/logout-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/orders": { "id": "routes/orders", "parentId": "root", "path": "orders", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/orders-Dt6yrmRS.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] }, "routes/login": { "id": "routes/login", "parentId": "root", "path": "login", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/login-B-tZkJOF.js", "imports": ["/assets/components-D2q5DVoI.js"], "css": [] } }, "url": "/assets/manifest-88064413.js", "version": "88064413" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": false, "v3_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/customers.$id": {
    id: "routes/customers.$id",
    parentId: "routes/customers",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/customers.new": {
    id: "routes/customers.new",
    parentId: "routes/customers",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/orders.$id": {
    id: "routes/orders.$id",
    parentId: "routes/orders",
    path: ":id",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/orders.new": {
    id: "routes/orders.new",
    parentId: "routes/orders",
    path: "new",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/customers": {
    id: "routes/customers",
    parentId: "root",
    path: "customers",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/dashboard": {
    id: "routes/dashboard",
    parentId: "root",
    path: "dashboard",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/register": {
    id: "routes/register",
    parentId: "root",
    path: "register",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/reports": {
    id: "routes/reports",
    parentId: "root",
    path: "reports",
    index: void 0,
    caseSensitive: void 0,
    module: route8
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route9
  },
  "routes/logout": {
    id: "routes/logout",
    parentId: "root",
    path: "logout",
    index: void 0,
    caseSensitive: void 0,
    module: route10
  },
  "routes/orders": {
    id: "routes/orders",
    parentId: "root",
    path: "orders",
    index: void 0,
    caseSensitive: void 0,
    module: route11
  },
  "routes/login": {
    id: "routes/login",
    parentId: "root",
    path: "login",
    index: void 0,
    caseSensitive: void 0,
    module: route12
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
