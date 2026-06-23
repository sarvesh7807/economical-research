// Premium Article Image System
// Provides highly relevant, unique, and dark-themed premium Unsplash images based on entity, topic, and category detection.

const imagePools = {
  // Entities: Companies / Brands
  apple: [
    'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1610465299996-30f240a2b1ca?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551645121-d1034da75057?w=800&auto=format&fit=crop'
  ],
  google: [
    'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601153211154-7e53f277a04b?w=800&auto=format&fit=crop'
  ],
  microsoft: [
    'https://images.unsplash.com/photo-1625014618427-fbc980b974f5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596495578065-6e0763fa1141?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=800&auto=format&fit=crop'
  ],
  amazon: [
    'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop'
  ],
  tesla_spacex: [
    'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=800&auto=format&fit=crop'
  ],
  meta: [
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1635352737672-0f0ffeb334a1?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622760851720-f4ae3775f411?w=800&auto=format&fit=crop'
  ],
  nvidia: [
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop'
  ],
  openai: [
    'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1684369175833-3d0258165b4c?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1680814920251-5efad91a0c49?w=800&auto=format&fit=crop'
  ],

  // Entities: Countries / Geographies
  ukraine: [
    'https://images.unsplash.com/photo-1617112028681-3bdc09192461?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563212879-1b5e3f4e24ef?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1645710609312-d8df9813b1ca?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1647413662495-263a4073d843?w=800&auto=format&fit=crop'
  ],
  russia: [
    'https://images.unsplash.com/photo-1513326796621-39af78025850?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1520156557489-3176de1172a3?w=800&auto=format&fit=crop'
  ],
  india: [
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1477587458883-471a5ed94245?w=800&auto=format&fit=crop'
  ],
  china: [
    'https://images.unsplash.com/photo-1508558936510-0af1e3cccbab?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543097692-fa13c6cd8595?w=800&auto=format&fit=crop'
  ],
  japan: [
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop'
  ],
  france: [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509840144299-db90d850251b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&auto=format&fit=crop'
  ],
  germany: [
    'https://images.unsplash.com/photo-1599946347371-68eb71b16afc?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800&auto=format&fit=crop'
  ],
  middle_east: [
    'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601275225243-b0f04ec6090d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1545642451-b0dbd6323bc0?w=800&auto=format&fit=crop'
  ],
  usa: [
    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1557456170-0cf4f4d0d362?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&auto=format&fit=crop'
  ],
  uk: [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505761671935-60b3a7424bab?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=800&auto=format&fit=crop'
  ],

  // Specific Topics
  crypto: [
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622790698141-94e30457ef12?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1609554496796-c345a5335ceb?w=800&auto=format&fit=crop'
  ],
  gold: [
    'https://images.unsplash.com/photo-1610375461246-83df859b8222?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1618042164219-62c820f10723?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1610375229632-c7158c35a537?w=800&auto=format&fit=crop'
  ],
  conflict_war: [
    'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584902824245-21d283086088?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1604542031651-5337d8914e58?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590079019458-0eb5b40a3371?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579567761406-468a78d1a594?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop'
  ],
  cricket: [
    'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1608905978123-558c415998e8?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593341604078-0998467d0c71?w=800&auto=format&fit=crop'
  ],
  football_messi: [
    'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614632537190-23e414d7a3d3?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&auto=format&fit=crop'
  ],
  football_ronaldo: [
    'https://images.unsplash.com/photo-1626248801379-71a58de086f0?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549741871-344521c4b0f9?w=800&auto=format&fit=crop'
  ],
  football_neymar: [
    'https://images.unsplash.com/photo-1568194157720-8ece7b1fc030?w=800&auto=format&fit=crop'
  ],
  football_mbappe: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop'
  ],
  football_fifa: [
    'https://images.unsplash.com/photo-1568194157720-8ece7b1fc030?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&auto=format&fit=crop'
  ],
  football_general: [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1431324155629-1a6edd1d1315?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556056504-517173f4aa07?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1510566337590-2fc1f21d0faa?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516208422321-ece161e6466a?w=800&auto=format&fit=crop'
  ],
  football_popular: [
    'https://images.unsplash.com/photo-1627916607164-7b20241db935?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1626248801379-71a58de086f0?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&auto=format&fit=crop'
  ],
  combat_sports: [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop'
  ],
  environment: [
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616262373426-18bfa2e2df5d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1533577116850-9ac66abc8f98?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500627869374-13cd993b1115?w=800&auto=format&fit=crop'
  ],
  crime_law: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593115057322-e94b77572f20?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1628853316086-fb7c6d66e74b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&auto=format&fit=crop'
  ],

  // Categories fallback (if no entities or specific topics detected)
  politics: [
    'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555848962-6e79363ec18f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560523160-754a9e22c6c4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop'
  ],
  business_finance: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop'
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd79a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'
  ],
  sports: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505250469613-27bac2f400ee?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519766304817-4f37bda74a27?w=800&auto=format&fit=crop'
  ],
  science: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop'
  ],
  health: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584515901407-c85714f1a6c6?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511174511575-275d06d840ae?w=800&auto=format&fit=crop'
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop'
  ],

  // Generic News Fallbacks
  default: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495465798138-718f86d1a4bd?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588681664899-f142ff2bac99?w=800&auto=format&fit=crop'
  ]
};

