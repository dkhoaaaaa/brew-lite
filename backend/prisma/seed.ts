import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Chưa cấu hình DATABASE_URL");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type ProductSeed = {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: number;
};

const productData: ProductSeed[] = [
  // Cà phê (10)
  { name: "Americano", category: "Cà phê", description: "Espresso pha cùng nước nóng.", price: "35000", stock: 100 },
  { name: "Cappuccino", category: "Cà phê", description: "Espresso, sữa nóng và bọt sữa mịn.", price: "45000", stock: 80 },
  { name: "Espresso", category: "Cà phê", description: "Cà phê espresso đậm vị.", price: "30000", stock: 100 },
  { name: "Latte", category: "Cà phê", description: "Espresso kết hợp sữa tươi.", price: "45000", stock: 90 },
  { name: "Mocha", category: "Cà phê", description: "Cà phê hòa quyện chocolate và sữa.", price: "49000", stock: 80 },
  { name: "Bạc xỉu", category: "Cà phê", description: "Sữa thơm béo cùng chút cà phê.", price: "35000", stock: 100 },
  { name: "Cà phê sữa đá", category: "Cà phê", description: "Cà phê Việt Nam với sữa đặc.", price: "32000", stock: 120 },
  { name: "Cà phê đen đá", category: "Cà phê", description: "Cà phê Việt Nam đậm đà.", price: "28000", stock: 120 },
  { name: "Cold Brew", category: "Cà phê", description: "Cà phê ủ lạnh thanh nhẹ.", price: "42000", stock: 80 },
  { name: "Caramel Macchiato", category: "Cà phê", description: "Sữa, espresso và sốt caramel.", price: "52000", stock: 75 },

  // Trà sữa (15)
  { name: "Trà sữa trân châu", category: "Trà sữa", description: "Trà sữa thơm béo kèm trân châu đen.", price: "40000", stock: 100 },
  { name: "Trà sữa truyền thống", category: "Trà sữa", description: "Hồng trà và sữa hòa quyện.", price: "35000", stock: 100 },
  { name: "Trà sữa ô long", category: "Trà sữa", description: "Trà ô long thơm dịu cùng sữa.", price: "42000", stock: 90 },
  { name: "Trà sữa matcha", category: "Trà sữa", description: "Matcha Nhật Bản pha sữa.", price: "48000", stock: 90 },
  { name: "Trà sữa socola", category: "Trà sữa", description: "Trà sữa kết hợp vị chocolate.", price: "45000", stock: 80 },
  { name: "Trà sữa khoai môn", category: "Trà sữa", description: "Hương khoai môn bùi béo.", price: "45000", stock: 80 },
  { name: "Trà sữa đường đen", category: "Trà sữa", description: "Sữa tươi với đường đen thơm ngọt.", price: "47000", stock: 90 },
  { name: "Trà sữa nhài", category: "Trà sữa", description: "Trà hoa nhài thanh hương cùng sữa.", price: "40000", stock: 90 },
  { name: "Trà sữa dâu", category: "Trà sữa", description: "Trà sữa kết hợp hương dâu.", price: "45000", stock: 85 },
  { name: "Trà sữa bạc hà", category: "Trà sữa", description: "Vị trà sữa mát dịu bạc hà.", price: "43000", stock: 75 },
  { name: "Trà sữa caramel", category: "Trà sữa", description: "Trà sữa thơm vị caramel.", price: "46000", stock: 80 },
  { name: "Trà sữa hạt dẻ", category: "Trà sữa", description: "Trà sữa bùi thơm vị hạt dẻ.", price: "48000", stock: 70 },
  { name: "Trà sữa kem cheese", category: "Trà sữa", description: "Trà sữa phủ kem cheese béo mặn.", price: "49000", stock: 85 },
  { name: "Trà sữa pudding", category: "Trà sữa", description: "Trà sữa kèm pudding mềm mịn.", price: "45000", stock: 80 },
  { name: "Trà sữa gạo rang", category: "Trà sữa", description: "Trà sữa với hương gạo rang.", price: "44000", stock: 80 },

  // Trà trái cây (15)
  { name: "Trà đào cam sả", category: "Trà trái cây", description: "Trà đào kết hợp cam tươi và sả.", price: "39000", stock: 80 },
  { name: "Trà vải", category: "Trà trái cây", description: "Trà thanh mát cùng vải ngọt.", price: "39000", stock: 90 },
  { name: "Trà chanh", category: "Trà trái cây", description: "Trà hòa quyện nước cốt chanh.", price: "30000", stock: 110 },
  { name: "Trà tắc", category: "Trà trái cây", description: "Trà tắc chua ngọt giải khát.", price: "28000", stock: 110 },
  { name: "Trà dâu", category: "Trà trái cây", description: "Trà trái cây với dâu thơm.", price: "42000", stock: 85 },
  { name: "Trà xoài", category: "Trà trái cây", description: "Trà kết hợp xoài chín ngọt.", price: "42000", stock: 85 },
  { name: "Trà chanh dây", category: "Trà trái cây", description: "Trà cùng chanh dây chua dịu.", price: "40000", stock: 90 },
  { name: "Trà ổi hồng", category: "Trà trái cây", description: "Trà ổi hồng thơm mát.", price: "42000", stock: 85 },
  { name: "Trà dưa lưới", category: "Trà trái cây", description: "Trà trái cây vị dưa lưới.", price: "43000", stock: 75 },
  { name: "Trà kiwi", category: "Trà trái cây", description: "Trà kiwi chua ngọt hài hòa.", price: "45000", stock: 70 },
  { name: "Trà táo xanh", category: "Trà trái cây", description: "Trà hương táo xanh thanh mát.", price: "39000", stock: 80 },
  { name: "Trà dứa", category: "Trà trái cây", description: "Trà dứa tươi thơm nhẹ.", price: "39000", stock: 80 },
  { name: "Trà nhiệt đới", category: "Trà trái cây", description: "Trà hòa quyện nhiều loại trái cây.", price: "47000", stock: 75 },
  { name: "Trà bưởi hồng", category: "Trà trái cây", description: "Trà bưởi hồng thanh ngọt.", price: "45000", stock: 75 },
  { name: "Trà mận", category: "Trà trái cây", description: "Trà mận chua ngọt dễ uống.", price: "42000", stock: 80 },

  // Đá xay (5)
  { name: "Matcha đá xay", category: "Đá xay", description: "Matcha xay với đá và sữa.", price: "55000", stock: 70 },
  { name: "Chocolate đá xay", category: "Đá xay", description: "Chocolate mát lạnh xay nhuyễn.", price: "53000", stock: 70 },
  { name: "Cookies & Cream đá xay", category: "Đá xay", description: "Bánh quy cacao xay cùng kem sữa.", price: "56000", stock: 65 },
  { name: "Caramel đá xay", category: "Đá xay", description: "Đá xay sữa caramel béo thơm.", price: "54000", stock: 65 },
  { name: "Dâu đá xay", category: "Đá xay", description: "Dâu và sữa xay mát lạnh.", price: "53000", stock: 65 },

  // Sữa chua (5)
  { name: "Sữa chua dâu", category: "Sữa chua", description: "Sữa chua kết hợp dâu tây.", price: "43000", stock: 75 },
  { name: "Sữa chua xoài", category: "Sữa chua", description: "Sữa chua và xoài chín.", price: "43000", stock: 75 },
  { name: "Sữa chua việt quất", category: "Sữa chua", description: "Sữa chua cùng sốt việt quất.", price: "47000", stock: 70 },
  { name: "Sữa chua chanh dây", category: "Sữa chua", description: "Sữa chua chua dịu vị chanh dây.", price: "44000", stock: 70 },
  { name: "Sữa chua trái cây", category: "Sữa chua", description: "Sữa chua kèm trái cây tổng hợp.", price: "48000", stock: 70 },
];

