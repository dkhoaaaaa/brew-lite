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
  imageUrl?: string;
};

// Hàm chuyển đổi tên tiếng Việt có dấu thành slug không dấu để khớp tên file ảnh
function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-");
}

const productData: ProductSeed[] = [
  // Cà phê (50)
  { name: "Cà phê đen đá", category: "Cà phê", description: "Cà phê phin Việt Nam đậm vị, phục vụ với đá", price: "29000", stock: 100 },
  { name: "Cà phê sữa đá", category: "Cà phê", description: "Cà phê phin hòa cùng sữa đặc và đá", price: "35000", stock: 100 },
  { name: "Bạc xỉu đá", category: "Cà phê", description: "Sữa béo thơm cùng một lớp cà phê nhẹ", price: "35000", stock: 100 },
  { name: "Cà phê muối đá", category: "Cà phê", description: "Cà phê sữa phủ kem muối mịn", price: "39000", stock: 100 },
  { name: "Cà phê cốt dừa đá", category: "Cà phê", description: "Cà phê đậm đà kết hợp cốt dừa lạnh", price: "45000", stock: 100 },
  { name: "Cà phê kem trứng đá", category: "Cà phê", description: "Cà phê đá cùng lớp kem trứng béo mịn", price: "49000", stock: 100 },
  { name: "Cà phê kem sữa đá", category: "Cà phê", description: "Cà phê phin đá phủ kem sữa dịu ngọt", price: "39000", stock: 100 },
  { name: "Cà phê kem cheese đá", category: "Cà phê", description: "Cà phê lạnh phủ kem phô mai mằn mặn", price: "45000", stock: 100 },
  { name: "Cà phê hạnh nhân đá", category: "Cà phê", description: "Cà phê sữa đá thơm hương hạnh nhân", price: "45000", stock: 100 },
  { name: "Cà phê caramel đá", category: "Cà phê", description: "Cà phê đá cùng sốt caramel ngọt dịu", price: "45000", stock: 100 },
  { name: "Cà phê hazelnut đá", category: "Cà phê", description: "Cà phê sữa lạnh hương hạt phỉ", price: "49000", stock: 100 },
  { name: "Cà phê vanilla đá", category: "Cà phê", description: "Cà phê đá cùng sữa và vanilla", price: "45000", stock: 100 },
  { name: "Cà phê chocolate đá", category: "Cà phê", description: "Cà phê lạnh hòa cùng chocolate", price: "49000", stock: 100 },
  { name: "Cà phê bạc hà đá", category: "Cà phê", description: "Cà phê sữa lạnh thêm hương bạc hà", price: "45000", stock: 100 },
  { name: "Cà phê đường đen đá", category: "Cà phê", description: "Cà phê đá kết hợp sữa và đường đen", price: "45000", stock: 100 },
  { name: "Americano đá", category: "Cà phê", description: "Espresso pha nước lạnh và đá", price: "39000", stock: 100 },
  { name: "Americano cam đá", category: "Cà phê", description: "Espresso đá kết hợp hương cam tươi", price: "49000", stock: 100 },
  { name: "Americano chanh đá", category: "Cà phê", description: "Espresso đá cùng vị chanh thanh mát", price: "45000", stock: 100 },
  { name: "Americano mật ong đá", category: "Cà phê", description: "Espresso đá thêm mật ong dịu ngọt", price: "45000", stock: 100 },
  { name: "Espresso tonic", category: "Cà phê", description: "Espresso kết hợp tonic và đá", price: "49000", stock: 100 },
  { name: "Latte đá", category: "Cà phê", description: "Espresso và sữa tươi lạnh", price: "49000", stock: 100 },
  { name: "Latte vanilla đá", category: "Cà phê", description: "Latte lạnh thêm vanilla thơm dịu", price: "55000", stock: 100 },
  { name: "Latte caramel đá", category: "Cà phê", description: "Latte lạnh với caramel ngọt thơm", price: "55000", stock: 100 },
  { name: "Latte hạnh nhân đá", category: "Cà phê", description: "Latte lạnh mang hương hạnh nhân", price: "55000", stock: 100 },
  { name: "Latte hạt phỉ đá", category: "Cà phê", description: "Latte lạnh với hương hạt phỉ", price: "55000", stock: 100 },
  { name: "Latte đường đen đá", category: "Cà phê", description: "Espresso với sữa lạnh và đường đen", price: "55000", stock: 100 },
  { name: "Latte dừa đá", category: "Cà phê", description: "Latte lạnh hòa cùng vị dừa béo nhẹ", price: "55000", stock: 100 },
  { name: "Latte kem muối đá", category: "Cà phê", description: "Latte đá phủ kem muối", price: "59000", stock: 100 },
  { name: "Cappuccino đá", category: "Cà phê", description: "Espresso và sữa lạnh cùng bọt sữa mịn", price: "49000", stock: 100 },
  { name: "Mocha đá", category: "Cà phê", description: "Espresso kết hợp sữa và chocolate lạnh", price: "55000", stock: 100 },
  { name: "White mocha đá", category: "Cà phê", description: "Espresso và chocolate trắng với sữa lạnh", price: "59000", stock: 100 },
  { name: "Caramel macchiato đá", category: "Cà phê", description: "Sữa lạnh, espresso và sốt caramel", price: "59000", stock: 100 },
  { name: "Hazelnut macchiato đá", category: "Cà phê", description: "Sữa lạnh cùng espresso và hạt phỉ", price: "59000", stock: 100 },
  { name: "Cold brew nguyên bản", category: "Cà phê", description: "Cà phê ủ lạnh hương vị êm dịu", price: "45000", stock: 100 },
  { name: "Cold brew cam", category: "Cà phê", description: "Cà phê ủ lạnh cùng vị cam", price: "55000", stock: 100 },
  { name: "Cold brew chanh vàng", category: "Cà phê", description: "Cà phê ủ lạnh hòa cùng chanh vàng", price: "55000", stock: 100 },
  { name: "Cold brew mật ong", category: "Cà phê", description: "Cà phê ủ lạnh thêm mật ong", price: "55000", stock: 100 },
  { name: "Cold brew đào", category: "Cà phê", description: "Cà phê ủ lạnh kết hợp vị đào", price: "55000", stock: 100 },
  { name: "Cold brew vải", category: "Cà phê", description: "Cà phê ủ lạnh kết hợp vải ngọt dịu", price: "55000", stock: 100 },
  { name: "Cold brew dứa", category: "Cà phê", description: "Cà phê ủ lạnh thơm vị dứa", price: "55000", stock: 100 },
  { name: "Cold brew dừa", category: "Cà phê", description: "Cà phê ủ lạnh cùng nước dừa", price: "55000", stock: 100 },
  { name: "Cold brew kem sữa", category: "Cà phê", description: "Cà phê ủ lạnh phủ kem sữa", price: "59000", stock: 100 },
  { name: "Cold brew vanilla", category: "Cà phê", description: "Cà phê ủ lạnh thêm vanilla", price: "55000", stock: 100 },
  { name: "Cold brew caramel", category: "Cà phê", description: "Cà phê ủ lạnh kết hợp caramel", price: "55000", stock: 100 },
  { name: "Cà phê đá xay nguyên bản", category: "Cà phê", description: "Cà phê và sữa xay nhuyễn cùng đá", price: "55000", stock: 100 },
  { name: "Cà phê caramel đá xay", category: "Cà phê", description: "Cà phê đá xay với caramel", price: "59000", stock: 100 },
  { name: "Cà phê mocha đá xay", category: "Cà phê", description: "Cà phê đá xay cùng chocolate", price: "59000", stock: 100 },
  { name: "Cà phê cookie đá xay", category: "Cà phê", description: "Cà phê đá xay cùng bánh quy cacao", price: "65000", stock: 100 },
  { name: "Cà phê hạt phỉ đá xay", category: "Cà phê", description: "Cà phê đá xay hương hạt phỉ", price: "65000", stock: 100 },
  { name: "Cà phê cốt dừa đá xay", category: "Cà phê", description: "Cà phê xay đá cùng cốt dừa", price: "65000", stock: 100 },

  // Trà (50)
  { name: "Trà đào cam sả đá", category: "Trà", description: "Trà ướp đào cùng cam và sả, uống lạnh", price: "45000", stock: 100 },
  { name: "Trà đào đá", category: "Trà", description: "Trà thơm hương đào và miếng đào", price: "39000", stock: 100 },
  { name: "Trà vải đá", category: "Trà", description: "Trà thanh mát cùng vải ngọt", price: "45000", stock: 100 },
  { name: "Trà sen vàng đá", category: "Trà", description: "Trà sen lạnh với hạt sen bùi và thạch", price: "49000", stock: 100 },
  { name: "Trà sen nhãn đá", category: "Trà", description: "Trà sen lạnh hòa cùng nhãn ngọt", price: "49000", stock: 100 },
  { name: "Trà tắc mật ong đá", category: "Trà", description: "Trà tắc chua nhẹ cùng mật ong", price: "35000", stock: 100 },
  { name: "Trà chanh đá", category: "Trà", description: "Trà lạnh kết hợp chanh tươi", price: "35000", stock: 100 },
  { name: "Trà chanh dây đá", category: "Trà", description: "Trà lạnh vị chanh dây chua ngọt", price: "45000", stock: 100 },
  { name: "Trà dâu đá", category: "Trà", description: "Trà lạnh cùng dâu tây", price: "45000", stock: 100 },
  { name: "Trà xoài đá", category: "Trà", description: "Trà lạnh hòa cùng xoài chín", price: "45000", stock: 100 },
  { name: "Trà ổi hồng đá", category: "Trà", description: "Trà lạnh cùng ổi hồng thơm dịu", price: "49000", stock: 100 },
  { name: "Trà dứa đá", category: "Trà", description: "Trà trái cây lạnh hương dứa", price: "45000", stock: 100 },
  { name: "Trà táo xanh đá", category: "Trà", description: "Trà lạnh vị táo xanh thanh mát", price: "45000", stock: 100 },
  { name: "Trà kiwi đá", category: "Trà", description: "Trà lạnh với kiwi chua ngọt", price: "49000", stock: 100 },
  { name: "Trà bưởi hồng đá", category: "Trà", description: "Trà lạnh cùng bưởi hồng thanh dịu", price: "49000", stock: 100 },
  { name: "Trà mận đá", category: "Trà", description: "Trà lạnh hòa vị mận chua ngọt", price: "45000", stock: 100 },
  { name: "Trà dưa lưới đá", category: "Trà", description: "Trà lạnh hương dưa lưới", price: "49000", stock: 100 },
  { name: "Trà dưa hấu đá", category: "Trà", description: "Trà lạnh cùng dưa hấu thanh ngọt", price: "45000", stock: 100 },
  { name: "Trà nhiệt đới đá", category: "Trà", description: "Trà lạnh cùng nhiều loại trái cây", price: "55000", stock: 100 },
  { name: "Trà cam quế đá", category: "Trà", description: "Trà lạnh hòa cam và hương quế", price: "49000", stock: 100 },
  { name: "Trà ô long nguyên bản đá", category: "Trà", description: "Ô long ủ trà và làm lạnh trên đá", price: "39000", stock: 100 },
  { name: "Trà lài nguyên bản đá", category: "Trà", description: "Trà lài thơm nhẹ phục vụ lạnh", price: "39000", stock: 100 },
  { name: "Trà đen nguyên bản đá", category: "Trà", description: "Hồng trà đậm hương dùng với đá", price: "35000", stock: 100 },
  { name: "Trà ô long mật ong đá", category: "Trà", description: "Ô long lạnh với mật ong", price: "45000", stock: 100 },
  { name: "Trà ô long đào đá", category: "Trà", description: "Ô long lạnh vị đào", price: "49000", stock: 100 },
  { name: "Trà ô long vải đá", category: "Trà", description: "Ô long lạnh cùng vải", price: "49000", stock: 100 },
  { name: "Trà ô long dâu đá", category: "Trà", description: "Ô long lạnh cùng dâu tây", price: "49000", stock: 100 },
  { name: "Trà nhài nha đam đá", category: "Trà", description: "Trà lài lạnh với nha đam giòn", price: "45000", stock: 100 },
  { name: "Trà nhài thạch vải đá", category: "Trà", description: "Trà lài lạnh với thạch vải", price: "49000", stock: 100 },
  { name: "Trà xanh chanh vàng đá", category: "Trà", description: "Trà xanh lạnh cùng chanh vàng", price: "45000", stock: 100 },
  { name: "Trà sữa truyền thống đá", category: "Trà", description: "Hồng trà kết hợp sữa và đá", price: "39000", stock: 100 },
  { name: "Trà sữa trân châu đen đá", category: "Trà", description: "Trà sữa lạnh kèm trân châu đen", price: "45000", stock: 100 },
  { name: "Trà sữa trân châu trắng đá", category: "Trà", description: "Trà sữa lạnh kèm trân châu trắng", price: "45000", stock: 100 },
  { name: "Trà sữa ô long đá", category: "Trà", description: "Ô long hòa sữa thơm béo và đá", price: "45000", stock: 100 },
  { name: "Trà sữa lài đá", category: "Trà", description: "Trà lài và sữa phục vụ lạnh", price: "45000", stock: 100 },
  { name: "Trà sữa đường đen đá", category: "Trà", description: "Trà sữa lạnh cùng syrup đường đen", price: "49000", stock: 100 },
  { name: "Trà sữa khoai môn đá", category: "Trà", description: "Trà sữa lạnh vị khoai môn bùi", price: "49000", stock: 100 },
  { name: "Trà sữa gạo rang đá", category: "Trà", description: "Trà sữa lạnh thơm hương gạo rang", price: "49000", stock: 100 },
  { name: "Trà sữa hạt dẻ đá", category: "Trà", description: "Trà sữa lạnh hương hạt dẻ", price: "49000", stock: 100 },
  { name: "Trà sữa caramel đá", category: "Trà", description: "Trà sữa lạnh và caramel", price: "49000", stock: 100 },
  { name: "Trà sữa kem cheese đá", category: "Trà", description: "Trà sữa lạnh phủ kem cheese", price: "55000", stock: 100 },
  { name: "Trà sữa pudding trứng đá", category: "Trà", description: "Trà sữa lạnh và pudding trứng", price: "49000", stock: 100 },
  { name: "Trà sữa matcha đá", category: "Trà", description: "Trà xanh matcha và sữa lạnh", price: "55000", stock: 100 },
  { name: "Matcha latte đá", category: "Trà", description: "Matcha đậm hương kết hợp sữa lạnh", price: "55000", stock: 100 },
  { name: "Matcha dâu đá", category: "Trà", description: "Matcha lạnh hòa cùng dâu tây", price: "59000", stock: 100 },
  { name: "Matcha dừa đá", category: "Trà", description: "Matcha lạnh với vị dừa béo nhẹ", price: "59000", stock: 100 },
  { name: "Matcha kem muối đá", category: "Trà", description: "Matcha sữa lạnh phủ kem muối", price: "59000", stock: 100 },
  { name: "Trà xanh đá xay", category: "Trà", description: "Trà xanh cùng sữa xay với đá", price: "59000", stock: 100 },
  { name: "Matcha cookie đá xay", category: "Trà", description: "Matcha đá xay với bánh quy cacao", price: "65000", stock: 100 },
  { name: "Trà ô long kem sữa đá", category: "Trà", description: "Ô long lạnh phủ lớp kem sữa", price: "55000", stock: 100 },

  // Bánh (50)
  { name: "Croissant bơ", category: "Bánh", description: "Bánh sừng bò nhiều lớp thơm bơ", price: "35000", stock: 50 },
  { name: "Croissant hạnh nhân", category: "Bánh", description: "Bánh sừng bò phủ hạnh nhân lát", price: "45000", stock: 50 },
  { name: "Croissant chocolate", category: "Bánh", description: "Bánh sừng bò nhân chocolate", price: "45000", stock: 50 },
  { name: "Croissant phô mai", category: "Bánh", description: "Bánh sừng bò nhân phô mai", price: "45000", stock: 50 },
  { name: "Pain au chocolat", category: "Bánh", description: "Bánh ngàn lớp nhân chocolate", price: "45000", stock: 50 },
  { name: "Danish táo", category: "Bánh", description: "Bánh ngàn lớp nhân táo và quế", price: "45000", stock: 50 },
  { name: "Danish đào", category: "Bánh", description: "Bánh ngàn lớp với đào ngọt dịu", price: "45000", stock: 50 },
  { name: "Danish việt quất", category: "Bánh", description: "Bánh ngàn lớp phủ việt quất", price: "49000", stock: 50 },
  { name: "Bánh cuộn quế", category: "Bánh", description: "Bánh cuộn mềm thơm hương quế", price: "39000", stock: 50 },
  { name: "Bánh cuộn nho", category: "Bánh", description: "Bánh cuộn mềm với nho khô", price: "39000", stock: 50 },
  { name: "Muffin chocolate", category: "Bánh", description: "Bánh muffin mềm với chocolate", price: "39000", stock: 50 },
  { name: "Muffin việt quất", category: "Bánh", description: "Bánh muffin với quả việt quất", price: "42000", stock: 50 },
  { name: "Muffin chuối", category: "Bánh", description: "Muffin mềm thơm vị chuối", price: "39000", stock: 50 },
  { name: "Muffin vani", category: "Bánh", description: "Muffin mềm thơm hương vanilla", price: "35000", stock: 50 },
  { name: "Muffin matcha", category: "Bánh", description: "Muffin vị trà xanh matcha", price: "42000", stock: 50 },
  { name: "Bánh chuối nướng", category: "Bánh", description: "Bánh chuối mềm thơm, dùng ở nhiệt độ phòng", price: "39000", stock: 50 },
  { name: "Bánh cà rốt", category: "Bánh", description: "Bánh cà rốt có gia vị nhẹ và kem phủ", price: "45000", stock: 50 },
  { name: "Bánh bông lan trứng muối", category: "Bánh", description: "Bông lan mềm với sốt và trứng muối", price: "49000", stock: 50 },
  { name: "Bánh bông lan phô mai", category: "Bánh", description: "Bông lan mềm thơm vị phô mai", price: "45000", stock: 50 },
  { name: "Bánh bông lan cuộn kem", category: "Bánh", description: "Bông lan cuộn nhân kem mịn", price: "45000", stock: 50 },
  { name: "Bánh bông lan cuộn dâu", category: "Bánh", description: "Bông lan cuộn kem và dâu", price: "49000", stock: 50 },
  { name: "Bánh bông lan cuộn matcha", category: "Bánh", description: "Bông lan cuộn kem matcha", price: "49000", stock: 50 },
  { name: "Cheesecake New York", category: "Bánh", description: "Bánh phô mai nướng dùng lạnh", price: "59000", stock: 50 },
  { name: "Cheesecake dâu", category: "Bánh", description: "Bánh phô mai mát lạnh và dâu", price: "65000", stock: 50 },
  { name: "Cheesecake việt quất", category: "Bánh", description: "Bánh phô mai dùng lạnh với việt quất", price: "65000", stock: 50 },
  { name: "Cheesecake chanh dây", category: "Bánh", description: "Bánh phô mai lạnh vị chanh dây", price: "65000", stock: 50 },
  { name: "Cheesecake xoài", category: "Bánh", description: "Bánh phô mai lạnh cùng xoài", price: "65000", stock: 50 },
  { name: "Cheesecake matcha", category: "Bánh", description: "Bánh phô mai lạnh vị matcha", price: "69000", stock: 50 },
  { name: "Tiramisu truyền thống", category: "Bánh", description: "Bánh kem cà phê mascarpone dùng lạnh", price: "65000", stock: 50 },
  { name: "Tiramisu matcha", category: "Bánh", description: "Tiramisu lạnh với matcha", price: "69000", stock: 50 },
  { name: "Tiramisu chocolate", category: "Bánh", description: "Tiramisu lạnh phủ cacao và chocolate", price: "69000", stock: 50 },
  { name: "Red velvet cake", category: "Bánh", description: "Bánh red velvet với kem phô mai", price: "65000", stock: 50 },
  { name: "Carrot cream cake", category: "Bánh", description: "Bánh cà rốt nhiều lớp cùng kem phô mai", price: "65000", stock: 50 },
  { name: "Chocolate fudge cake", category: "Bánh", description: "Bánh chocolate mềm với lớp sốt đậm vị", price: "65000", stock: 50 },
  { name: "Chocolate mousse cake", category: "Bánh", description: "Bánh mousse chocolate mềm mịn dùng lạnh", price: "65000", stock: 50 },
  { name: "Mousse dâu", category: "Bánh", description: "Bánh mousse dâu thanh nhẹ dùng lạnh", price: "59000", stock: 50 },
  { name: "Mousse xoài", category: "Bánh", description: "Bánh mousse xoài tươi mát", price: "59000", stock: 50 },
  { name: "Mousse chanh dây", category: "Bánh", description: "Bánh mousse chanh dây chua dịu", price: "59000", stock: 50 },
  { name: "Mousse matcha", category: "Bánh", description: "Bánh mousse trà xanh thanh nhẹ", price: "65000", stock: 50 },
  { name: "Black forest cake", category: "Bánh", description: "Bánh chocolate kem tươi và cherry", price: "69000", stock: 50 },
  { name: "Opera cake", category: "Bánh", description: "Bánh nhiều lớp vị cà phê và chocolate", price: "69000", stock: 50 },
  { name: "Bánh kem bắp", category: "Bánh", description: "Bông lan kem tươi cùng bắp ngọt", price: "59000", stock: 50 },
  { name: "Bánh kem dâu", category: "Bánh", description: "Bông lan kem tươi và dâu", price: "65000", stock: 50 },
  { name: "Bánh kem trà xanh", category: "Bánh", description: "Bông lan nhiều lớp kem matcha", price: "65000", stock: 50 },
  { name: "Brownie chocolate", category: "Bánh", description: "Bánh brownie chocolate đậm vị", price: "39000", stock: 50 },
  { name: "Brownie hạt óc chó", category: "Bánh", description: "Bánh brownie chocolate cùng hạt óc chó", price: "45000", stock: 50 },
  { name: "Cookie chocolate chip", category: "Bánh", description: "Bánh quy bơ cùng chocolate chip", price: "29000", stock: 50 },
  { name: "Cookie matcha", category: "Bánh", description: "Bánh quy thơm vị matcha", price: "29000", stock: 50 },
  { name: "Macaron vanilla", category: "Bánh", description: "Bánh macaron nhân kem vanilla", price: "35000", stock: 50 },
  { name: "Macaron raspberry", category: "Bánh", description: "Bánh macaron nhân mâm xôi", price: "35000", stock: 50 },
];

