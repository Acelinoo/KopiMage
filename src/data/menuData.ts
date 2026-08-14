import { CategoryInfo, MenuItem } from '../types/menu';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'Semua Menu', description: 'Koleksi racikan kopi, minuman segar, dan hidangan favorit KOPIMAGE' },
  { id: 'coffee', name: 'Coffee', description: 'Espresso-based, Caramel Latte, & Creme Brulee Signature' },
  { id: 'non-coffee', name: 'Non-Coffee', description: 'Chocolate Float & sajian minuman segar pilihan' },
  { id: 'main-course', name: 'Main Course', description: 'Sajian hidangan utama lezat: Ayam Katsu, Beef Saus Mongol, & Mie Julid' }
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'menu-ayam-katsu',
    name: 'Ayam Katsu',
    category: 'main-course',
    price: 'Rp 35.000',
    description: 'Fillet ayam goreng tepung crispy khas Jepang disajikan dengan saus katsu gurih spesial dan nasi hangat.',
    image: '/images/Menu-Ayam Katsu.webp',
    isBestSeller: true,
    tags: ['Ayam Katsu', 'Main Course', 'Best Seller']
  },
  {
    id: 'menu-beef-saus-mongol',
    name: 'Beef Saus Mongol',
    category: 'main-course',
    price: 'Rp 38.000',
    description: 'Irisan daging sapi empuk dimasak dengan saus Mongolian bercita rasa gurih manis dan aroma rempah harum.',
    image: '/images/Menu-Beef Saus Mongol.webp',
    isBestSeller: true,
    tags: ['Beef', 'Mongolian', 'Best Seller']
  },
  {
    id: 'menu-caramel-latte',
    name: 'Caramel Latte',
    category: 'coffee',
    price: 'Rp 28.000',
    description: 'Espresso mantap berpadu susu segar lembut dan siraman saus karamel manis legit yang seimbang.',
    image: '/images/Menu-Caramel Latte.webp',
    temperature: 'Hot / Cold',
    isBestSeller: true,
    tags: ['Coffee', 'Caramel Latte', 'Best Seller']
  },
  {
    id: 'menu-chocolate-float',
    name: 'Chocolate Float',
    category: 'non-coffee',
    price: 'Rp 30.000',
    description: 'Cokelat pekat creamy dengan topping es krim vanila lumer yang manis dan menyegarkan dahaga.',
    image: '/images/Menu-Chocolate Float.webp',
    temperature: 'Cold',
    isBestSeller: true,
    tags: ['Non-Coffee', 'Chocolate Float', 'Best Seller']
  },
  {
    id: 'menu-creme-brulee',
    name: 'Creme Brulee',
    category: 'coffee',
    price: 'Rp 30.000',
    description: 'Racikan kopi susu dengan lapisan karamel bakar renyah di atasnya yang harum, legit, dan kaya rasa.',
    image: '/images/Menu-Creme BRULEE.webp',
    temperature: 'Hot / Cold',
    isBestSeller: true,
    tags: ['Coffee', 'Creme Brulee', 'Signature']
  },
  {
    id: 'menu-mie-julid',
    name: 'Mie Julid',
    category: 'main-course',
    price: 'Rp 25.000',
    description: 'Mie pedas gurih nagih dengan bumbu cabai spesial, taburan pangsit renyah, dan potongan ayam lezat.',
    image: '/images/Menu-Mie Julid.webp',
    isBestSeller: true,
    tags: ['Mie Pedas', 'Mie Julid', 'Best Seller']
  }
];
