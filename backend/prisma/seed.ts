import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
// Đường dẫn theo `output` trong schema.prisma: ../src/generated/prisma
import { PrismaClient } from '../src/generated/prisma/client.js';

// Nếu backend đã có PrismaService khởi tạo khác (Prisma 6 không cần adapter),
// hãy khởi tạo client giống cách đó.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SIZES = [
  { sizeCode: 'S', extraPrice: 0 },
  { sizeCode: 'M', extraPrice: 5000 },
  { sizeCode: 'L', extraPrice: 10000 },
];

const TOPPINGS = [
  { name: 'Trân châu', price: 5000 },
  { name: 'Kem cheese', price: 8000 },
  { name: 'Thạch dừa', price: 5000 },
];

const PRODUCTS = [
  { name: 'Cà phê sữa', price: 35000, category: 'Cà phê', imageUrl: '/images/ca-phe-sua.jpg' },
  { name: 'Americano', price: 40000, category: 'Cà phê', imageUrl: '/images/americano.jpg' },
  { name: 'Cappuccino', price: 45000, category: 'Cà phê', imageUrl: '/images/cappuccino.jpg' },
  { name: 'Trà đào', price: 39000, category: 'Trà', imageUrl: '/images/tra-dao.jpg' },
];

async function main() {
  // Chạy lại nhiều lần không tạo trùng dữ liệu.
  const categories = new Map<string, bigint>();
  for (const name of new Set(PRODUCTS.map((p) => p.category))) {
    const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
    categories.set(name, c.id);
  }

  const toppingIds: bigint[] = [];
  for (const t of TOPPINGS) {
    const existing = await prisma.topping.findFirst({ where: { name: t.name } });
    const topping =
      existing ?? (await prisma.topping.create({ data: { ...t, stock: 100 } }));
    toppingIds.push(topping.id);
  }

  for (const p of PRODUCTS) {
    let product = await prisma.product.findFirst({ where: { name: p.name } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          stock: 100,
          categoryId: categories.get(p.category),
          productSizes: { create: SIZES },
        },
      });
    }
    for (const toppingId of toppingIds) {
      await prisma.productTopping.upsert({
        where: { productId_toppingId: { productId: product.id, toppingId } },
        update: {},
        create: { productId: product.id, toppingId },
      });
    }
  }

  console.log('Seed xong: %d món, %d topping', PRODUCTS.length, TOPPINGS.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
