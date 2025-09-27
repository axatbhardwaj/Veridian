import { fetchContentByHash } from "./a2a.ts";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const SERVICE_AGENT_URL =
    process.env.SERVICE_AGENT_URL || "http://localhost:5402";
  const MATCH_TOPIC_URL =
    process.env.MATCH_TOPIC_URL || "http://127.0.0.1:8000/match_topic";

  const topic = "arch"; 

  try {
    const matchResp = await fetch(MATCH_TOPIC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    });

    if (!matchResp.ok) {
      throw new Error(`Match topic request failed: ${matchResp.status}`);
    }

    const matchData = await matchResp.json();
    const contentHash = matchData.best_match_hash;

    console.log("Matched content hash:", contentHash);
    const contentResp = await fetchContentByHash(
      SERVICE_AGENT_URL,
      contentHash
    );
    console.log("Content response:", JSON.stringify(contentResp, null, 2));
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
