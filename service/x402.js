const axios = require("axios");

const FACILITATOR_URL = process.env.FACILITATOR_URL || "http://localhost:5401";

function buildPaymentRequirements(resourceUrl, payTo, asset) {
  return {
    scheme: "exact",
    network: "polygon-amoy",
    resource: resourceUrl,
    description: "Premium Endpoint: Requires payment to be processed",
    mimeType: "application/json",
    payTo,
    maxAmountRequired: "100000",
    maxTimeoutSeconds: 120,
    asset,
    extra: { name: "USDC", version: "2" },
    outputSchema: { input: { type: "http", method: "POST" }, output: {} },
  };
}

async function verifyPayment(paymentPayloadBase64) {
  const url = `${FACILITATOR_URL}/verify`;
  try {
    const resp = await axios.post(
      url,
      { paymentPayloadBase64 },
      { timeout: 10_000 }
    );
    return resp.data;
  } catch (err) {
    if (err.response) return err.response.data;
    throw err;
  }
}

async function settlePayment(paymentPayloadBase64) {
  const url = `${FACILITATOR_URL}/settle`;
  try {
    const resp = await axios.post(
      url,
      { paymentPayloadBase64 },
      { timeout: 30_000 }
    );
    return { data: resp.data, headers: resp.headers };
  } catch (err) {
    if (err.response)
      return { data: err.response.data, headers: err.response.headers };
    throw err;
  }
}

module.exports = {
  buildPaymentRequirements,
  verifyPayment,
  settlePayment,
};