const toppingData = [
  { name: "Trân châu đen", price: "7000", stock: 100 },
  { name: "Thạch trái cây", price: "7000", stock: 100 },
  { name: "Kem cheese", price: "10000", stock: 50 },
  { name: "Pudding trứng", price: "8000", stock: 80 },
  { name: "Trân châu trắng", price: "8000", stock: 90 },
  { name: "Thạch nha đam", price: "7000", stock: 80 },
] as const;

const promotionData = [
  { code: "BREWLITE10", name: "Giảm 10%", description: "Giảm 10% cho đơn từ 50.000đ.", discountType: "PERCENT", discountValue: "10", minOrderAmount: "50000", maxDiscountAmount: "20000", usageLimit: 1000 },
  { code: "WELCOME15", name: "Chào khách mới", description: "Giảm 15% cho đơn từ 60.000đ.", discountType: "PERCENT", discountValue: "15", minOrderAmount: "60000", maxDiscountAmount: "30000", usageLimit: 500 },
  { code: "COFFEE5K", name: "Giảm 5.000đ", description: "Giảm 5.000đ cho đơn từ 35.000đ.", discountType: "FIXED", discountValue: "5000", minOrderAmount: "35000", maxDiscountAmount: "5000", usageLimit: 1000 },
  { code: "MILKTEA10K", name: "Giảm 10.000đ", description: "Giảm 10.000đ cho đơn từ 70.000đ.", discountType: "FIXED", discountValue: "10000", minOrderAmount: "70000", maxDiscountAmount: "10000", usageLimit: 500 },
  { code: "FREEDAY20", name: "Giảm 20%", description: "Giảm 20% cho đơn từ 100.000đ.", discountType: "PERCENT", discountValue: "20", minOrderAmount: "100000", maxDiscountAmount: "40000", usageLimit: 200 },
  { code: "WEEKEND12", name: "Cuối tuần giảm 12%", description: "Giảm 12% cho đơn từ 80.000đ.", discountType: "PERCENT", discountValue: "12", minOrderAmount: "80000", maxDiscountAmount: "25000", usageLimit: 300 },
  { code: "SWEET8K", name: "Giảm 8.000đ", description: "Giảm 8.000đ cho đơn từ 55.000đ.", discountType: "FIXED", discountValue: "8000", minOrderAmount: "55000", maxDiscountAmount: "8000", usageLimit: 500 },
  { code: "SUMMER18", name: "Ưu đãi 18%", description: "Giảm 18% cho đơn từ 90.000đ.", discountType: "PERCENT", discountValue: "18", minOrderAmount: "90000", maxDiscountAmount: "35000", usageLimit: 300 },
  { code: "FRIEND25K", name: "Giảm 25.000đ", description: "Giảm 25.000đ cho đơn từ 150.000đ.", discountType: "FIXED", discountValue: "25000", minOrderAmount: "150000", maxDiscountAmount: "25000", usageLimit: 200 },
  { code: "BIGORDER30", name: "Giảm 30.000đ", description: "Giảm 30.000đ cho đơn từ 200.000đ.", discountType: "FIXED", discountValue: "30000", minOrderAmount: "200000", maxDiscountAmount: "30000", usageLimit: 150 },
] as const;

