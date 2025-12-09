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
  const [dithering, setDithering] = useState(false);
  const [ditherDepth, setDitherDepth] = useState(32);
  const [ditherIntensity, setDitherIntensity] = useState(1.0);
  const [ditherType, setDitherType] = useState("bayer");
  const [vertexWobble, setVertexWobble] = useState(false);
  const [vertexIntensity, setVertexIntensity] = useState(0.015);
  const [paletteSize, setPaletteSize] = useState(256);
  const [perspectiveArtifacts, setPerspectiveArtifacts] = useState(false);
  const [perspectiveIntensity, setPerspectiveIntensity] = useState(0.2);

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
                  setNoiseScale(0.005);
                  setPixelSize(10);
                  setDithering(false);
                  setDitherType("bayer");
                  setVertexWobble(false);
                  setVertexIntensity(0.015);
                  setPaletteSize(256);
                  setPerspectiveArtifacts(false);
                  setPerspectiveIntensity(0.2);
                  toast.success("Settings reset to default PSX preset");
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
            {/* Control Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-base mb-1">
                  Noise and Pixelation Settings
                </h2>
                <div className="flex flex-col md:flex-row gap-2">
                  {/* Noise Intensity */}
                  <div className="flex-1">
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
                        className="range range-accent w-full"
                      />
                      <div className="flex justify-between text-xs px-2 mt-1">
                        <span>None</span>
                        <span>Max</span>
                      </div>
                    </div>
                  </div>

                  {/* Pixelation Control */}
                  <div className="flex-1">
                    <div className="form-control">
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
                        className="range range-accent w-full"
                      />
                      <div className="flex justify-between text-xs px-2 mt-1">
                        <span>Max</span>
                        <span>Original</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RGB Shift Control Card */}
                </div>
              </div>
            </div>

            {/* Dithering Control Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="card-title text-base">Dithering</h2>
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dithering}
                      onChange={(e) => {
                        setDithering(e.target.checked);
                        if (e.target.checked) {
                          toast.success("Dithering enabled", {
                            duration: 1500,
                            icon: "🎨",
                          });
                        }
                      }}
                      className="toggle toggle-primary"
                    />
                    <span className="text-sm font-medium">
                      {dithering ? "ON" : "OFF"}
                    </span>
                  </label>
                </div>

                {dithering && (
                  <div className="space-y-4 mt-2">
                    {/* Dither Type Selector */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Dither Type</span>
                      </label>
                      <select
                        value={ditherType}
                        onChange={(e) => {
                          setDitherType(e.target.value);
                          toast(
                            `Dither type: ${
                              e.target.value === "psx"
                                ? "PSX Ordered"
                                : "Bayer Matrix"
                            }`
                          );
                        }}
                        className="select select-bordered select-sm w-full"
                        disabled={!dithering}
                      >
                        <option value="bayer">Bayer Matrix (Standard)</option>
                        <option value="psx">PSX Ordered (Authentic)</option>
                      </select>
                    </div>

                    {/* Color Depth Slider */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Color Depth</span>
                        <span className="badge badge-neutral">
                          {ditherDepth}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="64"
                        step="1"
                        value={ditherDepth}
                        onChange={(e) => {
                          setDitherDepth(parseInt(e.target.value));
                        }}
                        className="range range-secondary"
                        disabled={!dithering}
                      />
                      <div className="flex justify-between text-xs px-2 mt-1">
                        <span>1 color</span>
                        <span>64 colors</span>
                      </div>
                    </div>

                    {/* Intensity Slider */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Intensity</span>
                        <span className="badge badge-neutral">
                          {ditherIntensity.toFixed(2)}
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={ditherIntensity}
                        onChange={(e) => {
                          setDitherIntensity(parseFloat(e.target.value));
                        }}
                        className="range range-secondary"
                        disabled={!dithering}
                      />
                      <div className="flex justify-between text-xs px-2 mt-1">
                        <span>Subtle</span>
                        <span>Strong</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color Palette Control Card */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-base">Color Palette</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Colors (PSX: 256 max)</span>
                    <span className="badge badge-neutral">{paletteSize}</span>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="256"
                    step="1"
                    value={paletteSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setPaletteSize(value);
                      if (value < 256) {
                        toast(`Limited to ${value} colors`);
                      }
                    }}
                    className="range range-accent"
                  />
                  <div className="flex justify-between text-xs px-2 mt-1">
                    <span>2 colors</span>
                    <span>256 colors</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body p-4">
                <h2 className="card-title text-base">PSX Effects</h2>

                {/* Vertex Wobble */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Vertex Wobble</span>
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={vertexWobble}
                      onChange={(e) => {
                        setVertexWobble(e.target.checked);
                        if (e.target.checked) {
                          toast.success("Affine texture warping enabled");
                        }
                      }}
                      className="toggle toggle-sm toggle-primary"
                    />
                  </label>
                </div>

                  <input
                      }
                    }}
                  />

                {/* Perspective Artifacts */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Perspective Artifacts</span>
                  <label className="cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={perspectiveArtifacts}
                      onChange={(e) => {
                        setPerspectiveArtifacts(e.target.checked);
                        if (e.target.checked) {
                          toast.success("Perspective artifacts enabled");
                        }
                      }}
                      className="toggle toggle-sm toggle-primary"
                    />
                  </label>
                </div>
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
                        dithering={dithering}
                        ditherDepth={ditherDepth}
                        ditherIntensity={ditherIntensity}
                        ditherType={ditherType}
                        vertexWobble={vertexWobble}
                        vertexIntensity={vertexIntensity}
                        paletteSize={paletteSize}
                        perspectiveArtifacts={perspectiveArtifacts}
                        perspectiveIntensity={perspectiveIntensity}
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
