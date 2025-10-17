import { pool } from '../config/database';

interface Kitchen {
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon_url?: string;
}

const kitchensData: Kitchen[] = [
  {
    name_en: 'Egyptian',
    name_ar: 'مصري',
    description_en: 'Traditional Egyptian cuisine featuring dishes like koshari, molokhia, and ful medames',
    description_ar: 'المطبخ المصري التقليدي يتميز بأطباق مثل الكشري والملوخية والفول المدمس',
    icon_url: '/icons/kitchens/egyptian.png'
  },
  {
    name_en: 'Gulf',
    name_ar: 'خليجي',
    description_en: 'Gulf cuisine with rich flavors including kabsa, machboos, and traditional seafood dishes',
    description_ar: 'المطبخ الخليجي بنكهاته الغنية يشمل الكبسة والمجبوس وأطباق المأكولات البحرية التقليدية',
    icon_url: '/icons/kitchens/gulf.png'
  },
  {
    name_en: 'Asian',
    name_ar: 'آسيوي',
    description_en: 'Diverse Asian cuisine including Chinese, Japanese, Thai, and Korean dishes',
    description_ar: 'المطبخ الآسيوي المتنوع يشمل الأطباق الصينية واليابانية والتايلاندية والكورية',
    icon_url: '/icons/kitchens/asian.png'
  },
  {
    name_en: 'Indian',
    name_ar: 'هندي',
    description_en: 'Authentic Indian cuisine with aromatic spices, curries, and traditional breads',
    description_ar: 'المطبخ الهندي الأصيل بتوابله العطرة والكاري والخبز التقليدي',
    icon_url: '/icons/kitchens/indian.png'
  },
  {
    name_en: 'European',
    name_ar: 'أوروبي',
    description_en: 'Classic European dishes from Italian pasta to French cuisine and Mediterranean flavors',
    description_ar: 'الأطباق الأوروبية الكلاسيكية من المعكرونة الإيطالية إلى المطبخ الفرنسي والنكهات المتوسطية',
    icon_url: '/icons/kitchens/european.png'
  },
  {
    name_en: 'Mexican',
    name_ar: 'مكسيكي',
    description_en: 'Vibrant Mexican cuisine with tacos, enchiladas, and traditional salsas',
    description_ar: 'المطبخ المكسيكي النابض بالحياة مع التاكو والإنتشيلادا والصلصات التقليدية',
    icon_url: '/icons/kitchens/mexican.png'
  }
];

export async function seedKitchens(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🍽️  Seeding kitchens...');
    
    // Check if kitchens already exist
    const existingKitchens = await client.query('SELECT COUNT(*) FROM kitchens');
    const count = parseInt(existingKitchens.rows[0].count);
    
    if (count > 0) {
      console.log(`ℹ️  Found ${count} existing kitchens, skipping kitchen seeding`);
      return;
    }

    // Insert kitchens
    for (const kitchen of kitchensData) {
      await client.query(`
        INSERT INTO kitchens (name_en, name_ar, description_en, description_ar, icon_url, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
      `, [
        kitchen.name_en,
        kitchen.name_ar,
        kitchen.description_en,
        kitchen.description_ar,
        kitchen.icon_url
      ]);
    }

    console.log(`✅ Successfully seeded ${kitchensData.length} kitchens`);
  } catch (error) {
    console.error('❌ Error seeding kitchens:', error);
    throw error;
  } finally {
    client.release();
  }
}