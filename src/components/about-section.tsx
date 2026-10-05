import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Coffee } from "lucide-react";
import { GithubIcon } from "@/components/github-icon";
import { author } from "@/lib/author";

export function AboutSection() {
  return (
    <VStack gap={2} width="100%" hAlign="start">
      <Text type="supporting" color="secondary">
        About
      </Text>
      <Text type="body">{author.name}</Text>
      <HStack gap={1} vAlign="center">
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
          label="Buy Me a Coffee"
          tooltip="Buy Me a Coffee"
          variant="ghost"
          size="sm"
          href={author.buyMeACoffeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          icon={<Icon icon={Coffee} size="sm" />}
        />
      </HStack>
    </VStack>
  );
}
