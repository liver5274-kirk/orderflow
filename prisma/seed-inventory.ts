import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Skip if materials already exist
  const count = await prisma.material.count();
  if (count > 0) {
    console.log("Materials already exist, skipping inventory seed.");
    return;
  }

  // Create materials
  const materials = await Promise.all([
    prisma.material.create({ data: { name: "珍珠粉圓", category: "原料", unit: "g", currentStock: 25000, minStock: 5000, unitCost: 0.12, notes: "8mm 黑糖珍珠" } }),
    prisma.material.create({ data: { name: "紅茶茶葉", category: "原料", unit: "g", currentStock: 8000, minStock: 2000, unitCost: 0.35, notes: "阿薩姆紅茶" } }),
    prisma.material.create({ data: { name: "綠茶茶葉", category: "原料", unit: "g", currentStock: 5000, minStock: 1500, unitCost: 0.28, notes: "茉莉綠茶" } }),
    prisma.material.create({ data: { name: "奶精粉", category: "原料", unit: "g", currentStock: 12000, minStock: 3000, unitCost: 0.15, notes: "植脂奶精" } }),
    prisma.material.create({ data: { name: "黑糖糖漿", category: "原料", unit: "ml", currentStock: 3000, minStock: 800, unitCost: 0.22, notes: "沖繩黑糖" } }),
    prisma.material.create({ data: { name: "果糖", category: "原料", unit: "ml", currentStock: 15000, minStock: 3000, unitCost: 0.08, notes: "液態果糖" } }),
    prisma.material.create({ data: { name: "鮮奶", category: "原料", unit: "ml", currentStock: 5000, minStock: 1500, unitCost: 0.25, notes: "全脂鮮乳" } }),
    prisma.material.create({ data: { name: "700cc 杯子", category: "包裝", unit: "個", currentStock: 2000, minStock: 300, unitCost: 1.5, notes: "PP 杯含蓋" } }),
    prisma.material.create({ data: { name: "封膜", category: "包裝", unit: "個", currentStock: 3000, minStock: 500, unitCost: 0.3, notes: "封口膜" } }),
    prisma.material.create({ data: { name: "吸管", category: "包裝", unit: "支", currentStock: 1000, minStock: 200, unitCost: 0.2, notes: "12mm 波霸吸管，注意低庫存！" } }),
  ]);

  // Stock transactions for initial stock
  for (const m of materials) {
    await prisma.stockTransaction.create({
      data: { materialId: m.id, type: "進貨", quantity: m.currentStock, beforeStock: 0, afterStock: m.currentStock, reason: "初始庫存" },
    });
  }

  // Products
  const pearlMilkTea = await prisma.product.create({ data: { name: "珍珠奶茶", description: "700cc 經典款", price: 55 } });
  const greenTea = await prisma.product.create({ data: { name: "茉香綠茶", description: "700cc 無糖推薦", price: 35 } });
  const blackTeaLatte = await prisma.product.create({ data: { name: "紅茶拿鐵", description: "700cc 鮮奶調配", price: 60 } });

  // BOM: 珍珠奶茶
  await prisma.bOMItem.createMany({
    data: [
      { productId: pearlMilkTea.id, materialId: materials[0].id, quantity: 80 },   // 珍珠
      { productId: pearlMilkTea.id, materialId: materials[1].id, quantity: 8 },     // 紅茶茶葉
      { productId: pearlMilkTea.id, materialId: materials[3].id, quantity: 30 },    // 奶精粉
      { productId: pearlMilkTea.id, materialId: materials[5].id, quantity: 25 },    // 果糖
      { productId: pearlMilkTea.id, materialId: materials[7].id, quantity: 1 },     // 杯子
      { productId: pearlMilkTea.id, materialId: materials[8].id, quantity: 1 },     // 封膜
      { productId: pearlMilkTea.id, materialId: materials[9].id, quantity: 1 },     // 吸管
    ],
  });

  // BOM: 茉香綠茶
  await prisma.bOMItem.createMany({
    data: [
      { productId: greenTea.id, materialId: materials[2].id, quantity: 8 },        // 綠茶茶葉
      { productId: greenTea.id, materialId: materials[5].id, quantity: 20 },        // 果糖
      { productId: greenTea.id, materialId: materials[7].id, quantity: 1 },         // 杯子
      { productId: greenTea.id, materialId: materials[8].id, quantity: 1 },         // 封膜
    ],
  });

  // BOM: 紅茶拿鐵
  await prisma.bOMItem.createMany({
    data: [
      { productId: blackTeaLatte.id, materialId: materials[1].id, quantity: 8 },   // 紅茶茶葉
      { productId: blackTeaLatte.id, materialId: materials[6].id, quantity: 150 },  // 鮮奶
      { productId: blackTeaLatte.id, materialId: materials[4].id, quantity: 15 },   // 黑糖糖漿
      { productId: blackTeaLatte.id, materialId: materials[7].id, quantity: 1 },    // 杯子
      { productId: blackTeaLatte.id, materialId: materials[8].id, quantity: 1 },    // 封膜
    ],
  });

  console.log("✅ Inventory seed created!");
  console.log(`   Materials: ${materials.length}`);
  console.log("   Products: 珍珠奶茶, 茉香綠茶, 紅茶拿鐵");
  console.log(`   Supplies low: 吸管 (${materials[9].currentStock}), 杯子 (${materials[7].currentStock})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
