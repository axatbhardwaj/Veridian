import axios from "axios";

// A minimal axios instance that will forward X-PAYMENT header if provided by caller
export function createResourceClient(baseURL: string) {
  const client = axios.create({ baseURL, timeout: 15_000 });
  return client;
}

export async function callGetContentByHash(
  client: any,
  hash: string,
  paymentHeader?: string
) {
  const headers: Record<string, string> = {};
  if (paymentHeader) headers["X-PAYMENT"] = paymentHeader;

  return client.get(`/api/content/${hash}`, { headers });
}
