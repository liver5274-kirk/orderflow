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

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "台糖食品原料", contactPerson: "林經理", phone: "06-3378-888", email: "sugar@taisugar.tw",
        address: "台南市東區生產路68號", taxId: "03794905", paymentTerms: "月結30天", notes: "長期合作，糖類主要供應商",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "天仁茗茶", contactPerson: "陳採購", phone: "02-2776-5588", email: "purchase@tenren.tw",
        address: "台北市大安區忠孝東路四段107號", taxId: "18559415", paymentTerms: "月結60天",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "統一包材", contactPerson: "張業務", phone: "06-2536-789", email: "sales@unipack.tw",
        address: "台南市永康區中正路301號", taxId: "73251209", paymentTerms: "貨到付款", notes: "杯子封膜專業供應",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "味全食品", contactPerson: "李副理", phone: "02-2741-5577", email: "b2b@weichuan.tw",
        address: "台北市松山區光復北路85號", taxId: "11347802", paymentTerms: "月結30天",
      },
    }),
  ]);

  // Create materials
  const materials = await Promise.all([
    prisma.material.create({ data: { name: "珍珠粉圓", category: "原料", unit: "公斤", currentStock: 25, minStock: 5, unitCost: 80, supplierId: suppliers[0].id } }),
    prisma.material.create({ data: { name: "紅茶茶葉", category: "原料", unit: "公斤", currentStock: 8, minStock: 3, unitCost: 350, supplierId: suppliers[1].id } }),
    prisma.material.create({ data: { name: "綠茶茶葉", category: "原料", unit: "公斤", currentStock: 5, minStock: 3, unitCost: 300, supplierId: suppliers[1].id } }),
    prisma.material.create({ data: { name: "奶精粉", category: "原料", unit: "公斤", currentStock: 12, minStock: 5, unitCost: 120, supplierId: suppliers[3].id } }),
    prisma.material.create({ data: { name: "黑糖糖漿", category: "原料", unit: "公升", currentStock: 15, minStock: 3, unitCost: 90, supplierId: suppliers[0].id } }),
    prisma.material.create({ data: { name: "果糖", category: "原料", unit: "公升", currentStock: 20, minStock: 5, unitCost: 45, supplierId: suppliers[0].id } }),
    prisma.material.create({ data: { name: "鮮奶", category: "原料", unit: "公升", currentStock: 30, minStock: 8, unitCost: 55, supplierId: suppliers[3].id } }),
    prisma.material.create({ data: { name: "700cc 杯子", category: "包裝", unit: "個", currentStock: 2000, minStock: 500, unitCost: 2.5, supplierId: suppliers[2].id } }),
    prisma.material.create({ data: { name: "封膜", category: "包裝", unit: "張", currentStock: 3000, minStock: 500, unitCost: 0.3, supplierId: suppliers[2].id } }),
    prisma.material.create({ data: { name: "吸管", category: "耗材", unit: "支", currentStock: 1000, minStock: 2000, unitCost: 0.5, supplierId: suppliers[2].id } }),
  ]);

  // Create products (BOM)
  const products = await Promise.all([
    prisma.product.create({ data: { name: "珍珠奶茶", description: "經典黑糖珍珠 + 紅茶拿鐵", price: 55 } }),
    prisma.product.create({ data: { name: "茉香綠茶", description: "茉莉花香綠茶，清新回甘", price: 35 } }),
    prisma.product.create({ data: { name: "紅茶拿鐵", description: "阿薩姆紅茶 + 鮮奶 + 奶精", price: 60 } }),
  ]);

  // Create BOM items
  await Promise.all([
    // 珍珠奶茶 BOM (product=0: pearl milk tea)
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[0].id, quantity: 0.08 } }),   // 珍珠 80g
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[1].id, quantity: 0.003 } }), // 紅茶 3g
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[3].id, quantity: 0.015 } }), // 奶精 15g
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[4].id, quantity: 0.03 } }),  // 黑糖 30ml
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[7].id, quantity: 1 } }),      // 杯子
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[8].id, quantity: 1 } }),      // 封膜
    prisma.bOMItem.create({ data: { productId: products[0].id, materialId: materials[9].id, quantity: 1 } }),      // 吸管
    // 茉香綠茶 BOM (product=1: jasmine green tea)
    prisma.bOMItem.create({ data: { productId: products[1].id, materialId: materials[2].id, quantity: 0.003 } }), // 綠茶 3g
    prisma.bOMItem.create({ data: { productId: products[1].id, materialId: materials[5].id, quantity: 0.02 } }),  // 果糖 20ml
    prisma.bOMItem.create({ data: { productId: products[1].id, materialId: materials[7].id, quantity: 1 } }),      // 杯子
    prisma.bOMItem.create({ data: { productId: products[1].id, materialId: materials[8].id, quantity: 1 } }),      // 封膜
    // 紅茶拿鐵 BOM (product=2: black tea latte)
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[1].id, quantity: 0.004 } }), // 紅茶 4g
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[3].id, quantity: 0.02 } }),  // 奶精 20g
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[6].id, quantity: 0.15 } }),  // 鮮奶 150ml
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[7].id, quantity: 1 } }),      // 杯子
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[8].id, quantity: 1 } }),      // 封膜
    prisma.bOMItem.create({ data: { productId: products[2].id, materialId: materials[9].id, quantity: 1 } }),      // 吸管
  ]);

  // Create purchase orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      orderNo: "PO-20260510-001", supplierId: suppliers[2].id, status: "已收貨", totalAmount: 5670,
      orderDate: new Date("2026-05-10"), expectedDate: new Date("2026-05-12"), receivedDate: new Date("2026-05-11"),
      notes: "杯子+吸管補貨",
      items: {
        create: [
          { materialId: materials[7].id, quantity: 2000, unitPrice: 2.5, subtotal: 5000 },
          { materialId: materials[8].id, quantity: 2000, unitPrice: 0.3, subtotal: 600 },
          { materialId: materials[9].id, quantity: 140, unitPrice: 0.5, subtotal: 70 },
        ],
      },
    },
  });
  // Create corresponding stock transactions for received PO
  await Promise.all([
    prisma.stockTransaction.create({ data: { materialId: materials[7].id, type: "進貨", quantity: 2000, beforeStock: 0, afterStock: 2000, reason: "採購單 PO-20260510-001 收貨", orderNo: "PO-20260510-001" } }),
    prisma.stockTransaction.create({ data: { materialId: materials[8].id, type: "進貨", quantity: 2000, beforeStock: 1000, afterStock: 3000, reason: "採購單 PO-20260510-001 收貨", orderNo: "PO-20260510-001" } }),
    prisma.stockTransaction.create({ data: { materialId: materials[9].id, type: "進貨", quantity: 140, beforeStock: 860, afterStock: 1000, reason: "採購單 PO-20260510-001 收貨", orderNo: "PO-20260510-001" } }),
  ]);

  await prisma.purchaseOrder.create({
    data: {
      orderNo: "PO-20260509-001", supplierId: suppliers[0].id, status: "運送中", totalAmount: 6350,
      orderDate: new Date("2026-05-09"), expectedDate: new Date("2026-05-14"),
      notes: "糖類+珍珠補貨",
      items: {
        create: [
          { materialId: materials[0].id, quantity: 20, unitPrice: 80, subtotal: 1600 },
          { materialId: materials[4].id, quantity: 15, unitPrice: 90, subtotal: 1350 },
          { materialId: materials[5].id, quantity: 40, unitPrice: 45, subtotal: 1800 },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      orderNo: "PO-20260508-001", supplierId: suppliers[1].id, status: "待確認", totalAmount: 2550,
      orderDate: new Date("2026-05-08"), expectedDate: new Date("2026-05-15"),
      items: {
        create: [
          { materialId: materials[1].id, quantity: 5, unitPrice: 350, subtotal: 1750 },
          { materialId: materials[2].id, quantity: 3, unitPrice: 300, subtotal: 900 },
        ],
      },
    },
  });

  console.log("✅ Seed data created!");
  console.log(`   User: demo@orderflow.tw / demo123`);
  console.log(`   Customers: ${customers.length}`);
  console.log(`   Orders: 30`);
  console.log(`   Suppliers: ${suppliers.length}`);
  console.log(`   Materials: ${materials.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Purchase Orders: 3`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
