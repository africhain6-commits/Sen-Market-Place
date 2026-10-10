import { useState, useRef } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
}

const MAX_SIDE = 1600;

// Réduit la photo avant l'envoi (plus rapide, moins de risque d'échec).
// Si la réduction échoue, on envoie la photo d'origine.
async function shrinkImage(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
      return file;
    }
    const url = URL.createObjectURL(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode"));
      el.src = url;
    });
    URL.revokeObjectURL(url);

    const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 1_500_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function PhotoUploader({ photos, onChange, maxPhotos = 10 }: PhotoUploaderProps) {
  const [uploadingCount, setUploadingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { uploadFile } = useUpload({
    onError: (err) => {
      console.error("Upload error:", err);
    },
  });

  const handleFiles = async (files: FileList) => {
    const all = Array.from(files);
    const remaining = maxPhotos - photos.length;
    const toUpload = all.slice(0, remaining);
    if (toUpload.length === 0) return;

    if (all.length > remaining) {
      toast({
        title: "Trop de photos",
        description: `Seules ${remaining} photo${remaining > 1 ? "s" : ""} sur ${all.length} ${remaining > 1 ? "seront ajoutées" : "sera ajoutée"}.`,
      });
    }

    setUploadingCount(toUpload.length);

    let current = [...photos];
    let failed = 0;

    for (const original of toUpload) {
      try {
        const file = await shrinkImage(original);
        const result = await uploadFile(file);
        if (result) {
          current = [...current, `/api/storage${result.objectPath}`];
          onChange(current);
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
      setUploadingCount((c) => Math.max(0, c - 1));
    }

    if (failed > 0) {
      toast({
        variant: "destructive",
        title: "Envoi incomplet",
        description: `${failed} photo${failed > 1 ? "s n'ont" : " n'a"} pas pu être envoyée${failed > 1 ? "s" : ""}. Réessayez.`,
      });
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onChange(updated);
  };

  const canAdd = photos.length < maxPhotos;
  const isUploading = uploadingCount > 0;

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {(photos.length > 0 || isUploading) && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-md overflow-hidden border bg-muted group"
              data-testid={`photo-preview-${i}`}
            >
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                data-testid={`remove-photo-${i}`}
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                  Principale
                </div>
              )}
            </div>
          ))}

          {/* Uploading placeholders */}
          {Array.from({ length: uploadingCount }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="aspect-square rounded-md border bg-muted flex items-center justify-center"
            >
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAdd && (
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => !isUploading && inputRef.current?.click()}
          data-testid="photo-upload-zone"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            data-testid="input-photo-files"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Envoi en cours... {uploadingCount} restante{uploadingCount > 1 ? "s" : ""}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {photos.length === 0 ? (
                <ImageIcon className="w-10 h-10 opacity-40" />
              ) : (
                <Upload className="w-8 h-8 opacity-40" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {photos.length === 0 ? "Ajouter des photos" : "Ajouter d'autres photos"}
                </p>
                <p className="text-xs mt-1">
                  Sur téléphone : appuyez longtemps sur une photo pour en choisir plusieurs · {maxPhotos - photos.length} photo{maxPhotos - photos.length > 1 ? "s" : ""} restante{maxPhotos - photos.length > 1 ? "s" : ""}
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" className="mt-1">
                <Upload className="w-3 h-3 mr-1" />
                Choisir des fichiers
              </Button>
            </div>
          )}
        </div>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-xs text-muted-foreground text-center">
          Limite de {maxPhotos} photos atteinte.
        </p>
      )}
    </div>
  );
}
