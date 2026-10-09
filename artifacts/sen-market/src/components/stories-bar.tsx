import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BadgeCheck, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoUploader } from "@/components/photo-uploader";

type StoryItem = {
  id: number;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
};

type StoryGroup = {
  user: {
    id: number;
    name: string;
    avatarUrl: string | null;
    accountType: string;
    agencyName: string | null;
    isVerified: boolean;
  };
  stories: StoryItem[];
};

const STORY_DURATION_MS = 5000;

async function fetchStories(): Promise<StoryGroup[]> {
  const res = await fetch("/api/stories", { credentials: "include" });
  if (!res.ok) throw new Error("Chargement impossible");
  return res.json();
}

function StoryViewer({
  groups,
  startIndex,
  meId,
  isAdmin,
  onClose,
  onSeen,
  onDeleted,
}: {
  groups: StoryGroup[];
  startIndex: number;
  meId: number | null;
  isAdmin: boolean;
  onClose: () => void;
  onSeen: (userId: number) => void;
  onDeleted: () => void;
}) {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const goNext = () => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(groupIdx + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx(groupIdx - 1);
      setStoryIdx(prevGroup.stories.length - 1);
    }
  };

  // Marque le professionnel comme « vu »
  useEffect(() => {
    if (group) onSeen(group.user.id);
  }, [groupIdx]);

  // Passage automatique à la story suivante
  useEffect(() => {
    if (!group) return;
    const timer = setTimeout(goNext, STORY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [groupIdx, storyIdx]);

  // Touche Échap + blocage du défilement de la page derrière
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!group || !story) return null;

  const canDelete = isAdmin || group.user.id === meId;

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/stories/${story.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Suppression impossible");
      toast({ title: "Story supprimée" });
      onDeleted();
    } catch {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la story." });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-modal="true">
      <style>{`@keyframes story-progress { from { width: 0%; } to { width: 100%; } }`}</style>

      <div className="absolute inset-x-0 top-0 z-10 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-6 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex gap-1 mb-3">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden">
              {i < storyIdx && <div className="h-full w-full bg-white" />}
              {i === storyIdx && (
                <div
                  key={`${groupIdx}-${s.id}`}
                  className="h-full bg-white"
                  style={{ animation: `story-progress ${STORY_DURATION_MS}ms linear forwards` }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-white">
          <Avatar className="h-9 w-9">
            <AvatarImage src={group.user.avatarUrl || ""} className="object-cover" />
            <AvatarFallback className="bg-white/20 text-white">
              {group.user.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold flex items-center gap-1 truncate">
              {group.user.name}
              {group.user.isVerified && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
            </p>
            <p className="text-xs text-white/70 truncate">
              {group.user.agencyName ? `${group.user.agencyName} · ` : ""}
              {formatDistanceToNow(new Date(story.createdAt), { locale: fr, addSuffix: true })}
            </p>
          </div>
          {canDelete && (
            <button type="button" onClick={handleDelete} className="p-2" aria-label="Supprimer la story">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button type="button" onClick={onClose} className="p-2" aria-label="Fermer">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <img src={story.imageUrl} alt="" className="max-h-full max-w-full object-contain select-none" />
        <button type="button" className="absolute inset-y-0 left-0 w-1/3" onClick={goPrev} aria-label="Précédent" />
        <button type="button" className="absolute inset-y-0 right-0 w-2/3" onClick={goNext} aria-label="Suivant" />
      </div>

      {story.caption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-gradient-to-t from-black/70 to-transparent text-white text-sm text-center">
          {story.caption}
        </div>
      )}
    </div>
  );
}

export function StoriesBar() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const me = user as unknown as
    | { id: number; isAdmin?: boolean; accountType?: string; name?: string; avatarUrl?: string | null }
    | null;
  const isPro = isAuthenticated && !!me?.accountType && me.accountType !== "particulier";

  const { data: groups } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchStories,
    staleTime: 30_000,
  });

  const [seen, setSeen] = useState<number[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const publish = async () => {
    if (photos.length === 0) {
      toast({ variant: "destructive", title: "Photo manquante", description: "Ajoutez une photo pour votre story." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photos[0], caption }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Une erreur est survenue");
      }
      toast({ title: "Story publiée", description: "Elle restera visible 24 heures." });
      setAddOpen(false);
      setPhotos([]);
      setCaption("");
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    } catch (err) {
      toast({ variant: "destructive", title: "Erreur", description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!isPro && (!groups || groups.length === 0)) return null;

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-3 mb-6" data-testid="stories-bar">
        {isPro && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]"
            data-testid="button-add-story"
          >
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground/40">
                <AvatarImage src={me?.avatarUrl || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {me?.name?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                <Plus className="w-3.5 h-3.5" />
              </span>
            </div>
            <span className="text-xs text-center truncate w-full">Ma story</span>
          </button>
        )}

        {groups?.map((g, i) => {
          const isSeen = seen.includes(g.user.id);
          return (
            <button
              key={g.user.id}
              type="button"
              onClick={() => setViewerIndex(i)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[72px]"
              data-testid={`story-circle-${g.user.id}`}
            >
              <div
                className={`rounded-full p-[3px] ${
                  isSeen ? "bg-muted-foreground/30" : "bg-gradient-to-tr from-[#D4AF37] to-amber-500"
                }`}
              >
                <div className="rounded-full bg-background p-[2px]">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={g.user.avatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {g.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-center truncate w-full">{g.user.agencyName || g.user.name}</span>
            </button>
          );
        })}
      </div>

      {viewerIndex !== null && groups && groups[viewerIndex] && (
        <StoryViewer
          groups={groups}
          startIndex={viewerIndex}
          meId={me?.id ?? null}
          isAdmin={me?.isAdmin === true}
          onClose={() => setViewerIndex(null)}
          onSeen={(userId) => setSeen((prev) => (prev.includes(userId) ? prev : [...prev, userId]))}
          onDeleted={() => {
            setViewerIndex(null);
            queryClient.invalidateQueries({ queryKey: ["stories"] });
          }}
        />
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une story</DialogTitle>
            <DialogDescription>Votre story sera visible pendant 24 heures.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <PhotoUploader photos={photos} onChange={(p: string[]) => setPhotos(p.slice(0, 1))} maxPhotos={1} />
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
              placeholder="Texte (facultatif)"
            />
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={publish}>
              {saving ? "Publication..." : "Publier ma story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
