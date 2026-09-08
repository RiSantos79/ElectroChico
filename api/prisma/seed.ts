import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const categories = [
  {
    slug: 'informatica',
    name: 'Informática',
    subcategories: [
      'Portáteis', 'Monitores', 'Periféricos', 'Impressoras', 'Consumíveis de Impressão',
      'Cadeiras Gaming', 'Teclados Gaming', 'Ratos Gaming', 'Auscultadores Gaming', 'Tapetes Gaming', 'Consolas',
    ],
  },
  {
    slug: 'eletrodomesticos',
    name: 'Eletrodomésticos',
    subcategories: [
      'Máquinas de Lavar Roupa', 'Combinados', 'Placas', 'Micro-Ondas', 'Máquinas de Lavar e Secar Roupa',
      'Frigoríficos', 'Fogões', 'Tratamento de Águas', 'Máquinas de Secar Roupa', 'Frigoríficos Side-by-Side',
      'Máquinas de Café', 'Climatização / Tratamento do Ar', 'Tratamento de Roupa', 'Arcas Frigoríficas',
      'Preparação Alimentar', 'Lava-Loiças / Misturadoras', 'Cuidados do Lar', 'Máquinas de Lavar Loiça',
      'Exaustores', 'Cuidados Pessoais', 'Fornos', 'Hotelaria / Indústria',
    ],
  },
  {
    slug: 'imagem-e-som',
    name: 'Imagem e Som',
    subcategories: ['Televisores', 'Videoprojetores', 'Home Cinema', 'Acessórios TV', 'Car Áudio/Multimédia'],
  },
  {
    slug: 'espaco-crianca',
    name: 'Espaço Criança',
    subcategories: ['Carros Elétricos', 'Motas Elétricas', 'Piscinas', 'Brinquedos de Exterior'],
  },
  {
    slug: 'gaming-zone',
    name: 'Gaming Zone',
    subcategories: ['Funko', 'Disney', 'Anime/Manga', 'Séries de TV', 'Filmes', 'Super Heróis', 'Jogos/Brinquedos', 'Videojogos', 'Pré-Reservas'],
  },
  {
    slug: 'mobilidade',
    name: 'Mobilidade',
    subcategories: ['Smartphones', 'Smartwatch/Wearables', 'Trotinetes', 'Acessórios Telemóvel'],
  },
];

const products = [
  {
    slug: 'frigorifico-samsung-rb34-combinado',
    name: 'Frigorífico Combinado Samsung RB34 No Frost',
    brand: 'Samsung',
    category: 'eletrodomesticos',
    price: 549.99,
    oldPrice: 649.99,
    energyClass: 'D' as const,
    stockQuantity: 18,
    badge: 'PROMO' as const,
    color: '#1f2937',
    description: 'Frigorífico combinado com tecnologia No Frost, All-Around Cooling e compressor Digital Inverter com 10 anos de garantia.',
    specs: [
      { label: 'Capacidade líquida', value: '344 L' },
      { label: 'Classe energética', value: 'D' },
      { label: 'Dimensões (A x L x P)', value: '185 x 60 x 66 cm' },
      { label: 'Nível de ruído', value: '36 dB' },
      { label: 'Garantia', value: '3 anos (10 no compressor)' },
    ],
  },
  {
    slug: 'maquina-lavar-roupa-bosch-serie-6',
    name: 'Máquina de Lavar Roupa Bosch Série 6 9kg',
    brand: 'Bosch',
    category: 'eletrodomesticos',
    price: 469.0,
    energyClass: 'B' as const,
    stockQuantity: 24,
    badge: 'MAIS_VENDIDO' as const,
    color: '#334155',
    description: 'Motor EcoSilence Drive, sistema i-DOS para dosagem automática de detergente e programa AntiStain de 60 minutos.',
    specs: [
      { label: 'Capacidade', value: '9 kg' },
      { label: 'Velocidade centrifugação', value: '1400 rpm' },
      { label: 'Classe energética', value: 'B' },
      { label: 'Nível de ruído', value: '47 dB' },
    ],
  },
  {
    slug: 'tv-lg-oled-55-c4',
    name: "TV LG OLED evo 55'' C4 4K Smart TV",
    brand: 'LG',
    category: 'imagem-e-som',
    price: 1399.0,
    oldPrice: 1599.0,
    energyClass: 'F' as const,
    stockQuantity: 4,
    badge: 'PROMO' as const,
    color: '#0f172a',
    description: 'Painel OLED evo com processador α9 Gen7 AI, 144Hz para gaming, Dolby Vision IQ e webOS 24.',
    specs: [
      { label: 'Tamanho', value: "55'' (139 cm)" },
      { label: 'Resolução', value: '4K UHD (3840x2160)' },
      { label: 'HDR', value: 'Dolby Vision, HDR10, HLG' },
      { label: 'Taxa de atualização', value: '144 Hz' },
    ],
  },
  {
    slug: 'ar-condicionado-daikin-perfera-2-5cv',
    name: 'Ar Condicionado Daikin Perfera 2.5CV',
    brand: 'Daikin',
    category: 'eletrodomesticos',
    price: 899.0,
    energyClass: 'A' as const,
    stockQuantity: 12,
    color: '#1e293b',
    description: 'Bomba de calor com purificador de ar integrado, controlo por app e funcionamento ultrassilencioso.',
    specs: [
      { label: 'Potência', value: '2.5 CV / 7.1 kW' },
      { label: 'Classe energética (frio)', value: 'A+++' },
      { label: 'Wi-Fi', value: 'Incluído' },
    ],
  },
  {
    slug: 'robo-aspirador-roborock-s8',
    name: 'Robô Aspirador Roborock S8 Lavagem e Aspiração',
    brand: 'Roborock',
    category: 'eletrodomesticos',
    price: 549.0,
    oldPrice: 699.0,
    energyClass: 'A' as const,
    stockQuantity: 7,
    badge: 'NOVO' as const,
    color: '#111827',
    description: 'Sonic Mopping com 3000 vibrações por minuto, sucção de 6000 Pa e navegação LiDAR de precisão.',
    specs: [
      { label: 'Sucção', value: '6000 Pa' },
      { label: 'Autonomia', value: '180 min' },
      { label: 'Navegação', value: 'LiDAR' },
    ],
  },
  {
    slug: 'maquina-cafe-delonghi-magnifica',
    name: 'Máquina de Café DeLonghi Magnifica Evo',
    brand: 'DeLonghi',
    category: 'eletrodomesticos',
    price: 379.0,
    energyClass: 'A' as const,
    stockQuantity: 15,
    color: '#0b0e11',
    description: 'Moinho de café integrado com 13 níveis de moagem, sistema LatteCrema e ecrã intuitivo.',
    specs: [
      { label: 'Pressão', value: '15 bar' },
      { label: 'Depósito de água', value: '1.8 L' },
      { label: 'Moinho', value: '13 níveis' },
    ],
  },
  {
    slug: 'termoacumulador-bosch-tronic-100l',
    name: 'Termoacumulador Bosch Tronic 100L',
    brand: 'Bosch',
    category: 'eletrodomesticos',
    price: 259.0,
    energyClass: 'C' as const,
    stockQuantity: 2,
    color: '#1f2937',
    description: 'Termoacumulador vertical com resistência blindada e isolamento térmico reforçado.',
    specs: [
      { label: 'Capacidade', value: '100 L' },
      { label: 'Instalação', value: 'Vertical' },
      { label: 'Classe energética', value: 'C' },
    ],
  },
  {
    slug: 'placa-inducao-siemens-iq700',
    name: 'Placa de Indução Siemens iQ700 4 Zonas',
    brand: 'Siemens',
    category: 'eletrodomesticos',
    price: 649.0,
    oldPrice: 749.0,
    energyClass: 'A' as const,
    stockQuantity: 9,
    badge: 'PROMO' as const,
    color: '#0f172a',
    description: 'Indução com combinZone, PowerBoost e controlo touchSlider para precisão total.',
    specs: [
      { label: 'Zonas de indução', value: '4' },
      { label: 'Largura', value: '80 cm' },
      { label: 'Classe energética', value: 'A' },
    ],
  },
];

