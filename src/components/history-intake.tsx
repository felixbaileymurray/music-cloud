"use client";

import { useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/VStack";
import {
  mergeParses,
  parseHistoryText,
  type ParseKind,
} from "@/lib/parse-history";
import type { AnyParseResult } from "@/lib/types";

export function HistoryIntake({
  kind = "album",
  onParsed,
}: {
  kind?: ParseKind;
  onParsed: (result: AnyParseResult) => void;
}) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parseGeneration = useRef(0);

  const emptyMessage =
    kind === "track"
      ? "No track + artist rows found. Use a Spotify export, CSV with track and artist columns, or Track - Artist lines."
      : "No album + artist rows found. Use a Spotify export, CSV, or Album - Artist lines.";

  async function readFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList);
    if (nextFiles.length === 0) return;
    const generation = ++parseGeneration.current;
    setBusy(true);
    setError(null);
    try {
      const parsed = await Promise.all(
        nextFiles.map(async (file) =>
          parseHistoryText(await file.text(), file.name, kind)
        )
      );
      if (generation !== parseGeneration.current) return;
      const merged = mergeParses(parsed);
      if (merged.listens.length === 0) {
        setError(merged.issues[0]?.detail ?? emptyMessage);
        return;
      }
      onParsed(merged);
    } catch {
      if (generation !== parseGeneration.current) return;
      setError("Could not read those files.");
    } finally {
      if (generation === parseGeneration.current) setBusy(false);
    }
  }

  function submitPaste() {
    const parsed = parseHistoryText(text, "pasted list", kind);
    if (parsed.listens.length === 0) {
      setError(parsed.issues[0]?.detail ?? emptyMessage);
      return;
    }
    setError(null);
    onParsed(parsed);
  }

  const pastePlaceholder =
    kind === "track"
      ? "Paranoid Android - Radiohead\nRed Eyes - The War on Drugs"
      : "OK Computer - Radiohead\nBlue Train - John Coltrane";

  return (
    <VStack gap={5} width="100%">
      <Text type="body" color="secondary">
        {kind === "track"
          ? "Drop a list of tracks and artists. Matches get cover art and a single track snippet."
          : "Drop a list of albums and artists. Matches get a cover and up to three rotating snippets."}
      </Text>

      <FileInput
        label="Listening history files"
        mode="dropzone"
        isMultiple
        accept=".json,.csv,.txt,application/json,text/csv,text/plain"
        value={files}
        onChange={(next) => {
          setFiles(Array.isArray(next) ? next : next ? [next] : null);
        }}
        changeAction={async (next) => {
          const list = Array.isArray(next) ? next : next ? [next] : [];
          if (list.length) await readFiles(list);
        }}
        isLoading={busy}
        description="Spotify extended streaming history works. CSV needs the right columns for your cloud type."
        placeholder="Drop Spotify JSON, CSV, or text"
        width="100%"
      />

      <VStack gap={3} width="100%">
        <TextArea
          label="Or paste a list"
          value={text}
          onChange={setText}
          placeholder={pastePlaceholder}
          rows={5}
          width="100%"
        />
        <Button
          label="Build from paste"
          variant="primary"
          isDisabled={busy || !text.trim()}
          onClick={submitPaste}
        />
      </VStack>

      {error ? (
        <Banner status="error" title={error} collapsible={false} />
      ) : null}
    </VStack>
  );
}
