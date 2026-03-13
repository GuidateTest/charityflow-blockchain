/**
 * IPFS upload via Pinata API
 * Get a free JWT at https://app.pinata.cloud
 * Add VITE_PINATA_JWT to your .env
 */

const PINATA_UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";

export const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs";

export function ipfsUrl(cid) {
  if (!cid) return "";
  const hash = cid.startsWith("ipfs://") ? cid.replace("ipfs://", "") : cid;
  return `${IPFS_GATEWAY}/${hash}`;
}

export async function uploadToIPFS(file) {
  if (!file) throw new Error("No file provided");
  if (!PINATA_JWT) {
    throw new Error(
      "Missing VITE_PINATA_JWT. Add your Pinata JWT to .env (get one free at pinata.cloud)"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("network", "public");

  const res = await fetch(PINATA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Upload failed: ${res.status}`);
  }

  const data = await res.json();
  const cid = data?.data?.cid || data?.cid;
  if (!cid) throw new Error("No CID returned from Pinata");
  return cid;
}
