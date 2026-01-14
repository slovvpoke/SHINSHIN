// Types for CS2 skins
export interface Skin {
  id: string;
  name: string;
  weapon: string;
  image: string;
  rarity?: string;
}

// Steam CDN base URL for skin images
const STEAM_CDN = 'https://steamcommunity-a.akamaihd.net/economy/image/';

// Preferred skins list for the game with known Steam icon paths
export const PREFERRED_SKINS = [
  { weapon: 'AWP', skin: 'Dragon Lore', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJK9cyzhr-KmsjwPKvBmm5u5cB1g_zMu4qm2gDj_RNqaj-gcYOVIANoMF6G_wfswuu808Pt6prAzHV9-n51gg5bSbk' },
  { weapon: 'M4A4', skin: 'Howl', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmX5d_MR6j_v--YXygED6_0VuZzr3ctWUdlI2aAqF_VK5wOq5h5Xv6prBn3dh6SI8pSGKUvIjNg' },
  { weapon: 'AK-47', skin: 'Fire Serpent', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjVe1-hRvY2n3doKVdgU9YlyE8li-x-buhMTvvZqfwXZqsyY8pSGKsECf0Q' },
  { weapon: 'M4A1-S', skin: 'Printstream', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO-jb-NmvLxDLbUkmJE5Yt3j7iQoN-l3wLj_RI-YT3zcI6XJgVoMF7S_lS3wL291JK1vMjNyXsw6Clz5XeIzkCy1R8ZbONxxavI-GGvkw' },
  { weapon: 'Desert Eagle', skin: 'Blaze', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PLZTjlH7du6kb-FlvD1DLfYkWNFpsAiiO-Sr9ih2gOx_EA5ammlIYaUIFM8NV_S-AC8w-a6gsLvvM7LnHU37nZ07CqLy0a20AYMMLKFp4kVHA' },
  { weapon: 'USP-S', skin: 'Kill Confirmed', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWhe5sN4mOTE8Ij2xgTgqhJvMW37IYGXdQ5rZArW_1C_wrzqjZPq7J_AnSQ37CA8pSGKLyiD9Ys' },
  { weapon: 'Glock-18', skin: 'Fade', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79eJnY6PnvD7DLbUkmJE5YtOhuDG_Jn4xley_kI4NWj6JI-QdlI6YVzY-QO6w-u9hce5vc-cm3swvyEg7XzYmxa0hx1IZLQ-2vmVHA' },
  { weapon: 'Butterfly Knife', skin: 'Fade', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqOT1I6vZn3lu5cB1g_zMu4rw0FHi80tpMW3wdYWdd1I7NVHU_APtyO7s0Je87Z3LnXo16HYrt37cnxa00RpJaeNqmqHA-VqGQF5I' },
  { weapon: 'MAC-10', skin: 'Neon Rider', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou7umeldf0Ob3fDxBvYyJhIGFmPLxDLbUhFRd4cJ5nqeQ9Nms0AaxrhBsMT-hJI-cdQBsZ1zS8we9w-_o08O-tMnNzCM16yMntyrfzR21gB8acLYx1-uelDJWKQ' },
  { weapon: 'P90', skin: 'Death by Kitty', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopuP1FABz7P_ZdjVK_ty1nYGHnvH4DLfYkWNFpsUi2LuU89-h2wft-UY_MmChLNDGIQQ4aA2E-FK-k-nvhMLvvciby3pk6yZz7GGdwUI8aaJIbg' },
  { weapon: 'AK-47', skin: 'Case Hardened', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV086jloKOhcj4OrzZgiUFvpAnj-vE9tr031K18hE-Njz1IYLBI1NoYFjU_la7x7y6hsTq78nAy3Ri6Cc8pSGKFgT0ZA' },
  { weapon: 'AK-47', skin: 'Vulcan', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09G3h5S0k_LmDLfYkWNFpsUh2LmQ9N7xjlXlrxBtamGhI4KVcAM5ZwqD8wDqxe7t0ZPqucifznN9-n51yJD93w' },
  { weapon: 'M4A4', skin: 'Neo-Noir', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uOxgrOygfbhNuiBl25u5Mx2gv2P8Yig3wbmqUtvYW6lJoKddg9sZwzU_FDqxru71MO5v5TOnCNquSIl7S2JykWpwUYbl7GsSw' },
  { weapon: 'AWP', skin: 'Gungnir', fallbackUrl: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7cqWdQ689piOnA9IP4gVbk_xJra2z0dtTBJFNtaAzT8ljox7u8jMO5vpTKnSZhuSEgtH7fyxCxiB9Na7c41_eaEBqJSA' },
];

let cachedSkins: Skin[] | null = null;

// Normalize skin name for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/stattrak™?\s*/gi, '')
    .replace(/souvenir\s*/gi, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove wear conditions like (Factory New)
    .replace(/[★]/g, '')
    .trim();
}

// Fuzzy match for weapon and skin
function fuzzyMatch(itemName: string, targetWeapon: string, targetSkin: string): boolean {
  const normalized = normalizeName(itemName);
  const weaponNorm = normalizeName(targetWeapon);
  const skinNorm = normalizeName(targetSkin);
  
  return normalized.includes(weaponNorm) && normalized.includes(skinNorm);
}

// Fetch skins from qwkdev/csapi dataset
export async function fetchSkins(): Promise<Skin[]> {
  if (cachedSkins) {
    return cachedSkins;
  }

  const urls = [
    'https://cdn.jsdelivr.net/gh/qwkdev/csapi@main/data2.json',
    'https://raw.githubusercontent.com/qwkdev/csapi/main/data2.json',
  ];

  let data: any[] = [];
  
  for (const url of urls) {
    try {
      console.log(`Fetching skins from ${url}...`);
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        // Handle both array and object responses
        if (Array.isArray(json)) {
          data = json;
        } else if (json && typeof json === 'object') {
          // If it's an object with skin data, convert to array
          data = Object.values(json);
        }
        console.log(`Successfully fetched ${data.length} items`);
        break;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
    }
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.error('Failed to fetch skins from all sources');
    // Return fallback skins with our known fallback URLs
    cachedSkins = PREFERRED_SKINS.map((pref, idx) => ({
      id: `fallback-${idx}`,
      name: `${pref.weapon} | ${pref.skin}`,
      weapon: pref.weapon,
      image: pref.fallbackUrl || `https://placehold.co/256x192/1a1a2e/f5a623?text=${encodeURIComponent(pref.weapon)}`,
      rarity: 'covert',
    }));
    return cachedSkins;
  }

  // Helper to get best image URL
  const getImageUrl = (item: any, pref: typeof PREFERRED_SKINS[0]): string => {
    // Try to get image from API data
    let img = item?.image || item?.icon_url || item?.icon_url_large || '';
    
    // If image URL is relative (Steam CDN path), make it absolute
    if (img && !img.startsWith('http')) {
      img = STEAM_CDN + img;
    }
    
    // If no image or empty, use our fallback
    if (!img || img === STEAM_CDN) {
      return pref.fallbackUrl || `https://placehold.co/256x192/1a1a2e/f5a623?text=${encodeURIComponent(pref.weapon)}`;
    }
    
    return img;
  };

  // Select 14 skins matching preferred list
  const selectedSkins: Skin[] = [];
  
  for (const pref of PREFERRED_SKINS) {
    const found = data.find((item: any) => {
      const itemName = item.name || item.market_hash_name || '';
      return fuzzyMatch(itemName, pref.weapon, pref.skin);
    });

    if (found) {
      selectedSkins.push({
        id: found.id || found.classid || `skin-${selectedSkins.length}`,
        name: found.name || found.market_hash_name || `${pref.weapon} | ${pref.skin}`,
        weapon: pref.weapon,
        image: getImageUrl(found, pref),
        rarity: found.rarity || 'covert',
      });
    } else {
      // Fallback: search more loosely
      const looseMatch = data.find((item: any) => {
        const itemName = normalizeName(item.name || item.market_hash_name || '');
        return itemName.includes(normalizeName(pref.skin));
      });

      if (looseMatch) {
        selectedSkins.push({
          id: looseMatch.id || looseMatch.classid || `skin-${selectedSkins.length}`,
          name: looseMatch.name || looseMatch.market_hash_name || `${pref.weapon} | ${pref.skin}`,
          weapon: pref.weapon,
          image: getImageUrl(looseMatch, pref),
          rarity: looseMatch.rarity || 'covert',
        });
      } else {
        // Use fallback URL from preferred skins
        selectedSkins.push({
          id: `fallback-${selectedSkins.length}`,
          name: `${pref.weapon} | ${pref.skin}`,
          weapon: pref.weapon,
          image: pref.fallbackUrl || `https://placehold.co/256x192/1a1a2e/f5a623?text=${encodeURIComponent(pref.weapon)}`,
          rarity: 'covert',
        });
      }
    }
  }

  // Ensure we have exactly 14 skins
  while (selectedSkins.length < 14) {
    const idx = selectedSkins.length;
    selectedSkins.push({
      id: `extra-${idx}`,
      name: `Skin ${idx + 1}`,
      weapon: 'Unknown',
      image: `https://placehold.co/256x192/1a1a2e/f5a623?text=Skin+${idx + 1}`,
      rarity: 'classified',
    });
  }

  cachedSkins = selectedSkins.slice(0, 14);
  console.log('Selected skins:', cachedSkins.map(s => s.name));
  return cachedSkins;
}

// Get cached skins (sync version)
export function getSkins(): Skin[] {
  return cachedSkins || [];
}

// Clear cached skins (force refresh)
export function clearSkinsCache(): void {
  cachedSkins = null;
  console.log('Skins cache cleared');
}

// Initialize skins cache
export async function initSkins(): Promise<void> {
  await fetchSkins();
}
