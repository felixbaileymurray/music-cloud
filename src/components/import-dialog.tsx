"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { saveImports } from "@/lib/imports";

export function ImportDialog({ onImported }: { onImported: () => void }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!files.length) {
      toast.error("Choose at least one audio file.");
      return;
    }
    setBusy(true);
    try {
      await saveImports(files);
      toast.success(
        files.length === 1
          ? `Added ${files[0].name} to Imported.`
          : `Added ${files.length} tracks to Imported.`
      );
      setFiles([]);
      setOpen(false);
      onImported();
    } catch {
      toast.error("Could not save those files in this browser.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFiles([]);
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        Import audio
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from this computer</DialogTitle>
          <DialogDescription>
            Files are stored only in this browser. Nothing is uploaded. Drop MP3,
            WAV, FLAC, or AAC into your Imported album and play it from the bar.
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
          multiple
          className="hidden"
          onChange={(event) => {
            setFiles(Array.from(event.target.files ?? []));
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-8 text-left text-sm transition hover:bg-white/8"
        >
          {files.length ? (
            <span className="block space-y-1">
              {files.map((file) => (
                <span key={file.name} className="block truncate text-foreground">
                  {file.name}
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Choose audio files, or click to browse.
            </span>
          )}
        </button>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleImport()} disabled={busy}>
            {busy ? "Adding…" : "Add to library"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
