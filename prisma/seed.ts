import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const password = await bcryptjs.hash("demo123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@orderflow.tw" },
    update: {},
    create: { email: "demo@orderflow.tw", password, name: "王店長" },
  });

  // Create customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "星辰咖啡館", phone: "02-2771-1234", email: "star@coffee.tw", address: "台北市大安區忠孝東路三段100號" } }),
    prisma.customer.create({ data: { name: "日光烘焙坊", phone: "02-2712-5678", email: "sun@bakery.tw", address: "台北市信義區松高路50號" } }),
    prisma.customer.create({ data: { name: "微風餐飲集團", phone: "02-8789-0001", email: "breeze@food.tw", address: "台北市松山區復興北路200號" } }),
    prisma.customer.create({ data: { name: "綠葉茶坊", phone: "02-2365-4321", email: "green@tea.tw", address: "台北市中正區羅斯福路三段50號" } }),
    prisma.customer.create({ data: { name: "光合作用早午餐", phone: "02-2522-9999", address: "台北市中山區南京東路二段80號" } }),
  ]);

  // Create orders
  const statuses = ["pending", "processing", "completed", "completed", "completed", "cancelled"];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.round(Math.random() * 50000 + 5000) / 100 * 100;

    await prisma.order.create({
      data: {
        orderNo: `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(10000 + i).padStart(5, "0")}`,
        amount,
        status,
        orderDate: date,
        notes: i % 7 === 0 ? "VIP 客戶，注意出貨品質" : "",
        customerId: customer.id,
        createdBy: user.id,
      },
    });
  }

  console.log("✅ Seed data created!");
  console.log(`   User: demo@orderflow.tw / demo123`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Orders: 30`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