// ======================================================
// TÀI KHOẢN MẪU - BREWLITE
// ======================================================

const accountData = [
  {
    email: "example@example.com",
    password: "Example@123",
    fullName: "Nguyễn Văn Example",
    phone: null,
    loyaltyPoints: 0,
    isActive: true,
  },
  {
    email: "customer1@example.com",
    password: "Customer@123",
    fullName: "Nguyễn Văn A",
    phone: null,
    loyaltyPoints: 200,
    isActive: true,
  },
] as const;

function assertNoDuplicateNames() {
  const productKeys = productData.map((item) => `${item.category}\u0000${item.name}`);
  const promoCodes = promotionData.map((item) => item.code);
  if (new Set(productKeys).size !== productKeys.length) throw new Error("Danh sách seed có tên sản phẩm trùng trong cùng danh mục.");
  if (new Set(promoCodes).size !== promoCodes.length) throw new Error("Danh sách seed có mã khuyến mãi trùng.");
  if (productData.length !== 50 || promotionData.length !== 10) throw new Error("Seed phải có đúng 50 món và 10 mã.");
}

async function main() {
  assertNoDuplicateNames();
  console.log("Bắt đầu seed BrewLite (có thể chạy lại, không tạo thêm bản ghi trùng)...");

  const categories = new Map<string, bigint>();
  for (const name of [...new Set(productData.map((item) => item.category))]) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
    categories.set(name, category.id);
  }

  // Product chưa có @@unique([name, categoryId]), nên dùng findFirst + update/create.
  // Cách này idempotent khi seed chạy tuần tự, KHÔNG chống trùng nếu 2 tiến trình seed chạy đồng thời.
  const products = new Map<string, bigint>();
  for (const item of productData) {
    const categoryId = categories.get(item.category)!;
    const existing = await prisma.product.findFirst({
      where: { name: item.name, categoryId },
      orderBy: { id: "asc" },
    });
    const data = {
      categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      isActive: true,
    };
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data });
    products.set(item.name, product.id);
  }

  const sizePrices = [
    { sizeCode: "S", extraPrice: "0" },
    { sizeCode: "M", extraPrice: "5000" },
    { sizeCode: "L", extraPrice: "10000" },
  ];
  for (const productId of products.values()) {
    for (const size of sizePrices) {
      await prisma.productSize.upsert({
        where: { productId_sizeCode: { productId, sizeCode: size.sizeCode } },
        update: { extraPrice: size.extraPrice, isActive: true },
        create: { productId, ...size, isActive: true },
      });
    }
  }

  const toppings = new Map<string, bigint>();
  for (const item of toppingData) {
    const existing = await prisma.topping.findFirst({
      where: { name: item.name },
      orderBy: { id: "asc" },
    });
    const data = { name: item.name, price: item.price, stock: item.stock, isActive: true };
    const topping = existing
      ? await prisma.topping.update({ where: { id: existing.id }, data })
      : await prisma.topping.create({ data });
    toppings.set(item.name, topping.id);
  }

  // Gắn topping cho các nhóm phù hợp; upsert dựa trên khóa chính kép.
  for (const item of productData) {
    const selectedToppings = item.category === "Trà sữa"
      ? ["Trân châu đen", "Trân châu trắng", "Thạch trái cây", "Pudding trứng", "Kem cheese"]
      : item.category === "Cà phê"
        ? ["Kem cheese"]
        : item.category === "Trà trái cây"
          ? ["Thạch trái cây", "Thạch nha đam"]
          : item.category === "Đá xay"
            ? ["Kem cheese"]
            : ["Thạch trái cây"];
    const productId = products.get(item.name)!;
    for (const toppingName of selectedToppings) {
      const toppingId = toppings.get(toppingName)!;
      await prisma.productTopping.upsert({
        where: { productId_toppingId: { productId, toppingId } },
        update: {},
        create: { productId, toppingId },
      });
    }
  }

  // Reward không có khóa unique(name), nên tìm rồi cập nhật để tránh nhân bản khi chạy lại.
  const rewardName = "Giảm 10.000đ";
  const rewardData = {
    description: "Đổi điểm tích lũy để nhận ưu đãi.",
    pointsCost: 100,
    discountType: "FIXED" as const,
    discountValue: "10000",
    minOrderAmount: "30000",
    maxDiscountAmount: "10000",
    validDays: 30,
    isActive: true,
  };
  const reward = await prisma.loyaltyReward.findFirst({
    where: { name: rewardName },
    orderBy: { id: "asc" },
  });
  if (reward) {
    await prisma.loyaltyReward.update({ where: { id: reward.id }, data: rewardData });
  } else {
    await prisma.loyaltyReward.create({ data: { name: rewardName, ...rewardData } });
  }

  const startAt = new Date("2026-01-01T00:00:00+07:00");
  const endAt = new Date("2028-12-31T23:59:59+07:00");
  for (const item of promotionData) {
    const data = {
      name: item.name,
      description: item.description,
      discountType: item.discountType,
      discountValue: item.discountValue,
      minOrderAmount: item.minOrderAmount,
      maxDiscountAmount: item.maxDiscountAmount,
      startAt,
      endAt,
      usageLimit: item.usageLimit,
      usageLimitPerUser: 1,
      isActive: true,
    };
    await prisma.promotion.upsert({
      where: { code: item.code },
      update: data,
      create: { code: item.code, ...data },
    });
  }

  // ======================================================