// List of known generic/placeholder image URL parts to bypass them and use smart images
const genericPlaceholderSignatures = [
  'photo-1529245005476-ebdf853c8485',
  'photo-1529156069898-49953e39b3ac',
  'photo-1504711434969-e33886168f5c',
  'photo-1488590528505-98d2b5aba04b',
  'photo-1532375811409-90d165c859d0',
  'photo-1518770660439-4636190af475',
  'photo-1508098682722-e99c43a406b2'
];

export const isGenericPlaceholder = (url) => {
  if (!url) return true;
  return genericPlaceholderSignatures.some(sig => url.includes(sig));
};

export const generateAiImage = (title = '', description = '') => {
  const cleanTitle = title.replace(/[^\w\s\-,.!?]/g, '').trim();
  const cleanDesc = (description || '').replace(/[^\w\s\-,.!?]/g, '').trim().substring(0, 120);
  const promptText = `${cleanTitle}. ${cleanDesc}`.trim();
  const fullPrompt = `${promptText}, professional editorial illustration, dark premium style, navy blue and gold accents, highly detailed, realistic, 8k resolution, cinematic lighting`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=800&height=450&nologo=true&private=true`;
};

export const getPremiumArticleImage = (article) => {
  const { title = '', description = '', content = '', category = '', url = '', urlToImage } = article;

  // Use the original image if it exists and is NOT a generic placeholder
  if (urlToImage && !isGenericPlaceholder(urlToImage)) {
    return urlToImage;
  }

  // Otherwise, run keyword, entity, subject, and category detection to assign a dynamic image
  const text = `${title} ${description} ${content}`.toLowerCase();

  // Helper for unique deterministic image selection from a pool
  const selectUniqueFromPool = (pool, articleUrl, articleTitle) => {
    if (!pool || pool.length === 0) return imagePools.default[0];
    
    // Initialize global registry if not present
    if (!window.__imageAssignments) {
      window.__imageAssignments = new Map(); // Map of articleUrl -> imageUrl
      window.__assignedImageUrls = new Set(); // Set of assigned imageUrls
    }

    if (window.__imageAssignments.has(articleUrl)) {
      return window.__imageAssignments.get(articleUrl);
    }

    // Hash algorithm for deterministic distribution
    let hash = 0;
    const str = articleTitle || articleUrl || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const startIndex = Math.abs(hash) % pool.length;

    // Find first unassigned image URL in the pool
    for (let i = 0; i < pool.length; i++) {
      const index = (startIndex + i) % pool.length;
      const imgUrl = pool[index];
      if (!window.__assignedImageUrls.has(imgUrl)) {
        window.__imageAssignments.set(articleUrl, imgUrl);
        window.__assignedImageUrls.add(imgUrl);
        return imgUrl;
      }
    }

    // Fallback if all are assigned
    const fallbackUrl = pool[startIndex];
    window.__imageAssignments.set(articleUrl, fallbackUrl);
    return fallbackUrl;
  };

  // --- 1. ENTITY DETECTION (Hierarchy: Entity-specific image) ---
  // Companies
  if (text.includes('apple') || text.includes('iphone') || text.includes('ipad') || text.includes('macbook')) {
    return selectUniqueFromPool(imagePools.apple, url, title);
  }
  if (text.includes('google') || text.includes('alphabet') || text.includes('android')) {
    return selectUniqueFromPool(imagePools.google, url, title);
  }
  if (text.includes('microsoft') || text.includes('windows') || text.includes('azure') || text.includes('xbox')) {
    return selectUniqueFromPool(imagePools.microsoft, url, title);
  }
  if (text.includes('amazon') || text.includes('aws') || text.includes('bezos')) {
    return selectUniqueFromPool(imagePools.amazon, url, title);
  }
  if (text.includes('tesla') || text.includes('spacex') || text.includes('musk') || text.includes('starlink')) {
    return selectUniqueFromPool(imagePools.tesla_spacex, url, title);
  }
  if (text.includes('meta') || text.includes('facebook') || text.includes('instagram') || text.includes('zuckerberg') || text.includes('whatsapp')) {
    return selectUniqueFromPool(imagePools.meta, url, title);
  }
  if (text.includes('nvidia') || text.includes('gpu') || text.includes('geforce')) {
    return selectUniqueFromPool(imagePools.nvidia, url, title);
  }
  if (text.includes('openai') || text.includes('chatgpt') || text.includes('sam altman')) {
    return selectUniqueFromPool(imagePools.openai, url, title);
  }

  // Geographies / Countries
  if (text.includes('ukraine') || text.includes('zelenskyy') || text.includes('kyiv') || text.includes('kiev')) {
    return selectUniqueFromPool(imagePools.ukraine, url, title);
  }
  if (text.includes('russia') || text.includes('putin') || text.includes('moscow') || text.includes('kremlin')) {
    return selectUniqueFromPool(imagePools.russia, url, title);
  }
  if (text.includes('india') || text.includes('modi') || text.includes('delhi') || text.includes('mumbai') || text.includes('rupee')) {
    return selectUniqueFromPool(imagePools.india, url, title);
  }
  if (text.includes('china') || text.includes('beijing') || text.includes('shanghai') || text.includes('xi jinping')) {
    return selectUniqueFromPool(imagePools.china, url, title);
  }
  if (text.includes('japan') || text.includes('tokyo') || text.includes('yen')) {
    return selectUniqueFromPool(imagePools.japan, url, title);
  }
  if (text.includes('france') || text.includes('paris') || text.includes('french') || text.includes('macron')) {
    return selectUniqueFromPool(imagePools.france, url, title);
  }
  if (text.includes('germany') || text.includes('berlin') || text.includes('german') || text.includes('scholz')) {
    return selectUniqueFromPool(imagePools.germany, url, title);
  }
  if (text.includes('israel') || text.includes('gaza') || text.includes('tel aviv') || text.includes('netanyahu') || text.includes('palestine') || text.includes('hamas')) {
    return selectUniqueFromPool(imagePools.middle_east, url, title);
  }
  if (text.includes('usa') || text.includes('united states') || text.includes('america') || text.includes('washington') || text.includes('white house') || text.includes('biden') || text.includes('trump')) {
    return selectUniqueFromPool(imagePools.usa, url, title);
  }
  if (text.includes('uk ') || text.includes('united kingdom') || text.includes('britain') || text.includes('british') || text.includes('london') || text.includes('parliament') || text.includes('downing street')) {
    return selectUniqueFromPool(imagePools.uk, url, title);
  }

  // --- 2. TOPIC DETECTION (Hierarchy: Topic image) ---
  if (text.includes('bitcoin') || text.includes('crypto') || text.includes('ethereum') || text.includes('blockchain') || text.includes('solana') || text.includes('coinbase')) {
    return selectUniqueFromPool(imagePools.crypto, url, title);
  }
  if (text.includes('gold ') || text.includes('gold spot') || text.includes('bullion')) {
    return selectUniqueFromPool(imagePools.gold, url, title);
  }
  if (text.includes('war ') || text.includes('missile') || text.includes('strike') || text.includes('military') || text.includes('conflict') || text.includes('bombing') || text.includes('shelling') || text.includes('soldier') || text.includes('army') || text.includes('nato')) {
    return selectUniqueFromPool(imagePools.conflict_war, url, title);
  }
  if (text.includes('cricket') || text.includes('kohli') || text.includes('dhoni') || text.includes('ipl ') || text.includes('t20') || text.includes('test match')) {
    return selectUniqueFromPool(imagePools.cricket, url, title);
  }
  if (text.includes('football') || text.includes('soccer') || text.includes('fifa') || text.includes('uefa') || text.includes('champions league') || text.includes('premier league') || text.includes('la liga') || text.includes('messi') || text.includes('ronaldo') || text.includes('neymar') || text.includes('mbappe') || text.includes('cr7')) {
    const mentionsRonaldo = text.includes('ronaldo') || text.includes('cr7') || text.includes('cristiano');
    const mentionsMessi = text.includes('messi') || text.includes('lionel');
    const mentionsNeymar = text.includes('neymar');
    const mentionsMbappe = text.includes('mbappe') || text.includes('kylian');
    
    // Check if other players, coaches, clubs, or specific match events are mentioned
    const mentionsDifferentPlayerOrTeam = 
      text.includes('haaland') || text.includes('bellingham') || text.includes('vinicius') || text.includes('kane') || 
      text.includes('saka') || text.includes('salah') || text.includes('guardiola') || text.includes('klopp') || 
      text.includes('ten hag') || text.includes('arteta') || text.includes('liverpool') || text.includes('arsenal') || 
      text.includes('manchester united') || text.includes('man united') || text.includes('man city') || text.includes('chelsea') || 
      text.includes('tottenham') || text.includes('bayern') || text.includes('dortmund') || text.includes('juventus') || 
      text.includes('inter milan') || text.includes('ac milan') || text.includes('barcelona') || text.includes('real madrid') ||
      text.includes('psg') || text.includes('transfer') || text.includes('clash') || text.includes('defeat') || text.includes('victory') ||
      text.includes('draw') || text.includes('cup') || text.includes('fixture') || text.includes('league');

    // Rule: Never show Ronaldo, Messi, Neymar, or Mbappé images when the article is about a different player, team, coach, or football event
    if (mentionsDifferentPlayerOrTeam) {
      return selectUniqueFromPool(imagePools.football_general, url, title);
    }

    if (mentionsRonaldo) {
      return selectUniqueFromPool(imagePools.football_ronaldo, url, title);
    }
    if (mentionsMessi) {
      return selectUniqueFromPool(imagePools.football_messi, url, title);
    }
    if (mentionsNeymar) {
      return selectUniqueFromPool(imagePools.football_neymar, url, title);
    }
    if (mentionsMbappe) {
      return selectUniqueFromPool(imagePools.football_mbappe, url, title);
    }
    if (text.includes('fifa') || text.includes('world cup')) {
      return selectUniqueFromPool(imagePools.football_fifa, url, title);
    }

    // Fallback: general football news with no specific players/teams mentioned
    return selectUniqueFromPool(imagePools.football_popular, url, title);
  }
  if (text.includes('mma') || text.includes('ufc') || text.includes('boxing') || text.includes('fight') || text.includes('knockout') || text.includes('championship')) {
    return selectUniqueFromPool(imagePools.combat_sports, url, title);
  }
  if (text.includes('climate') || text.includes('environment') || text.includes('carbon') || text.includes('forest') || text.includes('pollution') || text.includes('warming') || text.includes('heatwave') || text.includes('flood') || text.includes('drought') || text.includes('nature') || text.includes('conservation') || text.includes('ecology')) {
    return selectUniqueFromPool(imagePools.environment, url, title);
  }
  if (text.includes('court') || text.includes('judge') || text.includes('police') || text.includes('murder') || text.includes('crime') || text.includes('arrest') || text.includes('lawsuit') || text.includes('verdict') || text.includes('prosecutor') || text.includes('illegal') || text.includes('suspect')) {
    return selectUniqueFromPool(imagePools.crime_law, url, title);
  }

  // --- 3. CATEGORY DETECTION (Hierarchy: Category image) ---
  const cat = (category || 'world').toLowerCase();
  
  if (cat === 'politics' || text.includes('election') || text.includes('senate') || text.includes('congress') || text.includes('government') || text.includes('minister') || text.includes('governor') || text.includes('parliament')) {
    return selectUniqueFromPool(imagePools.politics, url, title);
  }
  
  if (cat === 'business' || cat === 'finance' || text.includes('stock market') || text.includes('shares') || text.includes('revenue') || text.includes('earnings') || text.includes('inflation') || text.includes('economy') || text.includes('finance') || text.includes('currency') || text.includes('gdp') || text.includes('fiscal') || text.includes('interest rate') || text.includes('bank') || text.includes('commerce') || text.includes('trading')) {
    return selectUniqueFromPool(imagePools.business_finance, url, title);
  }
  
  if (cat === 'technology' || cat === 'tech' || text.includes('software') || text.includes('hardware') || text.includes('silicon') || text.includes('cyber') || text.includes('robotic') || text.includes('gadget') || text.includes('telecom') || text.includes('computer')) {
    return selectUniqueFromPool(imagePools.technology, url, title);
  }
  
  if (cat === 'sports' || text.includes('tournament') || text.includes('match') || text.includes('stadium') || text.includes('player') || text.includes('athlete') || text.includes('olympics')) {
    return selectUniqueFromPool(imagePools.sports, url, title);
  }
  
  if (cat === 'science' || text.includes('space') || text.includes('mars') || text.includes('nasa') || text.includes('telescope') || text.includes('quantum') || text.includes('physic') || text.includes('chemistry') || text.includes('gene') || text.includes('dna') || text.includes('galaxy') || text.includes('astronomy')) {
    return selectUniqueFromPool(imagePools.science, url, title);
  }
  
  if (cat === 'health' || text.includes('hospital') || text.includes('doctor') || text.includes('medical') || text.includes('disease') || text.includes('vaccine') || text.includes('cancer') || text.includes('therapy') || text.includes('patient') || text.includes('clinical') || text.includes('pandemic')) {
    return selectUniqueFromPool(imagePools.health, url, title);
  }
  
  if (cat === 'entertainment' || text.includes('movie') || text.includes('celebrity') || text.includes('hollywood') || text.includes('bollywood') || text.includes('actor') || text.includes('actress') || text.includes('festival') || text.includes('cinema') || text.includes('album') || text.includes('music') || text.includes('concert')) {
    return selectUniqueFromPool(imagePools.entertainment, url, title);
  }

  // --- 4. DEFAULT NEWS IMAGE (Hierarchy: Generic news image -> AI generated image) ---
  // If no relevant image matches the category/entity/topic, generate a unique AI image based on headline and description
  return generateAiImage(title, description);
};
