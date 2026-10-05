import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Globe, Heart } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { LinkedinIcon } from "@/components/linkedin-icon";
import { author } from "@/lib/author";

export function AboutSection() {
  return (
    <VStack gap={2} width="100%" hAlign="start">
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
        <IconButton
          label="Support"
          tooltip="Support"
          variant="ghost"
          size="sm"
          href={author.buyMeACoffeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<Icon icon={Heart} size="sm" />}
        />
      </HStack>
    </VStack>
  );
}
