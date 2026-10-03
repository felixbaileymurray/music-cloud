import shareFixture from "../fixtures/share-document.json";
import {
  encodeShareHash,
  type ShareDocumentV1,
} from "../../../src/lib/share-payload";

export const minimalShareDocument = shareFixture as ShareDocumentV1;

export async function shareHashForDocument(
  doc: ShareDocumentV1 = minimalShareDocument
): Promise<string> {
  return await encodeShareHash(doc);
}
