"use client";

import Link from "next/link";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

export default function NotFound() {
  return (
    <VStack
      gap={2}
      hAlign="center"
      vAlign="center"
      padding={4}
      width="100%"
      minHeight="100svh"
    >
      <Text type="large">That link doesn't work.</Text>
      <Text type="body" color="secondary">
        If you're trying to create a collage, try the home page.
      </Text>
      <Button label="Home" href="/" as={Link} />
    </VStack>
  );
}
