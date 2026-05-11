import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { createUserSession, getUserId, login } from "~/session.server";
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
  if (!email || !password) return { error: "請填寫所有欄位" };

  const user = await login(email, password);
  if (!user) return { error: "Email 或密碼錯誤" };

  return createUserSession(user.id, "/dashboard");
}

export default function Login() {
  const data = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">📦 OrderFlow</h1>
        <p className="text-gray-500 text-center mb-8">登入您的帳號</p>

        <Form method="post" className="space-y-4">
          {data?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{data.error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <input name="password" type="password" required className="w-full p-2.5 border rounded-lg" />
          </div>
          <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 transition">
            登入
          </button>
        </Form>

        <p className="text-center text-sm text-gray-500 mt-6">
          還沒有帳號？{" "}
          <a href="/register" className="text-blue-600 hover:underline">註冊</a>
        </p>
      </div>
    </div>
  );
}
