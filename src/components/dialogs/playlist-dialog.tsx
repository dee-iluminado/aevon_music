"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ListMusic, Save } from "lucide-react";
import { toast } from "sonner";
import { useLibrary } from "@/stores/library-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";

interface PlaylistDialogProps {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  playlistId?: string;
  defaultName?: string;
  defaultDescription?: string;
}

export function PlaylistDialog({
  open,
  onClose,
  mode = "create",
  playlistId,
  defaultName = "",
  defaultDescription = "",
}: PlaylistDialogProps) {
  useLockBody(open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <PlaylistForm
            key={playlistId ?? "new"}
            onClose={onClose}
            mode={mode}
            playlistId={playlistId}
            defaultName={defaultName}
            defaultDescription={defaultDescription}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

function PlaylistForm({
  onClose,
  mode,
  playlistId,
  defaultName = "",
  defaultDescription = "",
}: Pick<
  PlaylistDialogProps,
  "onClose" | "mode" | "playlistId" | "defaultName" | "defaultDescription"
>) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const createPlaylist = useLibrary((s) => s.createPlaylist);
  const updatePlaylist = useLibrary((s) => s.updatePlaylist);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (mode === "create") {
      createPlaylist(trimmed, description.trim() || undefined);
      toast.success(`Playlist "${trimmed}" created`);
    }
    onClose();
  };

  const save = (id?: string) => {
    if (!id) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    updatePlaylist(id, {
      name: trimmed,
      description: description.trim() || undefined,
    });
    toast.success("Playlist updated");
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.98 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#16161a] p-5 shadow-2xl sm:rounded-3xl"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
          <ListMusic className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold">
            {mode === "create" ? "Create playlist" : "Edit playlist"}
          </h2>
          <p className="text-xs text-zinc-500">
            {mode === "create"
              ? "Give your mix a name to get started"
              : "Update your playlist details"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Playlist name"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-accent/60 focus:bg-white/[0.07]"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-accent/60 focus:bg-white/[0.07]"
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className={cn(
            "h-10 rounded-full px-5 text-sm font-medium text-zinc-400 transition hover:bg-white/5 hover:text-zinc-200"
          )}
        >
          Cancel
        </button>
        <button
          onClick={() => (mode === "create" ? submit() : save(playlistId))}
          disabled={!name.trim()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-zinc-950 transition hover:bg-accent/90 active:scale-[.98] disabled:opacity-40"
        >
          <Save className="h-4 w-4" />
          {mode === "create" ? "Create" : "Save changes"}
        </button>
      </div>
    </motion.div>
  );
}
