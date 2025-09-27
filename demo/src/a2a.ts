import axios from "axios";
import { createDemoPaymentPayload, encodePaymentPayload } from "./payment.ts";
export async function fetchContentByHash(serviceUrl: string, hash: string) {
  const client = axios.create({ baseURL: serviceUrl, timeout: 15000 });

  try {
    // First request without payment
    const resp = await client.get(`/a2a/content/${hash}`);
    return resp.data;
  } catch (e: any) {
    // If 402, generate demo payment and retry
    if (e.response && e.response.status === 402) {
      const accepts = e.response.data?.accepts;
      const first = Array.isArray(accepts) ? accepts[0] : accepts;
      if (!first) throw new Error("No payment requirements provided");

      // Use the actual content price from maxAmountRequired (in cents)
      const centsValue = first.maxAmountRequired || process.env.PAYMENT_AMOUNT || "10000";

      // Convert cents to USDC units (USDC has 6 decimals, so cents * 10000)
      const usdcValue = (parseInt(centsValue) * 10000).toString();

      const payment = await createDemoPaymentPayload(
        process.env.PRIVATE_KEY_ADDRESS ||
          "0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f",
        first.payTo,
        usdcValue,
        first.asset || "0xVerifier"
      );

      const b64 = encodePaymentPayload(payment);

      // Retry with X-PAYMENT header
      const retryResp = await client.get(`/a2a/content/${hash}`, {
        headers: { "X-PAYMENT": b64 },
      });

      return retryResp.data;
    }

    // Any other errors
    throw e;
  }
}
