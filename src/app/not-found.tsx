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
      <Text type="large">That page is not the cloud.</Text>
      <Text type="body" color="secondary">
        There is only the listening-history cover cloud.
      </Text>
      <Button label="Back" href="/" as={Link} />
    </VStack>
  );
}
