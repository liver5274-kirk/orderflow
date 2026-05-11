import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { createUserSession, getUserId, register } from "~/session.server";
import { redirect } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return {};
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = form.get("email") as string;
  const password = form.get("password") as string;
  const name = form.get("name") as string;
  if (!email || !password || !name) return { error: "請填寫所有欄位" };
  if (password.length < 6) return { error: "密碼至少 6 碼" };

  const result = await register(email, password, name);
  if ("error" in result) return result;
  return createUserSession(result.user.id, "/dashboard");
}

export default function Register() {
  const data = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">📦 OrderFlow</h1>
        <p className="text-gray-500 text-center mb-8">建立新帳號</p>

        <Form method="post" className="space-y-4">
          {data?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input name="name" type="text" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼（至少 6 碼）</label>
            <input name="password" type="password" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 transition">
            註冊
          </button>
        </Form>

        <p className="text-center text-sm text-gray-500 mt-6">
          已經有帳號？{" "}
          <a href="/login" className="text-blue-600 hover:underline">登入</a>
        </p>
      </div>
    </div>
  );
}
