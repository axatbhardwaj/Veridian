import axios from "axios";
import { createDemoPaymentPayload, encodePaymentPayload } from "./payment.js";
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

      const value =
        process.env.PAYMENT_AMOUNT || first.maxAmountRequired || "10000";
      const payment = await createDemoPaymentPayload(
        process.env.PRIVATE_KEY_ADDRESS ||
          "0xA7635CdB2B835737FdcE78Ea22F06Fb78101110f",
        first.payTo,
        value,
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
