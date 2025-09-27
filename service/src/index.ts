import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createResourceClient, callGetContentByHash } from "./client/http.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 5402;
const RESOURCE_SERVER_URL =
  process.env.RESOURCE_SERVER_URL || "http://localhost:3001";

const resourceClient = createResourceClient(RESOURCE_SERVER_URL);

// Proxy endpoint to fetch content by hash
app.get("/a2a/content/:hash", async (req, res) => {
  const { hash } = req.params;
  const clientPaymentHeader = req.headers["x-payment"] as string | undefined;

  try {
    const resp = await callGetContentByHash(
      resourceClient,
      hash,
      clientPaymentHeader
    );

    // Forward X-PAYMENT-RESPONSE if resource server provided one
    const xpr = resp.headers["x-payment-response"] as string | undefined;
    if (xpr) {
      res.setHeader("X-PAYMENT-RESPONSE", xpr);
    }

    return res.json(resp.data);
  } catch (e: any) {
    if (e.response) {
      // Propagate resource server errors (402, 404, etc.)
      return res.status(e.response.status).json(e.response.data);
    }
    return res
      .status(500)
      .json({ error: "Service Agent error", message: String(e) });
  }
});

app.get("/healthz", (_req, res) =>
  res.json({ ok: true, resource: RESOURCE_SERVER_URL })
);

app.listen(PORT, () =>
  console.log(
    `Service Agent listening on ${PORT}, resource=${RESOURCE_SERVER_URL}`
  )
);
