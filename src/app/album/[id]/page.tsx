import { AlbumView } from "@/components/album-view";
import { albums } from "@/lib/catalog";

export function generateStaticParams() {
  return [...albums.map((album) => ({ id: album.id })), { id: "imported" }];
}

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AlbumView albumId={id} />;
}
