# OrderFlow — 訂單管理系統

全棧訂單管理後台，使用 **Remix v2 + Prisma + SQLite + Recharts** 打造，適合接案作品集展示。

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Remix v2 (React 18 + TypeScript) |
| 樣式 | Tailwind CSS |
| 資料庫 | SQLite + Prisma ORM |
| 圖表 | Recharts |
| 認證 | Session-based + bcryptjs |

## 功能

- **Dashboard** — 營收趨勢圖、訂單狀態分布圖
- **訂單管理** — CRUD，含搜尋/篩選
- **客戶管理** — CRUD，客戶詳情與訂單關聯
- **報表** — 月度營收報表
- **登入系統** — Session 認證，註冊/登入/登出

## 快速開始

```bash
# 安裝依賴
npm install

# 初始化資料庫 + 匯入 Demo 資料
npx prisma db push
npm run db:seed

# 啟動開發伺服器
npm run dev
```

預設 Demo 帳號：`demo@orderflow.tw` / `demo123`

## 可用指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 開發模式 (Vite HMR) |
| `npm run build` | 生產建置 |
| `npm start` | 啟動生產伺服器 |
| `npm run db:push` | 同步 Prisma schema 到 SQLite |
| `npm run db:seed` | 匯入範例資料 (5 客戶 + 30 訂單) |
| `npm run db:studio` | Prisma Studio 視覺化管理 |
| `npm run typecheck` | TypeScript 型別檢查 |

## 專案結構

```
orderflow/
├── app/
│   ├── routes/          # Remix 路由 (12 頁)
│   │   ├── dashboard.tsx
│   │   ├── orders.tsx / orders.$id.tsx / orders.new.tsx
│   │   ├── customers.tsx / customers.$id.tsx / customers.new.tsx
│   │   ├── reports.tsx
│   │   └── login.tsx / logout.tsx / register.tsx
│   ├── db.server.ts     # Prisma client
│   ├── session.server.ts # Session 管理
│   └── root.tsx          # 根佈局
├── prisma/
│   ├── schema.prisma    # 資料模型
│   └── seed.ts          # Demo 資料
├── package.json
└── vite.config.ts
```

## License

MIT
