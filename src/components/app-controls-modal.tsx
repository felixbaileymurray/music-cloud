"use client";

import { useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Box } from "lucide-react";
import { author } from "@/lib/author";
import { useShowDevControls } from "@/lib/dev-controls-pref";
import { APP_VERSION } from "@/lib/version";

export function AppControlsButton() {
  const [open, setOpen] = useState(false);
  const [showDevControls, setShowDevControls] = useShowDevControls();

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
  }

  return (
    <>
      <IconButton
        label="App"
        tooltip="App"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        icon={<Icon icon={Box} size="sm" />}
      />
      <Dialog
        isOpen={open}
        onOpenChange={handleOpenChange}
        purpose="info"
        width="28rem"
        maxHeight="90dvh"
      >
        <Layout
          header={
            <DialogHeader
              title="App"
              onOpenChange={handleOpenChange}
            />
          }
          content={
            <LayoutContent>
              <VStack gap={4} width="100%">
                <HStack
                  gap={2}
                  width="100%"
                  justify="between"
                  vAlign="center"
                >
                  <Text type="body">Version</Text>
                  <Text type="body" color="secondary">
                    {APP_VERSION}
                  </Text>
                </HStack>
                <HStack
                  gap={2}
                  width="100%"
                  justify="between"
                  vAlign="center"
                >
                  <Text type="body">Releases</Text>
                  <Link
                    href={author.releasesUrl}
                    isExternalLink
                    isStandalone
                    color="secondary"
                  >
                    View releases
                  </Link>
                </HStack>
                <Switch
                  label="Development controls"
                  value={showDevControls}
                  onChange={setShowDevControls}
                  labelPosition="start"
                  labelSpacing="spread"
                  width="100%"
                  size="sm"
                />
              </VStack>
            </LayoutContent>
          }
        />
      </Dialog>
    </>
  );
}
