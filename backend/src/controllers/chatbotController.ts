import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../database/pool';
import { predictChatbotIntent } from '../services/chatbotModel';

type ProductRow = RowDataPacket & {
  id: number;
  title: string;
  points: number;
  quantity: number;
  statusCode: string;
};

const getUserPoints = async (userId: number) => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT points FROM users WHERE id = ? LIMIT 1', [
    userId,
  ]);

  return Number(rows[0]?.points || 0);
};

const getAvailableProducts = async () => {
  const [rows] = await pool.query<ProductRow[]>(
    `SELECT p.id, p.title, p.points, p.quantity, ps.code AS statusCode
     FROM products p
     JOIN product_statuses ps ON ps.id = p.status_id
     WHERE ps.code = 'available' AND p.quantity > 0
     ORDER BY p.points ASC`
  );

  return rows;
};

const normalize = (value: string) => value.toLowerCase().trim();

const findMentionedProduct = (message: string, products: ProductRow[]) => {
  const normalizedMessage = normalize(message);
  return products.find((product) => normalizedMessage.includes(normalize(product.title)));
};

const recyclingAdvice = (message: string) => {
  const normalizedMessage = normalize(message);

  if (normalizedMessage.includes('plastic') || normalizedMessage.includes('بلاستيك')) {
    return 'اغسل البلاستيك بسرعة، نشفه، وافصل الزجاجات والعلب عن أي بقايا أكل. كل ما يكون نظيف ومفروز هيسهل استلامه.';
  }

  if (normalizedMessage.includes('paper') || normalizedMessage.includes('ورق')) {
    return 'جمع الورق والكرتون في كيس جاف، وابعده عن الميه أو بقايا الأكل عشان يفضل صالح لإعادة التدوير.';
  }

  if (normalizedMessage.includes('glass') || normalizedMessage.includes('زجاج')) {
    return 'الزجاج الأفضل يتحط في كيس منفصل وآمن، ولو فيه قطع مكسورة غلفها كويس واكتب تنبيه للعامل.';
  }

  if (normalizedMessage.includes('metal') || normalizedMessage.includes('معدن')) {
    return 'المعادن والعلب ينفع تتجمع بعد تفريغها وتنضيفها. ضغط العلب شوية بيوفر مساحة في التجميع.';
  }

  return 'ابدأ بفرز المخلفات حسب النوع: بلاستيك، ورق، معدن، وزجاج. خليك محافظ عليها نظيفة وجافة، وبعدها اعمل طلب تدوير من التطبيق.';
};

const buildRecommendation = (points: number, products: ProductRow[]) => {
  const affordable = products
    .filter((product) => product.points <= points)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  if (affordable.length > 0) {
    return `رصيدك الحالي ${points} نقطة. أنسب اختيارات ليك دلوقتي: ${affordable
      .map((product) => `${product.title} (${product.points} نقطة)`)
      .join('، ')}.`;
  }

  const cheapest = products[0];
  if (!cheapest) {
    return `رصيدك الحالي ${points} نقطة، ومفيش منتجات متاحة للاستبدال حاليًا.`;
  }

  return `رصيدك الحالي ${points} نقطة. أقرب منتج ليك هو ${cheapest.title} بسعر ${cheapest.points} نقطة، محتاج تزود ${cheapest.points - points} نقطة.`;
};

const buildReply = (label: string, message: string, points: number, products: ProductRow[]) => {
  const mentionedProduct = findMentionedProduct(message, products);

  if (mentionedProduct) {
    const diff = mentionedProduct.points - points;
    if (diff <= 0) {
      return `منتج ${mentionedProduct.title} متاح بـ ${mentionedProduct.points} نقطة، ورصيدك ${points} نقطة. تقدر تضيفه للسلة من المتجر.`;
    }

    return `منتج ${mentionedProduct.title} محتاج ${mentionedProduct.points} نقطة. رصيدك الحالي ${points} نقطة، فاضلك ${diff} نقطة.`;
  }

  if (label === 'points') {
    return `رصيدك الحالي ${points} نقطة. تقدر تستخدمهم في المتجر أو تزودهم بطلبات إعادة تدوير جديدة.`;
  }

  if (label === 'recommend_products') {
    return buildRecommendation(points, products);
  }

  if (label === 'recycling_info') {
    return recyclingAdvice(message);
  }

  if (label === 'project_info') {
    return 'Waste2win بيساعدك تطلب إعادة تدوير من البيت، تجمع نقاط، وتستبدلها بمنتجات من المتجر.';
  }

  return 'اسألني عن رصيد نقاطك، ترشيحات المنتجات، أو إزاي تجهز المخلفات لإعادة التدوير.';
};

export const sendChatbotMessage = async (req: Request, res: Response) => {
  const message = String(req.body.message || '').trim();
  const userId = Number(req.auth?.id);

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  const [prediction, points, products] = await Promise.all([
    predictChatbotIntent(message),
    getUserPoints(userId),
    getAvailableProducts(),
  ]);

  return res.json({
    intent: prediction.label,
    reply: buildReply(prediction.label, message, points, products),
  });
};
