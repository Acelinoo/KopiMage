import { CategoryInfo, MenuItem } from '../types/menu';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'all', name: 'Semua Menu', description: 'Jelajahi seluruh racikan kopi, minuman, cemilan, dan makanan KOPIMAGE' },
  { id: 'seasonal', name: 'Seasonal Menu', description: 'Menu spesial musiman terfavorit kreasi barista & chef Mage' },
  { id: 'coffee', name: 'Coffee & Botolin', description: 'Espresso-based, Manual Brew, Es Kopi Susu, & Kemasan Literan' },
  { id: 'non-coffee', name: 'Non-Coffee & Tea', description: 'Chocolate, Authentic Thai Tea, Matcha, & Lemonade Freshness' },
  { id: 'cemilan-asin', name: 'Cemilan Asin', description: 'Snack crispy, finger food, fries, & skewers pas buat nemenin nongkrong' },
  { id: 'cemilan-manis', name: 'Cemilan Manis', description: 'Dessert manis renyah pelengkap momen ngopi santai' },
  { id: 'main-course', name: 'Main Course', description: 'Makanan berat lezat ala Mage: Nasi Goreng, Mie, Ayam, & Beef Series' }
];

export const MENU_ITEMS: MenuItem[] = [
  // --- SEASONAL ---
  {
    id: 's-1',
    name: 'ANARKIS (Ayamnya diBakar Manis)',
    category: 'seasonal',
    price: '32K',
    description: 'Ayam potong pilihan yang dibakar dengan bumbu rempah manis ala Mage',
    isSeasonal: true,
    isBestSeller: true,
    tags: ['Ayam Bakar', 'Spesial']
  },
  {
    id: 's-2',
    name: 'Chicken CR7 (Char Siuuuu)',
    category: 'seasonal',
    price: '32K',
    description: 'Ayam panggang bumbu Char Siu manis gurih meresap sampai ke serat daging',
    isSeasonal: true,
    tags: ['Char Siu', 'Ayam']
  },
  {
    id: 's-3',
    name: 'Basoka (Bakso Kentang Asoy)',
    category: 'seasonal',
    price: '27K',
    description: 'Kombinasi bakso goreng renyah dan potato chips saus spesial',
    isSeasonal: true,
    tags: ['Snack', 'Bakso']
  },
  {
    id: 's-4',
    name: 'Chip & Cheese',
    category: 'seasonal',
    price: '28K',
    description: 'Potato chips renyah dengan siraman saus keju lumer yang melimpah',
    isSeasonal: true,
    tags: ['Keju', 'Chips']
  },
  {
    id: 's-5',
    name: 'Bakso Goreng',
    category: 'seasonal',
    price: '22K',
    description: 'Bakso goreng mekar garing di luar kenyal di dalam dengan bumbu tabur',
    isSeasonal: true,
    tags: ['Snack']
  },
  {
    id: 's-6',
    name: 'AGAMIS (Ayam Goreng Mage Istimewa)',
    category: 'seasonal',
    price: '23K',
    description: 'Ayam goreng tepung bumbu rempah khas Mage yang renyah dan gurih',
    isSeasonal: true,
    tags: ['Ayam Goreng']
  },
  {
    id: 's-7',
    name: 'Cheese Potato Wedges',
    category: 'seasonal',
    price: '22K',
    description: 'Potongan kentang wedgess tebal dipanggang gurih dengan keju leleh',
    isSeasonal: true,
    tags: ['Potato', 'Keju']
  },
  {
    id: 's-8',
    name: 'Fries n Cheese',
    category: 'seasonal',
    price: '22K',
    description: 'French fries crispy bertabur keju gurih dan saus dipping keju',
    isSeasonal: true,
    tags: ['Fries']
  },

  // --- COFFEE & BOTOLIN ---
  {
    id: 'c-1',
    name: 'Es Kopi Susu',
    category: 'coffee',
    price: '22K',
    description: 'Perpaduan sempurna espresso khas KOPIMAGE, susu segar, dan gula aren pilihan',
    isBestSeller: true,
    temperature: 'Cold',
    tags: ['Best Seller', 'Signature']
  },
  {
    id: 'c-2',
    name: 'Es Kopi Susu Baileys',
    category: 'coffee',
    price: '24K',
    description: 'Es kopi susu creamy dengan aroma khas Baileys (non-alcohol flavor)',
    isBestSeller: true,
    temperature: 'Cold',
    tags: ['Best Seller', 'Creamy']
  },
  {
    id: 'c-3',
    name: 'Es Kopi Susu Caramel',
    category: 'coffee',
    price: '24K',
    description: 'Es kopi susu nikmat dipadu dengan sirup karamel legit dan wangi',
    temperature: 'Cold'
  },
  {
    id: 'c-4',
    name: 'Es Kopi Susu Makadam',
    category: 'coffee',
    price: '24K',
    description: 'Es kopi susu dengan sentuhan gurih dan harum kacang Macadamia',
    temperature: 'Cold'
  },
  {
    id: 'c-5',
    name: 'Espresso',
    category: 'coffee',
    price: '19K',
    description: 'Ekstraksi konsentrat kopi murni dengan crema tebal dan aroma kuat',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-6',
    name: 'Americano',
    category: 'coffee',
    price: '19K',
    description: 'Espresso segar dipadu air jernih untuk rasa kopi hitam bersih dan mantap',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-7',
    name: 'Cappuccino',
    category: 'coffee',
    price: '19K',
    description: 'Kombinasi klasik espresso, steamed milk, dan foam susu tebal nan halus',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-8',
    name: 'Cafe Latte',
    category: 'coffee',
    price: '19K',
    description: 'Espresso kaya rasa dengan kelembutan steamed milk melimpah',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-9',
    name: 'Caramel Cafe Latte',
    category: 'coffee',
    price: '22K',
    description: 'Cafe latte lembut bertabur rasa karamel manis yang seimbang',
    isBestSeller: true,
    image: '/images/Menu-Caramel Latte.png',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-10',
    name: 'Vanilla Cafe Latte',
    category: 'coffee',
    price: '22K',
    description: 'Cafe latte nikmat beraroma vanila harum dan creamy',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-11',
    name: 'Hazelnut Cafe Latte',
    category: 'coffee',
    price: '22K',
    description: 'Cafe latte harum dengan sirup kacang hazelnut yang lembut',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-12',
    name: 'Cafe Mocha',
    category: 'coffee',
    price: '24K',
    description: 'Perpaduan sempurna espresso pahit gurih dan cokelat manis creamy',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-13',
    name: 'Caramel Cafe Mocha',
    category: 'coffee',
    price: '25K',
    description: 'Pesan mocha kaya rasa dengan balutan sirup karamel istimewa',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-14',
    name: 'Caramel Macchiato',
    category: 'coffee',
    price: '24K',
    description: 'Layering vanila, susu, espresso, dan drizzle karamel di atasnya',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-15',
    name: 'Creme Brullee',
    category: 'coffee',
    price: '22K',
    description: 'Minuman kopi kreasi dengan sensasi gula karamel bakar khas dessert',
    isBestSeller: true,
    image: '/images/Menu-Creme BRULEE.png',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-16',
    name: 'Manual Brew - V60',
    category: 'coffee',
    price: '20K',
    description: 'Seduhan kopi saring manual pourover yang menonjolkan notes rasa khas beans',
    temperature: 'Hot / Cold'
  },
  {
    id: 'c-17',
    name: 'Japanese Coffee',
    category: 'coffee',
    price: '20K',
    description: 'Manual brew es kopi ala Jepang yang segar, clean, dan kaya keasaman alami',
    temperature: 'Cold'
  },
  {
    id: 'c-18',
    name: 'Japanese Lemonade',
    category: 'coffee',
    price: '24K',
    description: 'Sensasi unik manual brew dingin bertumpu pada perasan lemon segar',
    temperature: 'Cold',
    tags: ['Fresh']
  },
  {
    id: 'c-19',
    name: 'Japanese Irish',
    category: 'coffee',
    price: '24K',
    description: 'Perpaduan Japanese iced coffee dan sentuhan rasa Irish yang berkelas',
    temperature: 'Cold'
  },
  {
    id: 'c-20',
    name: 'Japanese Green Apple',
    category: 'coffee',
    price: '20K',
    description: 'Inovasi Japanese iced coffee dengan segarnya ekstrak apel hijau',
    temperature: 'Cold'
  },
  {
    id: 'c-21',
    name: 'Black Lemonade',
    category: 'coffee',
    price: '20K',
    description: 'Pilihan segar perpaduan espresso asam gurih dan perasan lemon dingin',
    temperature: 'Cold'
  },
  {
    id: 'c-22',
    name: 'Botolin - Es Kopi Susu Di-',
    category: 'coffee',
    price: '28K (250ml)',
    priceLiter: '78K (1 Liter)',
    description: 'Kopi susu signature kemasan botol siap minum (tersedia 250ml & 1 Liter)',
    isBestSeller: true,
    tags: ['Botolin', 'Kemasan Literan']
  },
  {
    id: 'c-23',
    name: 'Botolin - Es Kopi Susu Srikandi',
    category: 'coffee',
    price: '30K (250ml)',
    priceLiter: '80K (1 Liter)',
    description: 'Varian kopi susu spesial Srikandi kemasan botol praktis & hemat',
    tags: ['Botolin', 'Literan']
  },
  {
    id: 'c-24',
    name: 'Botolin - Es Kopi Susu Nala',
    category: 'coffee',
    price: '30K (250ml)',
    priceLiter: '80K (1 Liter)',
    description: 'Varian kopi susu Nala rich & smooth kemasan botol',
    tags: ['Botolin', 'Literan']
  },
  {
    id: 'c-25',
    name: 'Botolin - Es Kopi Susu Dawala',
    category: 'coffee',
    price: '25K (250ml)',
    priceLiter: '75K (1 Liter)',
    description: 'Varian kopi susu Dawala mantap kemasan botol',
    tags: ['Botolin', 'Literan']
  },

  // --- NON-COFFEE & TEA ---
  {
    id: 'nc-1',
    name: 'Thai Tea',
    category: 'non-coffee',
    price: '20K',
    description: 'Seduhan teh khas Thailand yang pekat bertumpu susu kental manis gurih',
    temperature: 'Hot / Cold'
  },
  {
    id: 'nc-2',
    name: 'Chocolate Latte',
    category: 'non-coffee',
    price: '20K / 22K',
    description: 'Minuman cokelat kaya rasa dengan perpaduan susu segar lembut',
    temperature: 'Hot / Cold'
  },
  {
    id: 'nc-3',
    name: 'Chocolate Float',
    category: 'non-coffee',
    price: '20K / 23K',
    description: 'Cokelat dingin nikmat dengan topping es krim lembut melimpah',
    isBestSeller: true,
    image: '/images/Menu-Chocolate Float.png',
    temperature: 'Cold'
  },
  {
    id: 'nc-4',
    name: 'Green Tea Latte',
    category: 'non-coffee',
    price: '20K',
    description: 'Matcha hijau harum beraroma otentik dipadu susu creamy',
    temperature: 'Hot / Cold'
  },
  {
    id: 'nc-5',
    name: 'Taro Latte',
    category: 'non-coffee',
    price: '19K',
    description: 'Minuman rasa talas ubi ungu yang manis, gurih, dan aromatik',
    temperature: 'Hot / Cold'
  },
  {
    id: 'nc-6',
    name: 'Lemonade',
    category: 'non-coffee',
    price: '20K',
    description: 'Kesegaran perasan buah lemon murni yang membangkitkan semangat',
    temperature: 'Cold'
  },
  {
    id: 'nc-7',
    name: 'Green Lemonade',
    category: 'non-coffee',
    price: '20K',
    description: 'Perpaduan unik sensasi segar buah apel/sirup hijau dan lemon dingin',
    temperature: 'Cold'
  },
  {
    id: 'nc-8',
    name: 'Sunset Lemonade',
    category: 'non-coffee',
    price: '20K',
    description: 'Mocktail lemonade bernuansa warna sunset segar bermandikan buah',
    temperature: 'Cold'
  },
  {
    id: 'nc-9',
    name: 'Soda Bahagia',
    category: 'non-coffee',
    price: '20K',
    description: 'Minuman soda nostalgia dipadu susu kental manis dan sirup yang memanjakan',
    temperature: 'Cold'
  },
  {
    id: 'nc-10',
    name: 'Summer Breeze',
    category: 'non-coffee',
    price: '20K',
    description: 'Minuman tropis dingin nan menyegarkan cocok di saat cuaca cerah',
    temperature: 'Cold'
  },

  // --- CEMILAN ASIN ---
  {
    id: 'ca-1',
    name: 'French Fries',
    category: 'cemilan-asin',
    price: '20K',
    description: 'Camilan kentang goreng renyah garing bertabur bumbu gurih',
    tags: ['Kentang', 'Klasik']
  },
  {
    id: 'ca-2',
    name: 'Buncis Pedas Ketus',
    category: 'cemilan-asin',
    price: '20K',
    description: 'Buncis goreng tepung bumbu lada garam ala Mage yang gurih dan pedas',
    isBestSeller: true,
    tags: ['Favorit', 'Pedas']
  },
  {
    id: 'ca-3',
    name: 'Fish & Chips',
    category: 'cemilan-asin',
    price: '30K',
    description: 'Ikan dori goreng tepung renyah disajikan dengan potato chips & saus tartar khas',
    tags: ['Dori', 'Chips']
  },
  {
    id: 'ca-4',
    name: 'Chick & Chips',
    category: 'cemilan-asin',
    price: '25K',
    description: 'Chicken popcorn renyah disajikan dengan potato chips dan sambal matah segar',
    isBestSeller: true,
    tags: ['Sambal Matah', 'Chicken']
  },
  {
    id: 'ca-5',
    name: 'Chicken Twister',
    category: 'cemilan-asin',
    price: '30K',
    description: 'Sejenis kebab wraps dengan isian potongan chicken katsu renyah & saus lezat',
    tags: ['Wrap', 'Katsu']
  },
  {
    id: 'ca-6',
    name: 'Mongolian Chicken Wraps',
    category: 'cemilan-asin',
    price: '30K',
    description: 'Sejenis kebab wraps dengan isian chicken katsu dan saus khas mongolian',
    tags: ['Mongolian', 'Wrap']
  },
  {
    id: 'ca-7',
    name: 'Cemilan SKEBON',
    category: 'cemilan-asin',
    price: '38K',
    description: 'Platter camilan lengkap: Sosis, Kentang, Buncis crispy, dan Onion Ring melimpah',
    isBestSeller: true,
    tags: ['Combo Platter', 'Sharing']
  },
  {
    id: 'ca-8',
    name: 'SKSD (Sosis Kentang Spesial Deh)',
    category: 'cemilan-asin',
    price: '27K',
    description: 'Camilan duet sosis dan kentang goreng renyah bumbu istimewa',
    tags: ['Sosis', 'Kentang']
  },

  // --- CEMILAN MANIS ---
  {
    id: 'cm-1',
    name: 'PISANG BUKAN SEMBARANG PISANG',
    category: 'cemilan-manis',
    price: '22K',
    description: 'Pisang goreng keju manis hangat dengan topping keju melimpah ala Mage',
    isBestSeller: true,
    tags: ['Pisang Keju', 'Manis']
  },
  {
    id: 'cm-2',
    name: 'SUGEMA (Susu Goreng Mage)',
    category: 'cemilan-manis',
    price: '22K',
    description: 'Susu nugget goreng crispy yang manis, lumer, dan lezat di dalam mulut',
    tags: ['Susu Goreng', 'Crispy']
  },

  // --- MAIN COURSE ---
  {
    id: 'mc-1',
    name: 'POLIGAMIE',
    category: 'main-course',
    price: '27K',
    description: 'Mie yamin asin lezat khas Mage dengan topping ayam gurih dan taburan daun bawang',
    isBestSeller: true,
    tags: ['Mie Yamin', 'Spesial']
  },
  {
    id: 'mc-2',
    name: 'MIE JULID (Juara di Lidah)',
    category: 'main-course',
    price: '27K',
    description: 'Mie saus chilli oil pedas berminyak ala Mage yang bikin ketagihan',
    isBestSeller: true,
    image: '/images/Menu-Mie Julid.png',
    tags: ['Chilli Oil', 'Pedas']
  },
  {
    id: 'mc-3',
    name: 'NASI GORENG KAMPUS',
    category: 'main-course',
    price: '27K',
    description: 'Nasi goreng harum berbumbu kearifan tanah Sunda disajikan lengkap dengan kerupuk',
    tags: ['Nasi Goreng']
  },
  {
    id: 'mc-4',
    name: 'Ayam Manis Manja',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn renyah yang dibalur saus asam manis asam gurih ala Mage',
    tags: ['Ayam Popcorn']
  },
  {
    id: 'mc-5',
    name: 'Katanya Nasi Goreng Ayam',
    category: 'main-course',
    price: '27K',
    description: 'Nasi goreng ayam racikan khas Mage yang gurih, mantap, dan mengenyangkan',
    tags: ['Nasi Goreng']
  },
  {
    id: 'mc-6',
    name: 'Katanya Mie Goreng Ayam',
    category: 'main-course',
    price: '27K',
    description: 'Mie goreng ayam tumis bumbu lezat dengan topping lengkap',
    tags: ['Mie Goreng']
  },
  {
    id: 'mc-7',
    name: 'Ayam Kungpao',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn juicy dengan saus kungpao manis gurih khas orientals',
    tags: ['Kungpao']
  },
  {
    id: 'mc-8',
    name: 'Ayam Hitam Pake Lada',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn crispy disiram saus lada hitam pekat yang berani dan hangat',
    tags: ['Black Pepper']
  },
  {
    id: 'mc-9',
    name: 'Ayam Saus Mentega',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn tumis saus mentega wangi kecap manis yang gurih meresap',
    tags: ['Saus Mentega']
  },
  {
    id: 'mc-10',
    name: 'Ayam Di Salted Egg-In',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn dibalur saus telor asin creamy, gurih, dan aromatik',
    tags: ['Salted Egg']
  },
  {
    id: 'mc-11',
    name: 'Ayam Pedes Ketus',
    category: 'main-course',
    price: '27K',
    description: 'Ayam popcorn renyah bertabur bumbu lada garam pedas gurih menantang',
    tags: ['Lada Garam', 'Pedas']
  },
  {
    id: 'mc-12',
    name: 'Ayam Katsu Saus Mongol',
    category: 'main-course',
    price: '27K',
    description: 'Ayam katsu tebal tumis dengan siraman saus khas mongolian istimewa',
    isBestSeller: true,
    image: '/images/Menu-Ayam Katsu.png',
    tags: ['Katsu', 'Mongolian']
  },
  {
    id: 'mc-13',
    name: 'Sapi Hitam Pake Lada',
    category: 'main-course',
    price: '30K',
    description: 'Potongan daging sapi empuk dengan siraman saus lada hitam wangi yang tajam',
    isBestSeller: true,
    tags: ['Daging Sapi', 'Black Pepper']
  },
  {
    id: 'mc-14',
    name: 'Beef Saus Mongol',
    category: 'main-course',
    price: '30K',
    description: 'Daging sapi tumis juicy dipadu saus khas mongolian gurih berminyak',
    isBestSeller: true,
    image: '/images/Menu-Beef Saus Mongol.png',
    tags: ['Daging Sapi']
  },
  {
    id: 'mc-15',
    name: 'Beef Stroganoff',
    category: 'main-course',
    price: '30K',
    description: 'Daging sapi empuk dipadu brown sauce creamy lembut dan fried onion garing',
    tags: ['Western', 'Beef']
  },
  {
    id: 'mc-16',
    name: 'Chicken Grill With Wedges',
    category: 'main-course',
    price: '35K',
    description: 'Chicken grill bumbu shawarma khas Mage dipadu potato wedges & mix vegetables segar',
    isBestSeller: true,
    tags: ['Grill', 'Premium']
  }
];
