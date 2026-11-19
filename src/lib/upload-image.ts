// src/lib/upload-image.ts

import { supabase } from "@/lib/supabase";

/**
 * Converts a file to a Base64 Data URL (used as fallback or instant preview)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Supabase Storage with automatic Base64 fallback.
 */
export async function uploadExamDiagram(file: File): Promise<{ url: string; isFallback: boolean }> {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload a valid image file (PNG, JPEG, WebP, SVG).");
  }

  // Validate size (max 8MB)
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be smaller than 8MB.");
  }

  try {
    const ext = file.name.split(".").pop() || "png";
    const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `exam-images/${Date.now()}-${crypto.randomUUID()}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from("exam-assets")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.warn("Supabase upload failed, using Base64 fallback:", uploadError.message);
      const base64 = await fileToBase64(file);
      return { url: base64, isFallback: true };
    }

    const { data } = supabase.storage
      .from("exam-assets")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error("Could not retrieve public image URL");
    }

    return { url: data.publicUrl, isFallback: false };
  } catch (err) {
    console.warn("Storage upload exception, falling back to Base64:", err);
    const base64 = await fileToBase64(file);
    return { url: base64, isFallback: true };
  }
}