// Avaliações de exemplo — simulam o que os clientes vão escrever na loja.
// A média (rating) e a contagem (reviewCount) do produto são sempre calculadas
// a partir destas linhas, nunca escritas à mão.
const demoReviews: Record<string, { authorName: string; rating: number; comment: string }[]> = {
  'frigorifico-samsung-rb34-combinado': [
    { authorName: 'Marta S.', rating: 5, comment: 'Silencioso e com muito espaço. Recomendo.' },
    { authorName: 'João P.', rating: 4, comment: 'Bom frigorífico, entrega rápida.' },
  ],
  'maquina-lavar-roupa-bosch-serie-6': [
    { authorName: 'Ana R.', rating: 5, comment: 'Lava muito bem e gasta pouca água.' },
    { authorName: 'Carlos M.', rating: 5, comment: 'Excelente relação qualidade/preço.' },
  ],
  'tv-lg-oled-55-c4': [
    { authorName: 'Rui F.', rating: 5, comment: 'Imagem incrível, superou as expectativas.' },
    { authorName: 'Sofia L.', rating: 5, comment: 'Perfeita para gaming, sem lag nenhum.' },
  ],
  'ar-condicionado-daikin-perfera-2-5cv': [
    { authorName: 'Pedro A.', rating: 5, comment: 'Instalação fácil e muito silencioso.' },
  ],
  'robo-aspirador-roborock-s8': [
    { authorName: 'Beatriz N.', rating: 4, comment: 'Ótimo, só falha em tapetes muito altos.' },
    { authorName: 'Tiago C.', rating: 5, comment: 'Mudou a minha rotina de limpeza.' },
  ],
  'maquina-cafe-delonghi-magnifica': [
    { authorName: 'Inês V.', rating: 5, comment: 'Café perfeito todos os dias.' },
  ],
  'termoacumulador-bosch-tronic-100l': [
    { authorName: 'Miguel T.', rating: 4, comment: 'Cumpre bem, instalação por conta própria fácil.' },
  ],
  'placa-inducao-siemens-iq700': [
    { authorName: 'Cláudia B.', rating: 5, comment: 'Aquece rapidíssimo e é fácil de limpar.' },
  ],
};

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, subcategories: c.subcategories },
      create: c,
    });
  }

  for (const p of products) {
    const { category, ...data } = p;
    const categoryRecord = await prisma.category.findUniqueOrThrow({ where: { slug: category } });
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...data, categoryId: categoryRecord.id },
      create: { ...data, categoryId: categoryRecord.id },
    });

    const reviews = demoReviews[p.slug] ?? [];
    const existing = await prisma.review.count({ where: { productId: product.id } });
    if (reviews.length > 0 && existing === 0) {
      await prisma.review.createMany({
        data: reviews.map((r) => ({ ...r, productId: product.id })),
      });
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await prisma.product.update({
        where: { id: product.id },
        data: { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length },
      });
    }
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD);
    await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL },
      update: {},
      create: { email: process.env.ADMIN_EMAIL, passwordHash },
    });
    console.log(`Utilizador admin pronto: ${process.env.ADMIN_EMAIL}`);
  }

  console.log(`Seed concluído: ${categories.length} categorias, ${products.length} produtos.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
