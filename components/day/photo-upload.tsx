"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { Camera, ImageOff } from "lucide-react";
import { compressImageToWebP } from "@/lib/image";

export function PhotoUpload({
  existingUrl,
  disabled,
}: {
  existingUrl: string | null;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [busy, setBusy] = useState(false);

  async function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const source = e.target.files?.[0];
    if (!source) return;

    setBusy(true);
    try {
      const compressed = await compressImageToWebP(source);
      const file = new File([compressed], "photo.webp", { type: "image/webp" });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
      }

      setPreview(URL.createObjectURL(compressed));
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return preview ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={preview}
        alt=""
        className="aspect-video w-full rounded-xl object-cover"
      />
    ) : (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground/60">
        <ImageOff className="size-5" />
        No photo yet
      </div>
    );
  }

  return (
    <motion.label
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="group relative block cursor-pointer overflow-hidden rounded-xl border border-dashed border-border"
    >
      <input
        ref={fileInputRef}
        type="file"
        name="photo"
        accept="image/*"
        onChange={handlePick}
        className="sr-only"
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="aspect-video w-full object-cover transition-opacity group-hover:opacity-80"
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
          <Camera className="size-5" />
          <span>📷 Add a photo</span>
        </div>
      )}

      {busy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-foreground"
        >
          ✨ Compressing…
        </motion.div>
      )}
    </motion.label>
  );
}
