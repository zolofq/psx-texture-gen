import React, { useState } from "react";
import CanvasImageEffects from "./components/CanvasImageEffects";
import { searchWikimediaImages, getFallbackImages } from "./utils/ImageSearch";

const App = () => {
  const [noiseScale, setNoiseScale] = useState(0.01);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  // Search for images
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setUseFallback(false);

    try {
      const imageUrls = await searchWikimediaImages(searchQuery, 0);

      if (imageUrls.length > 0) {
        setImages(imageUrls);
        setSelectedImage(imageUrls[0]);
      } else {
        // Use fallback images if no results found
        const fallbackImages = getFallbackImages(searchQuery);
        setImages(fallbackImages);
        setUseFallback(true);
        setSelectedImage(fallbackImages[0] || null);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Use fallback on error
      const fallbackImages = getFallbackImages(searchQuery);
      setImages(fallbackImages);
      setUseFallback(true);
      setSelectedImage(fallbackImages[0] || null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection from thumbnails
  const handleImageSelect = (img) => {
    setSelectedImage(img);
  };

  return (
    <div className="min-h-screen bg-base-300 p-4">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          Noise Texture Generator
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-3 space-y-4">
            {/* Noise Control Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Noise Settings</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Intensity</span>
                    <span className="badge badge-neutral">
                      {noiseScale.toFixed(3)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={noiseScale}
                    onChange={(e) => setNoiseScale(parseFloat(e.target.value))}
                    className="range range-primary"
                  />
                </div>
              </div>
            </div>

            {/* Search Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-lg">Image Search</h2>
                <form onSubmit={handleSearch} className="form-control gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search images..."
                    className="input input-bordered w-full"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="btn btn-primary w-full"
                  >
                    {isLoading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Search"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Info Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <div className="text-sm opacity-70 space-y-1">
                  <p>Wikimedia Commons</p>
                  {useFallback && (
                    <div className="alert alert-warning py-2 px-3">
                      <span className="text-xs">Using demo images</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-4">
            {/* Image Display */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <div className="flex justify-center items-center">
                  {selectedImage ? (
                    <CanvasImage
                      src={selectedImage}
                      noiseScale={noiseScale}
                      maxWidth={800}
                      maxHeight={500}
                    />
                  ) : (
                    <div className="w-full h-96 bg-base-300 rounded-lg flex items-center justify-center">
                      <p className="text-base-content opacity-50 text-center">
                        Search for an image to begin
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Thumbnails */}
            {images.length > 0 && (
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body p-4">
                  <h3 className="card-title text-lg mb-3">
                    Available Images ({images.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          selectedImage === img
                            ? "border-primary shadow-lg"
                            : "border-base-300 hover:border-primary"
                        }`}
                        onClick={() => handleImageSelect(img)}
                      >
                        <img
                          src={img}
                          alt={`Result ${index + 1}`}
                          className="w-full h-32 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/200x128/1f2937/9ca3af?text=${
                              index + 1
                            }`;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
