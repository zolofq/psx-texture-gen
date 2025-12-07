/**
 * Search for free images using Wikimedia Commons API
 * @param {string} query - The search query
 * @param {number} batch - The batch number for pagination
 * @returns {Promise<string[]>} - Array of image URLs
 */
export const searchWikimediaImages = async (query, batch = 0) => {
  if (!query) return [];

  try {
    // CORS proxy is required because Wikimedia API blocks direct browser requests
    const proxyUrl = "https://api.allorigins.win/get?url=";

    // Generate a random seed
    const randomSeed = Date.now() + Math.random();

    // Generate a random search query
    const searchVariations = [
      query,
      `filetype:image ${query}`,
      `"${query}"`,
      `${query} commons`,
    ];

    const randomSearch =
      searchVariations[Math.floor(Math.random() * searchVariations.length)];

    // Wikimedia API endpoint with query parameters:
    const apiUrl = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams(
      {
        action: "query", // Main API action - query for data
        format: "json", // Response format - JSON
        generator: "search", // Use search generator to find pages
        gsrnamespace: 6, // Namespace 6 = File namespace (images only)
        gsrsearch: randomSearch, // The actual search query from user
        gsrlimit: 50, // Maximum number of results per request
        gsroffset: Math.floor(Math.random() * 50), // Offset for pagination: batch 0 = 0, batch 1 = 20, etc.
        prop: "imageinfo", // Request image information property
        iiprop: "url", // Include image URLs in the response
        iiurlwidth: 400, // Preferred thumbnail width in pixels
      }
    ).toString()}`;

    const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));

    // Parse response as JSON
    const data = await response.json();

    // allorigins.win wraps the actual response in a "contents" field
    if (!data.contents) return [];

    const parsedData = JSON.parse(data.contents);

    // Check if the response has the expected structure
    if (!parsedData.query || !parsedData.query.pages) return [];

    // Object.values() converts the pages object to an array of page objects
    // Map over each page to extract the image URL
    return (
      Object.values(parsedData.query.pages)
        .map((page) => page.imageinfo?.[0]?.url)
        .filter(
          (url) =>
            url && // Remove null/undefined values
            (url.endsWith(".jpg") ||
              url.endsWith(".jpeg") ||
              url.endsWith(".png"))
        )
        // Limit results to 10 images for performance and UI constraints
        .slice(0, 10)
    );
  } catch (error) {
    console.error("Error fetching images from Wikimedia:", error);
    throw new Error("Failed to fetch images");
  }
};

/**
 * Get a random unused image from the array
 * @param {string[]} images - Array of image URLs
 * @param {Set<number>} usedIndexes - Set of already used indexes
 * @returns {string|null} - Random unused image URL or null if all used
 */
export const getRandomUnusedImage = (images, usedIndexes) => {
  if (images.length === 0) return null;

  // Reset used indexes if all images have been used
  if (usedIndexes.size >= images.length) {
    return null; // SIgnal to load more images
  }

  // Find available indexes
  const availableIndexes = [];
  for (let i = 0; i < images.length; i++) {
    if (!usedIndexes.has(i)) {
      availableIndexes.push(i);
    }
  }

  if (availableIndexes.length === 0) return null;

  // Pick random index from available ones
  const randomIndex =
    availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

  return {
    url: images[randomIndex],
    index: randomIndex,
  };
};

/**
 * Shuffle an array
 * @param {string[]} array - Array to shuffle
 */
const shuffleArray = (array) => {
  let currentIndex = array.length;

  while (currentIndex != 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

/**
 * Fallback image URLs in case Wikimedia fails or for demo
 */
export const getFallbackImages = (query) => {
  const fallbacks = {
    nature: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Shaqi_jrvej.jpg/800px-Shaqi_jrvej.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Machu_Picchu%2C_Peru.jpg/800px-Machu_Picchu%2C_Peru.jpg",
    ],
    cat: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/800px-Cat03.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Calico_tabby_cat_-_Savannah.jpg/800px-Calico_tabby_cat_-_Savannah.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juvenile_Ragdoll.jpg/800px-Juvenile_Ragdoll.jpg",
    ],
    city: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/New_york_times_square-terabass.jpg/800px-New_york_times_square-terabass.jpg",
    ],
    default: [
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Tabby_cat_with_blue_eyes-3336579.jpg/800px-Tabby_cat_with_blue_eyes-3336579.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Gull_portrait_ca_usa.jpg/800px-Gull_portrait_ca_usa.jpg",
    ],
  };

  const normalizedQuery = query.toLowerCase();
  if (fallbacks[normalizedQuery]) {
    return shuffleArray(fallbacks[normalizedQuery]);
  }
  return shuffleArray(fallbacks.default);
};