const toppingData = [
  { name: "Trân châu đen", price: "7000", stock: 100 },
  { name: "Thạch trái cây", price: "7000", stock: 100 },
  { name: "Kem cheese", price: "10000", stock: 50 },
  { name: "Pudding trứng", price: "8000", stock: 80 },
  { name: "Trân châu trắng", price: "8000", stock: 90 },
  { name: "Thạch nha đam", price: "7000", stock: 80 },
  { name: "Trân châu hoàng kim", price: "9000", stock: 90 },
  { name: "Trân châu đường đen", price: "9000", stock: 90 },
  { name: "Thạch cà phê", price: "8000", stock: 80 },
  { name: "Thạch dừa", price: "8000", stock: 85 },
  { name: "Thạch vải", price: "9000", stock: 75 },
  { name: "Pudding socola", price: "9000", stock: 70 },
  { name: "Pudding matcha", price: "10000", stock: 70 },
  { name: "Kem sữa mặn", price: "10000", stock: 65 },
  { name: "Kem vani", price: "12000", stock: 70 },
  { name: "Hạt sen", price: "10000", stock: 75 },
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
  const expectedCategories = ["Cà phê", "Trà", "Bánh"];
  if (productData.length !== 150 || promotionData.length !== 10 ||
      expectedCategories.some((category) => productData.filter((p) => p.category === category).length !== 50) ||
      productData.some((p) => !expectedCategories.includes(p.category))) {
    throw new Error("Seed phải có đúng 50 món mỗi danh mục (150 sản phẩm) và 10 mã khuyến mãi.");
  }
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

  await prisma.category.updateMany({
    where: { name: { notIn: [...categories.keys()] } },
    data: { isActive: false },
  });

  const products = new Map<string, bigint>();
  for (const item of productData) {
    const categoryId = categories.get(item.category)!;
    const existing = await prisma.product.findFirst({
      where: { name: item.name, categoryId },
      orderBy: { id: "asc" },
    });

    // Tự động sinh đường dẫn ảnh trỏ tới thư mục public của backend
    const imagePath = `/image/${slugify(item.name)}.jpg`;

    const data = {
      categoryId,
      name: item.name,
      description: item.description,
      price: item.price,
      stock: item.stock,
      imageUrl: imagePath,
      isActive: true,
    };
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data })
      : await prisma.product.create({ data });
    products.set(item.name, product.id);
  }

  const activeProductIds = [...products.values()];
  await prisma.product.updateMany({
    where: { id: { notIn: activeProductIds } },
    data: { isActive: false },
  });

  const sizePrices = [
    { sizeCode: "S", extraPrice: "0" },
    { sizeCode: "M", extraPrice: "5000" },
    { sizeCode: "L", extraPrice: "10000" },
  ];
  for (const item of productData) {
    const productId = products.get(item.name)!;
    if (item.category === "Bánh") {
      await prisma.productSize.updateMany({ where: { productId }, data: { isActive: false } });
      await prisma.productSize.upsert({
        where: { productId_sizeCode: { productId, sizeCode: "S" } },
        update: { extraPrice: "0", isActive: true },
        create: { productId, sizeCode: "S", extraPrice: "0", isActive: true },
      });
      continue;
    }
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

  for (const item of productData) {
    const selectedToppings = item.category === "Trà"
      ? ["Trân châu đen", "Trân châu trắng", "Trân châu hoàng kim", "Trân châu đường đen", "Thạch trái cây", "Thạch nha đam", "Thạch dừa", "Thạch vải", "Pudding trứng", "Pudding socola", "Pudding matcha", "Kem cheese", "Kem sữa mặn", "Hạt sen"]
      : item.category === "Cà phê"
        ? ["Kem cheese", "Kem sữa mặn", "Kem vani", "Thạch cà phê", "Trân châu đường đen"]
        : [];
    const productId = products.get(item.name)!;
    await prisma.productTopping.deleteMany({
      where: { productId, toppingId: { notIn: selectedToppings.map((name) => toppings.get(name)!) } },
    });
    for (const toppingName of selectedToppings) {
      const toppingId = toppings.get(toppingName)!;
      await prisma.productTopping.upsert({
        where: { productId_toppingId: { productId, toppingId } },
        update: {},
        create: { productId, toppingId },
      });
    }
  }

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

  console.log("Bắt đầu seed tài khoản mẫu...");

  if (process.env.NODE_ENV !== "production") {
    for (const account of accountData) {
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email },
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