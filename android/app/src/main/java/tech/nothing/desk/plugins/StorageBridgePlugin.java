package tech.nothing.desk.plugins;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.util.Size;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Arrays;
import java.util.Comparator;

@CapacitorPlugin(name = "StorageBridge")
public class StorageBridgePlugin extends Plugin {

    @PluginMethod
    public void pickFile(PluginCall call) {
        String mimeType = call.getString("mimeType", "*/*");
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);

        startActivityForResult(call, intent, "pickFileResult");
    }

    @ActivityCallback
    private void pickFileResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null && result.getData().getData() != null) {
            Uri uri = result.getData().getData();
            ContentResolver contentResolver = getContext().getContentResolver();

            String displayName = "file";
            long size = 0L;

            try (Cursor cursor = contentResolver.query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (nameIndex != -1) displayName = cursor.getString(nameIndex);
                    if (sizeIndex != -1) size = cursor.getLong(sizeIndex);
                }
            } catch (Exception ignored) {
            }

            String mimeType = contentResolver.getType(uri);
            if (mimeType == null) mimeType = "application/octet-stream";
            String textContent = null;

            if (mimeType.startsWith("text/") || mimeType.contains("json") || mimeType.contains("markdown")) {
                try (InputStream inputStream = contentResolver.openInputStream(uri)) {
                    if (inputStream != null) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sb.append(line).append("\n");
                        }
                        textContent = sb.toString();
                    }
                } catch (Exception ignored) {
                }
            }

            JSObject response = new JSObject();
            response.put("name", displayName);
            response.put("uri", uri.toString());
            response.put("mimeType", mimeType);
            response.put("size", size);
            response.put("lastModified", System.currentTimeMillis());
            response.put("content", textContent);
            call.resolve(response);
        } else {
            call.reject("User cancelled file selection.");
        }
    }

    @PluginMethod
    public void listDirectory(PluginCall call) {
        try {
            String targetPath = call.getString("path", null);
            File dir;
            if (targetPath == null || targetPath.isEmpty() || "~".equals(targetPath)) {
                dir = Environment.getExternalStorageDirectory();
            } else {
                dir = new File(targetPath);
            }

            if (!dir.exists() || !dir.isDirectory()) {
                dir = Environment.getExternalStorageDirectory();
            }

            File[] files = dir.listFiles();
            JSArray itemsArray = new JSArray();

            if (files != null) {
                // Sort directories first, then alphabetical
                Arrays.sort(files, new Comparator<File>() {
                    @Override
                    public int compare(File f1, File f2) {
                        if (f1.isDirectory() && !f2.isDirectory()) return -1;
                        if (!f1.isDirectory() && f2.isDirectory()) return 1;
                        return f1.getName().compareToIgnoreCase(f2.getName());
                    }
                });

                for (File f : files) {
                    if (f.getName().startsWith(".")) continue; // Hide hidden files
                    JSObject item = new JSObject();
                    item.put("name", f.getName());
                    item.put("path", f.getAbsolutePath());
                    item.put("isDirectory", f.isDirectory());
                    item.put("size", f.isDirectory() ? 0L : f.length());
                    item.put("lastModified", f.lastModified());

                    String ext = "";
                    int dotIdx = f.getName().lastIndexOf('.');
                    if (dotIdx > 0 && dotIdx < f.getName().length() - 1) {
                        ext = f.getName().substring(dotIdx + 1).toLowerCase();
                    }
                    item.put("extension", ext);
                    itemsArray.put(item);
                }
            }

            File parent = dir.getParentFile();
            String rootPath = Environment.getExternalStorageDirectory().getAbsolutePath();
            String parentPath = (parent != null && dir.getAbsolutePath().length() > rootPath.length()) ? parent.getAbsolutePath() : null;

            JSObject res = new JSObject();
            res.put("currentPath", dir.getAbsolutePath());
            res.put("parentPath", parentPath);
            res.put("items", itemsArray);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to list directory: " + e.getMessage());
        }
    }

    @PluginMethod
    public void readFileText(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Path is required");
            return;
        }

        try {
            File f = new File(path);
            if (!f.exists()) {
                call.reject("File does not exist: " + path);
                return;
            }

            if (f.length() > 5 * 1024 * 1024) {
                call.reject("File exceeds 5MB size limit for text editor.");
                return;
            }

            StringBuilder sb = new StringBuilder();
            try (BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(f)))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append("\n");
                }
            }

            JSObject res = new JSObject();
            res.put("path", path);
            res.put("content", sb.toString());
            res.put("size", f.length());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to read file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void writeFileText(PluginCall call) {
        String path = call.getString("path");
        String content = call.getString("content", "");
        if (path == null) {
            call.reject("Path is required");
            return;
        }

        try {
            File f = new File(path);
            File parent = f.getParentFile();
            if (parent != null && !parent.exists()) {
                parent.mkdirs();
            }

            try (OutputStreamWriter writer = new OutputStreamWriter(new FileOutputStream(f))) {
                writer.write(content);
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("path", path);
            res.put("size", f.length());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to write file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void createFolder(PluginCall call) {
        String parentPath = call.getString("parentPath");
        String folderName = call.getString("folderName");
        if (parentPath == null || folderName == null) {
            call.reject("parentPath and folderName are required");
            return;
        }

        try {
            File targetDir = new File(parentPath, folderName);
            boolean created = targetDir.mkdirs();
            JSObject res = new JSObject();
            res.put("success", created || targetDir.exists());
            res.put("path", targetDir.getAbsolutePath());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to create folder: " + e.getMessage());
        }
    }

    @PluginMethod
    public void deleteItem(PluginCall call) {
        String path = call.getString("path");
        if (path == null) {
            call.reject("Path is required");
            return;
        }

        try {
            File target = new File(path);
            boolean deleted = deleteRecursive(target);
            JSObject res = new JSObject();
            res.put("success", deleted);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to delete item: " + e.getMessage());
        }
    }

    private boolean deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] children = fileOrDirectory.listFiles();
            if (children != null) {
                for (File child : children) {
                    deleteRecursive(child);
                }
            }
        }
        return fileOrDirectory.delete();
    }

    @PluginMethod
    public void getDevicePhotos(PluginCall call) {
        int limit = call.getInt("limit", 200);
        int offset = call.getInt("offset", 0);

        JSArray photosArray = new JSArray();

        // 1. Query Images from MediaStore
        try {
            ContentResolver resolver = getContext().getContentResolver();
            Uri imagesUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;

            String[] projection = new String[]{
                MediaStore.Images.Media._ID,
                MediaStore.Images.Media.DISPLAY_NAME,
                MediaStore.Images.Media.DATE_ADDED,
                MediaStore.Images.Media.SIZE,
                MediaStore.Images.Media.MIME_TYPE,
                MediaStore.Images.Media.DATA
            };

            String sortOrder = MediaStore.Images.Media.DATE_ADDED + " DESC";

            try (Cursor cursor = resolver.query(imagesUri, projection, null, null, sortOrder)) {
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media._ID);
                    int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DISPLAY_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_ADDED);
                    int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.SIZE);
                    int mimeCol = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE);
                    int dataCol = cursor.getColumnIndex(MediaStore.Images.Media.DATA);

                    int skipped = 0;
                    int count = 0;

                    while (cursor.moveToNext()) {
                        if (skipped < offset) {
                            skipped++;
                            continue;
                        }

                        long id = cursor.getLong(idCol);
                        String name = cursor.getString(nameCol);
                        long dateAdded = cursor.getLong(dateCol);
                        long size = cursor.getLong(sizeCol);
                        String mime = cursor.getString(mimeCol);
                        String dataPath = dataCol != -1 ? cursor.getString(dataCol) : "";

                        Uri contentUri = ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);

                        JSObject photoObj = new JSObject();
                        photoObj.put("id", "img_" + id);
                        photoObj.put("mediaId", String.valueOf(id));
                        photoObj.put("displayName", name != null ? name : "IMG_" + id + ".jpg");
                        photoObj.put("dateAdded", dateAdded * 1000); // ms
                        photoObj.put("size", size);
                        photoObj.put("mimeType", mime != null ? mime : "image/jpeg");
                        photoObj.put("mediaType", "image");
                        photoObj.put("uri", contentUri.toString());
                        photoObj.put("path", dataPath);

                        photosArray.put(photoObj);
                        count++;
                        if (count >= limit) {
                            break;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // 2. Query Videos from MediaStore
        try {
            ContentResolver resolver = getContext().getContentResolver();
            Uri videosUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;

            String[] projection = new String[]{
                MediaStore.Video.Media._ID,
                MediaStore.Video.Media.DISPLAY_NAME,
                MediaStore.Video.Media.DATE_ADDED,
                MediaStore.Video.Media.SIZE,
                MediaStore.Video.Media.MIME_TYPE,
                MediaStore.Video.Media.DATA,
                MediaStore.Video.Media.DURATION
            };

            String sortOrder = MediaStore.Video.Media.DATE_ADDED + " DESC";

            try (Cursor cursor = resolver.query(videosUri, projection, null, null, sortOrder)) {
                if (cursor != null) {
                    int idCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media._ID);
                    int nameCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DISPLAY_NAME);
                    int dateCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.DATE_ADDED);
                    int sizeCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.SIZE);
                    int mimeCol = cursor.getColumnIndexOrThrow(MediaStore.Video.Media.MIME_TYPE);
                    int dataCol = cursor.getColumnIndex(MediaStore.Video.Media.DATA);
                    int durationCol = cursor.getColumnIndex(MediaStore.Video.Media.DURATION);

                    int count = 0;
                    while (cursor.moveToNext() && count < 60) {
                        long id = cursor.getLong(idCol);
                        String name = cursor.getString(nameCol);
                        long dateAdded = cursor.getLong(dateCol);
                        long size = cursor.getLong(sizeCol);
                        String mime = cursor.getString(mimeCol);
                        String dataPath = dataCol != -1 ? cursor.getString(dataCol) : "";
                        long duration = durationCol != -1 ? cursor.getLong(durationCol) : 0;

                        Uri contentUri = ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id);

                        JSObject videoObj = new JSObject();
                        videoObj.put("id", "vid_" + id);
                        videoObj.put("mediaId", String.valueOf(id));
                        videoObj.put("displayName", name != null ? name : "VID_" + id + ".mp4");
                        videoObj.put("dateAdded", dateAdded * 1000);
                        videoObj.put("size", size);
                        videoObj.put("mimeType", mime != null ? mime : "video/mp4");
                        videoObj.put("mediaType", "video");
                        videoObj.put("duration", duration);
                        videoObj.put("uri", contentUri.toString());
                        videoObj.put("path", dataPath);

                        photosArray.put(videoObj);
                        count++;
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // 3. Direct filesystem fallback if MediaStore returned 0 items
        if (photosArray.length() == 0) {
            File[] scanDirs = new File[]{
                new File("/storage/emulated/0/DCIM/Camera"),
                new File("/storage/emulated/0/DCIM"),
                new File("/storage/emulated/0/Pictures"),
                new File("/storage/emulated/0/Pictures/Screenshots"),
                new File("/storage/emulated/0/Pictures/WhatsApp"),
                new File("/storage/emulated/0/Pictures/Instagram"),
                new File("/storage/emulated/0/Movies"),
                new File("/storage/emulated/0/Download")
            };

            int addedCount = 0;
            for (File dir : scanDirs) {
                if (!dir.exists() || !dir.isDirectory()) continue;
                File[] files = dir.listFiles();
                if (files == null) continue;
                Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
                for (File f : files) {
                    if (f.isFile()) {
                        String name = f.getName();
                        boolean isImg = isImageFile(name);
                        boolean isVid = isVideoFile(name);
                        if (isImg || isVid) {
                            JSObject mediaObj = new JSObject();
                            mediaObj.put("id", (isVid ? "vid_" : "img_") + Math.abs(f.getAbsolutePath().hashCode()));
                            mediaObj.put("displayName", f.getName());
                            mediaObj.put("dateAdded", f.lastModified());
                            mediaObj.put("size", f.length());
                            mediaObj.put("mimeType", isVid ? getVideoMimeType(name) : getMimeType(name));
                            mediaObj.put("mediaType", isVid ? "video" : "image");
                            mediaObj.put("uri", Uri.fromFile(f).toString());
                            mediaObj.put("path", f.getAbsolutePath());
                            photosArray.put(mediaObj);
                            addedCount++;
                            if (addedCount >= limit) break;
                        }
                    }
                }
                if (addedCount >= limit) break;
            }
        }

        JSObject res = new JSObject();
        res.put("photos", photosArray);
        call.resolve(res);
    }

    private boolean isImageFile(String name) {
        String lower = name.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png")
            || lower.endsWith(".webp") || lower.endsWith(".heic") || lower.endsWith(".bmp")
            || lower.endsWith(".gif");
    }

    private boolean isVideoFile(String name) {
        String lower = name.toLowerCase();
        return lower.endsWith(".mp4") || lower.endsWith(".mov") || lower.endsWith(".mkv")
            || lower.endsWith(".webm") || lower.endsWith(".3gp") || lower.endsWith(".avi");
    }

    private String getMimeType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".heic")) return "image/heic";
        if (lower.endsWith(".bmp")) return "image/bmp";
        return "image/jpeg";
    }

    private String getVideoMimeType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".mov")) return "video/quicktime";
        if (lower.endsWith(".mkv")) return "video/x-matroska";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".3gp")) return "video/3gpp";
        return "video/mp4";
    }

    @PluginMethod
    public void getPhotoThumbnail(PluginCall call) {
        String idStr = call.getString("id");
        String pathStr = call.getString("path");
        int targetSize = call.getInt("targetSize", 320);

        try {
            Bitmap thumb = null;

            // Handle video files
            if (pathStr != null && !pathStr.isEmpty() && isVideoFile(pathStr)) {
                MediaMetadataRetriever mmr = new MediaMetadataRetriever();
                try {
                    mmr.setDataSource(pathStr);
                    thumb = mmr.getFrameAtTime(1000000, MediaMetadataRetriever.OPTION_CLOSEST_SYNC);
                } catch (Exception ignored) {
                } finally {
                    try { mmr.release(); } catch (Exception ignored) {}
                }
            }

            // 1. Hardware-accelerated loadThumbnail (Android 10+)
            if (thumb == null && idStr != null && !idStr.isEmpty()) {
                try {
                    String cleanId = idStr.replace("img_", "").replace("vid_", "");
                    long id = Long.parseLong(cleanId);
                    Uri contentUri = idStr.startsWith("vid_")
                        ? ContentUris.withAppendedId(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, id)
                        : ContentUris.withAppendedId(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, id);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        thumb = getContext().getContentResolver().loadThumbnail(contentUri, new Size(targetSize, targetSize), null);
                    }
                } catch (Exception ignored) {
                }
            }

            // 2. Direct File decode with target subsampling for images
            if (thumb == null && pathStr != null && !pathStr.isEmpty()) {
                File f = new File(pathStr);
                if (f.exists() && isImageFile(f.getName())) {
                    BitmapFactory.Options opts = new BitmapFactory.Options();
                    opts.inJustDecodeBounds = true;
                    BitmapFactory.decodeFile(f.getAbsolutePath(), opts);

                    int inSampleSize = 1;
                    if (opts.outHeight > targetSize || opts.outWidth > targetSize) {
                        final int halfHeight = opts.outHeight / 2;
                        final int halfWidth = opts.outWidth / 2;
                        while ((halfHeight / inSampleSize) >= targetSize && (halfWidth / inSampleSize) >= targetSize) {
                            inSampleSize *= 2;
                        }
                    }

                    opts.inJustDecodeBounds = false;
                    opts.inSampleSize = Math.max(1, inSampleSize);
                    thumb = BitmapFactory.decodeFile(f.getAbsolutePath(), opts);
                }
            }

            if (thumb != null) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                thumb.compress(Bitmap.CompressFormat.JPEG, 75, baos);
                byte[] bytes = baos.toByteArray();
                String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                String dataUrl = "data:image/jpeg;base64," + base64;

                JSObject res = new JSObject();
                res.put("dataUrl", dataUrl);
                call.resolve(res);
            } else {
                call.reject("Could not load thumbnail");
            }
        } catch (Exception e) {
            call.reject("Thumbnail error: " + e.getMessage());
        }
    }
}
