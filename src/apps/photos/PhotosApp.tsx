import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  ExternalLink,
  Search,
  ArrowLeft,
  Maximize2,
  Play,
  Film,
  FolderOpen,
} from 'lucide-react';
import { platformAdapter } from '../../platform/nativeAdapter';
import type { PhotoItem } from '../../platform/interface';

interface PhotosAppProps {
  windowId: string;
}

type MainTab = 'photos' | 'videos' | 'albums';

export const PhotosApp: React.FC<PhotosAppProps> = () => {
  const [mediaItems, setMediaItems] = useState<PhotoItem[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [highResPreviews, setHighResPreviews] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<PhotoItem | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<MainTab>('photos');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Windows-style Viewer Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filmstrip carousel ref for auto-scrolling
  const filmstripRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Fetch photos & videos from device
  const loadMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformAdapter.getDevicePhotos(200, 0);
      if (res.ok) {
        setMediaItems(res.value);

        // Preload thumbnails for first 35 items
        for (const item of res.value.slice(0, 35)) {
          platformAdapter.getPhotoThumbnail(item.id, item.path, 320).then((thumbRes) => {
            if (thumbRes.ok) {
              setThumbnails((prev) => ({ ...prev, [item.id]: thumbRes.value }));
            }
          });
        }
      }
    } catch {
      // Gracefully handled
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Request high-res preview when an item is selected
  const handleSelectItem = useCallback(
    async (item: PhotoItem) => {
      setSelectedItem(item);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);

      // Load thumbnail if missing
      if (!thumbnails[item.id]) {
        platformAdapter.getPhotoThumbnail(item.id, item.path, 320).then((thumbRes) => {
          if (thumbRes.ok) {
            setThumbnails((prev) => ({ ...prev, [item.id]: thumbRes.value }));
          }
        });
      }

      // Load high-resolution preview if image
      if (item.mediaType !== 'video' && !highResPreviews[item.id]) {
        const previewRes = await platformAdapter.getPhotoThumbnail(item.id, item.path, 1440);
        if (previewRes.ok) {
          setHighResPreviews((prev) => ({ ...prev, [item.id]: previewRes.value }));
        }
      }
    },
    [thumbnails, highResPreviews]
  );

  // Filter items by main tab (Photos / Videos / Albums)
  const tabFilteredItems = useMemo(() => {
    if (activeTab === 'videos') {
      return mediaItems.filter((m) => m.mediaType === 'video');
    }
    if (activeTab === 'photos') {
      return mediaItems.filter((m) => m.mediaType !== 'video');
    }
    // 'albums' mode shows all media grouped or filtered by album
    return mediaItems;
  }, [mediaItems, activeTab]);

  // Detected Albums based on file path
  const detectedAlbums = useMemo(() => {
    const map = new Map<string, PhotoItem[]>();
    for (const item of mediaItems) {
      const path = (item.path || '').toLowerCase();
      let albumName = 'Other';
      if (path.includes('/camera/')) albumName = 'Camera';
      else if (path.includes('/screenshots/')) albumName = 'Screenshots';
      else if (path.includes('/whatsapp/')) albumName = 'WhatsApp';
      else if (path.includes('/pictures/')) albumName = 'Pictures';
      else if (path.includes('/movies/')) albumName = 'Movies';
      else if (path.includes('/download/')) albumName = 'Downloads';

      if (!map.has(albumName)) {
        map.set(albumName, []);
      }
      map.get(albumName)!.push(item);
    }
    return map;
  }, [mediaItems]);

  // Final filtered list based on tab, album selection, and search query
  const displayedItems = useMemo(() => {
    return tabFilteredItems.filter((item) => {
      // Album filter
      if (selectedAlbum !== 'all') {
        const path = (item.path || '').toLowerCase();
        if (selectedAlbum === 'Camera' && !path.includes('/camera/')) return false;
        if (selectedAlbum === 'Screenshots' && !path.includes('/screenshots/')) return false;
        if (selectedAlbum === 'WhatsApp' && !path.includes('/whatsapp/')) return false;
        if (selectedAlbum === 'Pictures' && !path.includes('/pictures/')) return false;
        if (selectedAlbum === 'Movies' && !path.includes('/movies/')) return false;
        if (selectedAlbum === 'Downloads' && !path.includes('/download/')) return false;
        if (selectedAlbum === 'Other' && (path.includes('/camera/') || path.includes('/screenshots/') || path.includes('/whatsapp/') || path.includes('/pictures/') || path.includes('/movies/') || path.includes('/download/'))) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return item.displayName.toLowerCase().includes(query) || (item.path || '').toLowerCase().includes(query);
      }
      return true;
    });
  }, [tabFilteredItems, selectedAlbum, searchQuery]);

  // Next / Prev item navigation
  const currentIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return displayedItems.findIndex((m) => m.id === selectedItem.id);
  }, [selectedItem, displayedItems]);

  const handleNextItem = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < displayedItems.length - 1) {
      handleSelectItem(displayedItems[currentIndex + 1]);
    }
  }, [currentIndex, displayedItems, handleSelectItem]);

  const handlePrevItem = useCallback(() => {
    if (currentIndex > 0) {
      handleSelectItem(displayedItems[currentIndex - 1]);
    }
  }, [currentIndex, displayedItems, handleSelectItem]);

  // Scroll current thumbnail into view in filmstrip
  useEffect(() => {
    if (selectedItem && filmstripRef.current) {
      const activeEl = filmstripRef.current.querySelector(`[data-thumb-id="${selectedItem.id}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedItem]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextItem();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevItem();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedItem(null);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(6, z + 0.25));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.4, z - 0.25));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, handleNextItem, handlePrevItem]);

  // Mouse Wheel Zoom handling (Windows Photos style)
  const handleWheel = (e: React.WheelEvent) => {
    if (!selectedItem) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setZoom((prev) => Math.min(6, Number((prev * 1.15).toFixed(2))));
    } else {
      // Zoom out
      setZoom((prev) => {
        const next = Math.max(0.5, Number((prev * 0.85).toFixed(2)));
        if (next <= 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Drag to Pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double click to toggle zoom (Fit vs 2.5x)
  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.5);
    }
  };

  // Delete media item
  const handleDeleteSelected = async () => {
    if (!selectedItem) return;
    if (!window.confirm(`Delete "${selectedItem.displayName}"?`)) return;

    setIsDeleting(true);
    try {
      if (selectedItem.path) {
        await platformAdapter.deleteItem(selectedItem.path);
      }
      setMediaItems((prev) => prev.filter((m) => m.id !== selectedItem.id));
      setSelectedItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Launch external system viewer
  const handleLaunchExternal = async () => {
    await platformAdapter.launchApp('com.google.android.apps.photos');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // =========================================================================
  // VIEW MODE: IMMERSIVE WINDOWS PHOTOS VIEWER (When an item is clicked)
  // =========================================================================
  if (selectedItem) {
    const isVideo = selectedItem.mediaType === 'video';
    const displaySrc = highResPreviews[selectedItem.id] || thumbnails[selectedItem.id];

    return (
      <div
        ref={viewerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: '#020204',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
        }}
        onWheel={!isVideo ? handleWheel : undefined}
      >
        {/* Top Minimalist Control Bar (Windows Photos Style) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'rgba(10, 10, 14, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 40,
          }}
        >
          {/* Back to Gallery & Item Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button
              onClick={() => setSelectedItem(null)}
              title="Back to Gallery (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} />
              <span>Gallery</span>
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 320,
                }}
              >
                {selectedItem.displayName}
              </div>
              <div style={{ fontSize: 10, color: '#888' }}>
                {currentIndex + 1} of {displayedItems.length} &bull; {formatFileSize(selectedItem.size)}
              </div>
            </div>
          </div>

          {/* Windows-style Zoom & Viewer Controls */}
          {!isVideo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                padding: '3px 6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.25).toFixed(2))))}
                title="Zoom Out (-)"
                style={{
                  padding: 5,
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                <ZoomOut size={14} />
              </button>

              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Reset Zoom to 100% (0)"
                style={{
                  padding: '3px 8px',
                  background: 'transparent',
                  border: 'none',
                  color: zoom === 1 ? '#fff' : 'var(--nothing-red, #d71921)',
                  fontSize: 11,
                  fontFamily: 'var(--nothing-font-mono, monospace)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={() => setZoom((z) => Math.min(6, Number((z + 0.25).toFixed(2))))}
                title="Zoom In (+)"
                style={{
                  padding: 5,
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                <ZoomIn size={14} />
              </button>

              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                title="Rotate 90°"
                style={{
                  padding: 5,
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Fit to Window"
                style={{
                  padding: 5,
                  background: 'transparent',
                  border: 'none',
                  color: '#ccc',
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          )}

          {/* Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              title="Delete File"
              style={{
                padding: '6px 8px',
                background: 'rgba(215, 25, 33, 0.15)',
                border: '1px solid rgba(215, 25, 33, 0.35)',
                color: '#ff4444',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              <Trash2 size={14} />
            </button>

            <button
              onClick={handleLaunchExternal}
              title="Open with Google Photos"
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#bbb',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              <ExternalLink size={14} />
            </button>

            <button
              onClick={() => setSelectedItem(null)}
              title="Close Viewer (Esc)"
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                borderRadius: 6,
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Center Main Stage (Image or Video) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onMouseDown={!isVideo ? handleMouseDown : undefined}
          onMouseMove={!isVideo ? handleMouseMove : undefined}
          onMouseUp={!isVideo ? handleMouseUp : undefined}
          onDoubleClick={!isVideo ? handleDoubleClick : undefined}
        >
          {/* Side Chevron Prev Button */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevItem}
              title="Previous (Left Arrow)"
              style={{
                position: 'absolute',
                left: 18,
                padding: 12,
                borderRadius: '50%',
                background: 'rgba(20, 20, 24, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 30,
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Media Content: Video Player or Zoomable Image */}
          {isVideo ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              {selectedItem.path ? (
                <video
                  src={`https://localhost/_capacitor_file_${selectedItem.path}`}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: 8,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#888' }}>
                  <Film size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <div>Video item ready for playback</div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `translate(${pan.x}px, ${pan.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.15s ease',
              }}
            >
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt={selectedItem.displayName}
                  style={{
                    maxWidth: '92%',
                    maxHeight: '92%',
                    objectFit: 'contain',
                    borderRadius: 4,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>
                  <RotateCw size={16} className="animate-spin" />
                  <span>Loading full image...</span>
                </div>
              )}
            </div>
          )}

          {/* Side Chevron Next Button */}
          {currentIndex < displayedItems.length - 1 && (
            <button
              onClick={handleNextItem}
              title="Next (Right Arrow)"
              style={{
                position: 'absolute',
                right: 18,
                padding: 12,
                borderRadius: '50%',
                background: 'rgba(20, 20, 24, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                cursor: 'pointer',
                zIndex: 30,
                transition: 'all 0.15s ease',
              }}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>

        {/* Bottom Horizontal Filmstrip Carousel (Windows Photos Style) */}
        <div
          ref={filmstripRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'rgba(10, 10, 14, 0.9)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            overflowX: 'auto',
            zIndex: 40,
            scrollbarWidth: 'none',
          }}
        >
          {displayedItems.map((item) => {
            const isCurrent = item.id === selectedItem.id;
            const thumb = thumbnails[item.id];
            return (
              <div
                key={item.id}
                data-thumb-id={item.id}
                onClick={() => handleSelectItem(item)}
                style={{
                  width: 52,
                  height: 52,
                  minWidth: 52,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: '#16161c',
                  border: isCurrent
                    ? '2px solid var(--nothing-red, #d71921)'
                    : '1px solid rgba(255, 255, 255, 0.12)',
                  opacity: isCurrent ? 1 : 0.6,
                  cursor: 'pointer',
                  position: 'relative',
                  transform: isCurrent ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                }}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.mediaType === 'video' ? <VideoIcon size={14} color="#666" /> : <ImageIcon size={14} color="#666" />}
                  </div>
                )}
                {item.mediaType === 'video' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: 3,
                      padding: '1px 3px',
                      fontSize: 8,
                    }}
                  >
                    <Play size={7} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: GALLERY COLLECTION (Photos / Videos / Albums tabs)
  // =========================================================================
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0a0a0c',
        color: '#fff',
        fontSize: 13,
        userSelect: 'none',
      }}
    >
      {/* Gallery Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(18, 18, 22, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          gap: 12,
        }}
      >
        {/* Navigation Tabs: Photos / Videos / Albums */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              setActiveTab('photos');
              setSelectedAlbum('all');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: activeTab === 'photos' ? 'var(--nothing-red, #d71921)' : 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: activeTab === 'photos' ? '#fff' : '#aaa',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ImageIcon size={14} />
            <span>Photos</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('videos');
              setSelectedAlbum('all');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: activeTab === 'videos' ? 'var(--nothing-red, #d71921)' : 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: activeTab === 'videos' ? '#fff' : '#aaa',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <VideoIcon size={14} />
            <span>Videos</span>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              background: activeTab === 'albums' ? 'var(--nothing-red, #d71921)' : 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              color: activeTab === 'albums' ? '#fff' : '#aaa',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FolderOpen size={14} />
            <span>Albums</span>
          </button>
        </div>

        {/* Search Bar */}
        <div
          style={{
            flex: 1,
            maxWidth: 260,
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '3px 8px',
            gap: 6,
          }}
        >
          <Search size={12} color="#666" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: 11,
              fontFamily: 'var(--nothing-font-mono, monospace)',
            }}
          />
          {searchQuery && (
            <X size={12} color="#888" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
          )}
        </div>

        {/* Total & Refresh Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              color: '#888',
              fontSize: 11,
              background: 'rgba(255,255,255,0.06)',
              padding: '3px 8px',
              borderRadius: 4,
              fontFamily: 'var(--nothing-font-mono, monospace)',
            }}
          >
            {displayedItems.length} items
          </span>

          <button
            onClick={loadMedia}
            title="Refresh gallery"
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
            }}
          >
            <RotateCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Album Mode: Album Folders Grid */}
      {activeTab === 'albums' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }}
          >
            {Array.from(detectedAlbums.entries()).map(([albumName, items]) => {
              const coverItem = items[0];
              const coverThumb = coverItem ? thumbnails[coverItem.id] : null;
              return (
                <div
                  key={albumName}
                  onClick={() => {
                    setSelectedAlbum(albumName);
                    setActiveTab('photos');
                  }}
                  style={{
                    background: '#15151b',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = 'rgba(215, 25, 33, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  <div style={{ aspectRatio: '16/10', background: '#1c1c24', position: 'relative' }}>
                    {coverThumb ? (
                      <img
                        src={coverThumb}
                        alt={albumName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FolderOpen size={32} color="#555" />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{albumName}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{items.length} items</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Photos / Videos Grid View */
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, position: 'relative' }}>
          {/* Sub-Album Filter Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 12,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {['all', 'Camera', 'Pictures', 'Screenshots', 'WhatsApp', 'Movies', 'Downloads'].map((album) => {
              const isSelected = selectedAlbum === album;
              return (
                <button
                  key={album}
                  onClick={() => setSelectedAlbum(album)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    background: isSelected ? 'var(--nothing-red, #d71921)' : 'rgba(255, 255, 255, 0.06)',
                    border: 'none',
                    color: isSelected ? '#fff' : '#888',
                    fontSize: 11,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {album === 'all' ? `All ${activeTab}` : album}
                </button>
              );
            })}
          </div>

          {displayedItems.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
              {activeTab === 'videos' ? (
                <VideoIcon size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
              ) : (
                <ImageIcon size={48} style={{ opacity: 0.25, marginBottom: 12 }} />
              )}
              <div style={{ fontSize: 14 }}>No {activeTab} found in this category</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                Media saved to device storage will automatically appear here.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}
            >
              {displayedItems.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  thumbnail={thumbnails[item.id]}
                  onSelect={handleSelectItem}
                  onRequestThumbnail={(m) => {
                    platformAdapter.getPhotoThumbnail(m.id, m.path, 320).then((thumbRes) => {
                      if (thumbRes.ok) {
                        setThumbnails((prev) => ({ ...prev, [m.id]: thumbRes.value }));
                      }
                    });
                  }}
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Gallery Card Component with auto-thumbnail fetching
const GalleryCard: React.FC<{
  item: PhotoItem;
  thumbnail?: string;
  onSelect: (item: PhotoItem) => void;
  onRequestThumbnail: (item: PhotoItem) => void;
  formatDuration: (ms?: number) => string;
}> = ({ item, thumbnail, onSelect, onRequestThumbnail, formatDuration }) => {
  useEffect(() => {
    if (!thumbnail) {
      onRequestThumbnail(item);
    }
  }, [item, thumbnail, onRequestThumbnail]);

  const isVideo = item.mediaType === 'video';

  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        aspectRatio: '1',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#15151b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)';
        e.currentTarget.style.borderColor = 'rgba(215, 25, 33, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={item.displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        >
          {isVideo ? <VideoIcon size={24} color="#555" /> : <ImageIcon size={24} color="#444" />}
        </div>
      )}

      {/* Video Badge Overlay */}
      {isVideo && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            borderRadius: 4,
            padding: '2px 5px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 9,
            color: '#fff',
            fontFamily: 'var(--nothing-font-mono, monospace)',
          }}
        >
          <Play size={8} fill="#fff" color="#fff" />
          {item.duration ? <span>{formatDuration(item.duration)}</span> : null}
        </div>
      )}

      {/* Filename Footer Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '4px 6px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
          fontSize: 10,
          color: '#bbb',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {item.displayName}
      </div>
    </div>
  );
};
