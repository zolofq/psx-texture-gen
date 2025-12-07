import React, { useState } from "react";
import CanvasImageEffects from "./components/CanvasImageEffects";
import { searchWikimediaImages, getFallbackImages } from "./utils/ImageSearch";
import { Toaster, toast } from "react-hot-toast";

const App = () => {
  const [noiseScale, setNoiseScale] = useState(0.0);
  const [pixelSize, setPixelSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  // Search for images
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsLoading(true);
    setUseFallback(false);

    const loadingToast = toast.loading(`Searching for "${searchQuery}"...`);

    try {
      const imageUrls = await searchWikimediaImages(searchQuery, 0);

      if (imageUrls.length > 0) {
        setImages(imageUrls);
        setSelectedImage(imageUrls[0]);
        toast.success(`Found ${imageUrls.length} images`, {
          id: loadingToast,
        });
      } else {
        // Use fallback images if no results found
        const fallbackImages = getFallbackImages(searchQuery);
        setImages(fallbackImages);
        setUseFallback(true);
        setSelectedImage(fallbackImages[0] || null);
        toast.warning("No images found. Showing demo images", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      // Use fallback on error
      const fallbackImages = getFallbackImages(searchQuery);
      setImages(fallbackImages);
      setUseFallback(true);
      setSelectedImage(fallbackImages[0] || null);
      toast.error("Search failed. Showing demo images", {
        id: loadingToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection from thumbnails
  const handleImageSelect = (img) => {
    setSelectedImage(img);
    toast.success("Image selected", {
      duration: 1500,
      position: "bottom-right",
    });
  };

  // Handle copy image URL
  const handleCopyImageUrl = () => {
    if (selectedImage) {
      navigator.clipboard.writeText(selectedImage);
      toast.success("Image URL copied to clipboard!", {
        position: "bottom-right",
      });
    }
  };

  return (
    <div className="min-h-screen bg-base-300 p-4">
      {/* Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />

      {/* Header */}
      <div className="container mx-auto max-w-7xl">
        <nav className="navbar backdrop-blur-md bg-base-100/90 sticky top-0 z-50 border-b border-base-300/20 min-h-0">
          <div className="container mx-auto px-4 flex justify-between items-center py-3">
            <div className="text-xl font-mono font-bold tracking-widest text-base-content uppercase">
              <span className="text-rose-700 drop-shadow-[0_0_2px_#fda4af]">
                PS<span className="text-cyan-800">X</span>
              </span>
              <span className="text-gray-800 dark:text-gray-300">gen</span>
              <span className="text-red-700">_</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setNoiseScale(0.0);
                  setPixelSize(10);
                  toast.success("Settings reset", {
                    duration: 1500,
                  });
                }}
                className="btn btn-sm btn-ghost"
              >
                Reset
              </button>
              <button
                onClick={handleCopyImageUrl}
                disabled={!selectedImage}
                className="btn btn-sm btn-outline"
              >
                Copy URL
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
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
                    min="0.000"
                    max="0.1"
                    step="0.001"
                    value={noiseScale}
                    onChange={(e) => {
                      setNoiseScale(parseFloat(e.target.value));
                      if (parseFloat(e.target.value) === 0) {
                        toast("Noise disabled", {
                          icon: "??",
                        });
                      }
                    }}
                    className="range range-accent"
                  />
                  <div className="flex justify-between text-xs px-2 mt-1">
                    <span>None</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>

              {/* Pixelation Control */}
              <div className="form-control p-4">
                <label className="label">
                  <span className="label-text">Pixelation</span>
                  <span className="badge badge-neutral">{pixelSize}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={pixelSize}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setPixelSize(value);
                    if (value === 1) {
                      toast("Pixelation disabled", {
                        icon: "🖼️",
                      });
                    }
                  }}
                  className="range range-accent"
                />
                <div className="flex justify-between text-xs px-2 mt-1">
                  <span>Max</span>
                  <span>Original</span>
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
                    className="input input-bordered w-full px-4"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery.trim()) {
                        toast.loading(`Searching for "${searchQuery}"...`);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    className="btn btn-primary w-full bg-base-100 hover:bg-base-300 mt-2"
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
                  {selectedImage && (
                    <button
                      onClick={() => {
                        toast.custom(
                          (t) => (
                            <div
                              className={`bg-base-200 p-4 rounded-lg shadow-lg border border-base-300 ${
                                t.visible ? "animate-enter" : "animate-leave"
                              }`}
                            >
                              <p className="font-semibold">
                                Current Image Info
                              </p>
                              <p className="text-xs mt-1 opacity-75 break-all">
                                {selectedImage.substring(0, 80)}...
                              </p>
                              <button
                                onClick={() => toast.dismiss(t.id)}
                                className="btn btn-xs btn-ghost mt-2"
                              >
                                Close
                              </button>
                            </div>
                          ),
                          {
                            duration: Infinity,
                          }
                        );
                      }}
                      className="btn btn-xs btn-ghost w-full mt-2"
                    >
                      Show Image URL
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-9 space-y-4">
            {/* Image Display */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <div className="flex justify-center items-center">
                  {selectedImage ? (
                    <div className="relative">
                      <CanvasImageEffects
                        src={selectedImage}
                        noiseScale={noiseScale}
                        pixelSize={pixelSize}
                        maxWidth={500}
                        maxHeight={500}
                      />
                    </div>
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
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="card-title text-lg">
                      Available Images ({images.length})
                    </h3>
                    <button
                      onClick={() => {
                        if (images.length > 0) {
                          setSelectedImage(images[0]);
                          toast("Reset to first image");
                        }
                      }}
                      className="btn btn-xs btn-ghost"
                    >
                      Reset Selection
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 max-h-36 overflow-y-auto">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-100 ${
                          selectedImage === img
                            ? "border-primary shadow-lg"
                            : "border-base-300 hover:border-primary"
                        }`}
                        onClick={() => handleImageSelect(img)}
                        title={`Image ${index + 1}`}
                      >
                        <img
                          src={img}
                          alt={`Result ${index + 1}`}
                          className="w-full h-32 object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target;
                            if (!target.src.includes("via.placeholder.com")) {
                              target.src = `https://via.placeholder.com/200x128/1f2937/9ca3af?text=${
                                index + 1
                              }`;
                              toast.error(`Failed to load image ${index + 1}`, {
                                duration: 2000,
                              });
                            }
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
