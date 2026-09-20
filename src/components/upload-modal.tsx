"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import type { ReactNode } from "react";

export function UploadModal({
  open,
  title = "Upload listening history",
  dismissible = true,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  dismissible?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && dismissible) onClose();
  }

  return (
    <Dialog
      isOpen={open}
      onOpenChange={handleOpenChange}
      purpose={dismissible ? "form" : "required"}
      width="48rem"
      maxHeight="90dvh"
    >
      <Layout
        header={
          <DialogHeader
            title={title}
            onOpenChange={dismissible ? handleOpenChange : undefined}
          />
        }
        content={<LayoutContent>{children}</LayoutContent>}
      />
    </Dialog>
  );
}