// SEED TÀI KHOẢN MẪU
// ======================================================

  console.log("Bắt đầu seed tài khoản mẫu...");

  if (process.env.NODE_ENV !== "production") {
    for (const account of accountData) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: account.email,
        },
      });

      if (existingUser) {
        console.log(`Tài khoản đã tồn tại: ${account.email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(account.password, 10);

      await prisma.user.create({
        data: {
          email: account.email,
          passwordHash,
          fullName: account.fullName,
          phone: account.phone,
          loyaltyPoints: account.loyaltyPoints,
          isActive: account.isActive,
        },
      });

      console.log(`Đã tạo tài khoản: ${account.email}`);
    }

    console.log(`Đã xử lý ${accountData.length} tài khoản mẫu.`);
  } else {
    console.log("Bỏ qua tài khoản mẫu trong môi trường production.");
  }

  console.log(`
    ========================================
          SEED BREWLITE HOÀN TẤT
    ========================================
    Danh mục       : ${categories.size}
    Sản phẩm       : ${products.size}
    Topping        : ${toppings.size}
    Khuyến mãi     : ${promotionData.length}
    Tài khoản mẫu  : ${process.env.NODE_ENV !== "production" ? accountData.length : 0}
    ========================================
  `);
}

main()
  .catch((error) => {
    console.error("Seed thất bại:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
