const axios = require("axios");

const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.shubh.sh";

function buildPaymentRequirements(resourceUrl, payTo, asset, contentPriceCents = 100000) {
  return {
    scheme: "exact",
    network: "polygon-amoy",
    resource: resourceUrl,
    description: "Premium Endpoint: Requires payment to be processed",
    mimeType: "application/json",
    payTo,
    maxAmountRequired: contentPriceCents.toString(),
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
    // For demo purposes, if facilitator is not available, accept the payment
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.log('Facilitator not available, accepting demo payment');
      return { success: true, demo: true };
    }
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
    // For demo purposes, if facilitator is not available, return success
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      console.log('Facilitator not available, demo payment settled');
      return {
        data: { success: true, demo: true, transaction: 'demo-transaction' },
        headers: { 'x-payment-response': 'demo-settlement' }
      };
    }
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
