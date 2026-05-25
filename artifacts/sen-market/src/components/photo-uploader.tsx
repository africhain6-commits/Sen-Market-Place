import { useState, useRef } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
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
    const remaining = maxPhotos - photos.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploadingCount((c) => c + toUpload.length);

    const results = await Promise.all(
      toUpload.map(async (file) => {
        const result = await uploadFile(file);
        return result ? `/api/storage${result.objectPath}` : null;
      }),
    );

    const uploaded = results.filter(Boolean) as string[];
    onChange([...photos, ...uploaded]);
    setUploadingCount((c) => c - toUpload.length);

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
      {photos.length > 0 && (
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
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
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
          onClick={() => inputRef.current?.click()}
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
              <p className="text-sm">Envoi en cours...</p>
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
                  Cliquez pour sélectionner · {maxPhotos - photos.length} photo{maxPhotos - photos.length > 1 ? "s" : ""} restante{maxPhotos - photos.length > 1 ? "s" : ""}
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
