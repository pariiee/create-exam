import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), "public");
    
    // Check if public directory exists
    if (!fs.existsSync(publicDir)) {
      return NextResponse.json({ 
        exists: false,
        message: "Public directory tidak ditemukan" 
      });
    }

    // Read all files in public directory
    const files = fs.readdirSync(publicDir);
    
    // Find any .apk file (case insensitive)
    const apkFile = files.find(file => file.toLowerCase().endsWith('.apk'));
    
    if (!apkFile) {
      return NextResponse.json({ 
        exists: false,
        message: "File APK tidak ditemukan di folder public" 
      });
    }

    const apkPath = path.join(publicDir, apkFile);
    
    // Get file stats
    const stats = fs.statSync(apkPath);
    
    // Format file size
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    };

    // Format last modified date
    const lastModified = new Date(stats.mtime).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return NextResponse.json({
      exists: true,
      path: `/${apkFile}`,
      size: formatSize(stats.size),
      sizeBytes: stats.size,
      lastModified: lastModified,
      fileName: apkFile
    });
  } catch (error: unknown) {
    console.error("[APK Info Error]", error);
    return NextResponse.json({ 
      exists: false,
      message: "Gagal mengecek file APK" 
    }, { status: 500 });
  }
}
