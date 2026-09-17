"use client";

import { useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { FileInput } from "@astryxdesign/core/FileInput";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { VStack } from "@astryxdesign/core/VStack";
import { mergeParses, parseHistoryText } from "@/lib/parse-history";
import type { ParseResult } from "@/lib/types";

export function HistoryIntake({
  onParsed,
}: {
  onParsed: (result: ParseResult) => void;
}) {
  const [files, setFiles] = useState<File[] | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const parseGeneration = useRef(0);

  async function readFiles(fileList: FileList | File[]) {
    const nextFiles = Array.from(fileList);
    if (nextFiles.length === 0) return;
    const generation = ++parseGeneration.current;
    setBusy(true);
    setError(null);
    try {
      const parsed = await Promise.all(
        nextFiles.map(async (file) =>
          parseHistoryText(await file.text(), file.name)
        )
      );
      if (generation !== parseGeneration.current) return;
      const merged = mergeParses(parsed);
      if (merged.listens.length === 0) {
        setError(
          merged.issues[0]?.detail ??
            "No album + artist rows found. Use a Spotify export, CSV, or Album - Artist lines."
        );
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
    const parsed = parseHistoryText(text, "pasted list");
    if (parsed.listens.length === 0) {
      setError(
        parsed.issues[0]?.detail ??
          "Paste JSON, CSV with album and artist columns, or Album - Artist lines."
      );
      return;
    }
    setError(null);
    onParsed(parsed);
  }

  async function loadExample() {
    const generation = ++parseGeneration.current;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/example-history.csv");
      if (!response.ok) throw new Error("missing example");
      const parsed = parseHistoryText(
        await response.text(),
        "example-history.csv"
      );
      if (generation !== parseGeneration.current) return;
      onParsed(parsed);
    } catch {
      if (generation !== parseGeneration.current) return;
      setError("Example list failed to load.");
    } finally {
      if (generation === parseGeneration.current) setBusy(false);
    }
  }

  return (
    <VStack gap={5} width="100%">
      <VStack gap={2}>
        <Text type="supporting">Music Cloud</Text>
        <Text type="body" color="secondary">
          Drop a list of albums and artists. Matches get a cover and a 30-second
          snippet. Hover plays; unmatched albums are dropped before the cloud
          appears.
        </Text>
      </VStack>

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
        description="Spotify extended streaming history works. CSV needs album and artist columns. Text is one Album - Artist line each."
        placeholder="Drop Spotify JSON, CSV, or text"
        width="100%"
      />

      <VStack gap={3} width="100%">
        <TextArea
          label="Or paste a list"
          value={text}
          onChange={setText}
          placeholder={"OK Computer - Radiohead\nBlue Train - John Coltrane"}
          rows={5}
          width="100%"
        />
        <HStack gap={2} wrap="wrap">
          <Button
            label="Build from paste"
            variant="primary"
            isDisabled={busy || !text.trim()}
            onClick={submitPaste}
          />
          <Button
            label="Use example list"
            variant="ghost"
            isDisabled={busy}
            onClick={() => void loadExample()}
          />
        </HStack>
      </VStack>

      {error ? (
        <Banner status="error" title={error} collapsible={false} />
      ) : null}
    </VStack>
  );
}
