import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  FileText,
  FileCode,
  Image,
  Film,
  Music,
  Archive,
  ArrowLeft,
  RotateCw,
  Trash2,
  Save,
  X,
  HardDrive,
  FilePlus,
  ChevronRight,
} from 'lucide-react';
import { platformAdapter } from '../../platform/nativeAdapter';
import type { FileItem, StorageInfo } from '../../platform/interface';

export const FileAccessApp: React.FC<{ windowId: string }> = () => {
  const [currentPath, setCurrentPath] = useState<string>('/storage/emulated/0');
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [items, setItems] = useState<FileItem[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);

  // File Editor state
  const [editingFile, setEditingFile] = useState<{ path: string; name: string; content: string; isDirty: boolean } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New item modal
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const loadDirectory = useCallback(async (path?: string) => {
    setIsLoading(true);
    setSelectedItem(null);
    try {
      const res = await platformAdapter.listDirectory(path);
      if (res.ok) {
        setCurrentPath(res.value.currentPath);
        setParentPath(res.value.parentPath);
        setItems(res.value.items);
      }
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStorage = useCallback(async () => {
    try {
      const info = await platformAdapter.getStorageInfo();
      setStorageInfo(info);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadDirectory();
    loadStorage();
  }, [loadDirectory, loadStorage]);

  const handleOpenItem = async (item: FileItem) => {
    if (item.isDirectory) {
      loadDirectory(item.path);
    } else {
      // Open in text editor if text/code/json/markdown
      const textExts = ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'html', 'css', 'xml', 'log', 'csv', 'yaml', 'yml', 'ini', 'sh', 'py'];
      if (textExts.includes(item.extension) || item.size < 500000) {
        try {
          const res = await platformAdapter.readFileText(item.path);
          if (res.ok) {
            setEditingFile({
              path: item.path,
              name: item.name,
              content: res.value,
              isDirty: false,
            });
          }
        } catch {
          // Ignored
        }
      }
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setIsSaving(true);
    try {
      await platformAdapter.writeFileText(editingFile.path, editingFile.content);
      setEditingFile((prev) => (prev ? { ...prev, isDirty: false } : null));
      loadDirectory(currentPath);
    } catch {
      // Ignored
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await platformAdapter.createFolder(currentPath, newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadDirectory(currentPath);
    } catch {
      // Ignored
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    const filePath = `${currentPath}/${newFileName.trim()}`;
    try {
      await platformAdapter.writeFileText(filePath, '');
      setNewFileName('');
      setShowNewFileModal(false);
      loadDirectory(currentPath);
      setEditingFile({
        path: filePath,
        name: newFileName.trim(),
        content: '',
        isDirty: false,
      });
    } catch {
      // Ignored
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    if (window.confirm(`Delete "${selectedItem.name}"?`)) {
      try {
        await platformAdapter.deleteItem(selectedItem.path);
        loadDirectory(currentPath);
      } catch {
        // Ignored
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (item: FileItem) => {
    if (item.isDirectory) return <Folder size={18} color="#d71921" fill="rgba(215, 25, 33, 0.2)" />;
    const ext = item.extension;
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <Image size={18} color="#00ff66" />;
    if (['mp4', 'mkv', 'mov', 'webm'].includes(ext)) return <Film size={18} color="#ffaa00" />;
    if (['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext)) return <Music size={18} color="#00bbff" />;
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Archive size={18} color="#ff00bb" />;
    if (['js', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py'].includes(ext)) return <FileCode size={18} color="#d71921" />;
    return <FileText size={18} color="#888888" />;
  };

  // Breadcrumb path parts
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0c', color: '#fff', fontSize: 13, userSelect: 'none' }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'rgba(18, 18, 22, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => parentPath && loadDirectory(parentPath)}
          disabled={!parentPath}
          title="Up to Parent Directory"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: parentPath ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
            opacity: parentPath ? 1 : 0.3,
            color: '#fff',
            cursor: parentPath ? 'pointer' : 'default',
          }}
        >
          <ArrowLeft size={14} />
        </button>

        <button
          onClick={() => loadDirectory(currentPath)}
          title="Refresh Directory"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>

        {/* Breadcrumb Path Bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflowX: 'auto',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: 'monospace',
          }}
        >
          <HardDrive size={13} color="var(--nothing-red, #d71921)" />
          <span
            onClick={() => loadDirectory('/storage/emulated/0')}
            style={{ cursor: 'pointer', color: '#aaa' }}
          >
            Internal Storage
          </span>
          {pathParts.slice(2).map((part, index) => {
            const partPath = '/' + pathParts.slice(0, 3 + index).join('/');
            return (
              <React.Fragment key={partPath}>
                <ChevronRight size={12} color="#555" />
                <span
                  onClick={() => loadDirectory(partPath)}
                  style={{
                    cursor: 'pointer',
                    color: index === pathParts.length - 3 ? '#fff' : '#aaa',
                    fontWeight: index === pathParts.length - 3 ? 600 : 400,
                  }}
                >
                  {part}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <button
          onClick={() => setShowNewFolderModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 6,
            fontSize: 12,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <FolderPlus size={14} color="#d71921" />
          <span>New Folder</span>
        </button>

        <button
          onClick={() => setShowNewFileModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 6,
            fontSize: 12,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <FilePlus size={14} color="#d71921" />
          <span>New File</span>
        </button>

        {selectedItem && (
          <button
            onClick={handleDeleteItem}
            title="Delete Selected Item"
            style={{
              padding: '6px 10px',
              background: 'rgba(215, 25, 33, 0.2)',
              border: '1px solid #d71921',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} color="#d71921" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Files Grid/List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {items.length === 0 && !isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#666' }}>
              <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>This folder is empty</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 10,
              }}
            >
              {items.map((item) => {
                const isSelected = selectedItem?.path === item.path;
                return (
                  <div
                    key={item.path}
                    onClick={() => setSelectedItem(item)}
                    onDoubleClick={() => handleOpenItem(item)}
                    onTouchEnd={() => {
                      if (selectedItem?.path === item.path) {
                        handleOpenItem(item);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px 8px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(215, 25, 33, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'var(--nothing-red, #d71921)' : 'rgba(255, 255, 255, 0.06)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>{getFileIcon(item)}</div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isSelected ? '#fff' : '#ddd',
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>
                      {item.isDirectory ? 'Folder' : formatFileSize(item.size)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Text Editor Overlay */}
        {editingFile && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#0d0d10',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                background: '#15151a',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <FileCode size={14} color="#d71921" />
                <span style={{ fontWeight: 600 }}>{editingFile.name}</span>
                {editingFile.isDirty && <span style={{ color: '#d71921' }}>● Edited</span>}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSaveFile}
                  disabled={isSaving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 12px',
                    background: '#d71921',
                    color: '#fff',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <Save size={13} />
                  <span>{isSaving ? 'Saving...' : 'Save File'}</span>
                </button>
                <button
                  onClick={() => setEditingFile(null)}
                  style={{
                    padding: '4px 8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#aaa',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={editingFile.content}
              onChange={(e) =>
                setEditingFile((prev) =>
                  prev ? { ...prev, content: e.target.value, isDirty: true } : null
                )
              }
              style={{
                flex: 1,
                width: '100%',
                background: '#0a0a0c',
                color: '#f0f0f0',
                border: 'none',
                padding: '12px 16px',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.6,
                outline: 'none',
                resize: 'none',
              }}
              placeholder="Start typing text..."
            />
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 320,
              background: '#16161c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create New Folder</div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0c',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                marginBottom: 14,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowNewFolderModal(false)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: '#aaa',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                style={{
                  padding: '6px 14px',
                  background: '#d71921',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFileModal && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 320,
              background: '#16161c',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Create New Text File</div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="document.txt"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0c',
                border: '1px solid #333',
                borderRadius: 6,
                color: '#fff',
                marginBottom: 14,
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowNewFileModal(false)}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: '#aaa',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                style={{
                  padding: '6px 14px',
                  background: '#d71921',
                  color: '#fff',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'rgba(15, 15, 18, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: 11,
          color: '#888',
        }}
      >
        <div>{items.length} items</div>
        {storageInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>
              Internal Storage: {storageInfo.usedGB} GB used of {storageInfo.totalGB} GB ({storageInfo.freeGB} GB free)
            </span>
            <div
              style={{
                width: 70,
                height: 6,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${storageInfo.usedPercent}%`,
                  height: '100%',
                  background: storageInfo.usedPercent > 85 ? '#d71921' : '#00d26a',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
