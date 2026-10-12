"use client";

import { useRef, useState } from "react";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export function ImageIntake({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function pickFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length === 0) {
      setError("Choose one or more image files.");
      return;
    }
    setError(null);
    onFilesSelected(files);
  }

  return (
    <VStack gap={4} width="100%">
      <Text type="body" color="secondary">
        Add photos from your device. They stay in this browser — nothing is
        uploaded to a server.
      </Text>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => pickFiles(event.target.files)}
      />

      <Button
        label="Choose images"
        variant="primary"
        width="100%"
        onClick={() => inputRef.current?.click()}
      />

      {error ? (
        <Banner status="error" title={error} collapsible={false} />
      ) : null}
    </VStack>
  );
}
