"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Link } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Globe } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { LinkedinIcon } from "@/components/linkedin-icon";
import { author } from "@/lib/author";
import { brand } from "@/lib/brand";
import { APP_VERSION } from "@/lib/version";

export function AboutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }

  return (
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
            title={`About ${brand.nameSentence}`}
            onOpenChange={handleOpenChange}
          />
        }
        content={
          <LayoutContent>
            <VStack gap={5} width="100%">
              <VStack gap={3} width="100%">
                <Text type="body">
                  <em>
                    Bricolage: the construction or creation of a work from a
                    diverse range of things.
                  </em>
                </Text>
                <Text type="body">
                  I built {brand.nameSentence} as a way of exploring and sharing
                  music in an interactive visual format. I&apos;m still
                  developing the app, so I&apos;d love to hear what you think and
                  your ideas to make it even better.
                </Text>
              </VStack>

              <HStack
                gap={2}
                width="100%"
                justify="between"
                vAlign="center"
              >
                <Text type="body">Created by {author.name}</Text>
                <HStack gap={1} vAlign="center">
                  <IconButton
                    label="Website"
                    tooltip="Website"
                    variant="ghost"
                    size="sm"
                    href={author.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<Icon icon={Globe} size="sm" />}
                  />
                  <IconButton
                    label="GitHub"
                    tooltip="GitHub"
                    variant="ghost"
                    size="sm"
                    href={author.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<Icon icon={GithubIcon} size="sm" />}
                  />
                  <IconButton
                    label="LinkedIn"
                    tooltip="LinkedIn"
                    variant="ghost"
                    size="sm"
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<Icon icon={LinkedinIcon} size="sm" />}
                  />
                </HStack>
              </HStack>

              <HStack
                gap={2}
                width="100%"
                justify="between"
                vAlign="center"
              >
                <Text type="supporting" color="secondary">
                  Version {APP_VERSION}
                </Text>
                <Link
                  href={author.releasesUrl}
                  isExternalLink
                  isStandalone
                  size="sm"
                  color="secondary"
                >
                  View releases
                </Link>
              </HStack>
            </VStack>
          </LayoutContent>
        }
      />
    </Dialog>
  );
}
