import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const LINEAR_TRIGGER_STATUS = process.env.LINEAR_TRIGGER_STATUS ?? "Todo";

function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac("sha256", LINEAR_WEBHOOK_SECRET);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return digest === signature;
}

interface LinearWebhookPayload {
  action: string;
  type: string;
  data: {
    id: string;
    title: string;
    description?: string;
    priority: number;
    state?: { name: string };
    labels?: Array<{ name: string }>;
  };
  updatedFrom?: {
    stateId?: string;
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("linear-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: LinearWebhookPayload = JSON.parse(body);

  // Only handle Issue events
  if (payload.type !== "Issue") {
    return NextResponse.json({ ignored: true, reason: "not an Issue event" });
  }

  // Only trigger when status changes to the trigger status
  const currentStatus = payload.data.state?.name;
  if (currentStatus !== LINEAR_TRIGGER_STATUS) {
    return NextResponse.json({ ignored: true, reason: `status is "${currentStatus}", not "${LINEAR_TRIGGER_STATUS}"` });
  }

  // Only trigger on updates that changed the state (not creates with the status already set, unless it's a create)
  if (payload.action !== "create" && !payload.updatedFrom?.stateId) {
    return NextResponse.json({ ignored: true, reason: "status was not changed in this update" });
  }

  // Fire repository_dispatch to GitHub
  const [owner, repo] = GITHUB_REPO.split("/");
  const dispatchResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: "linear-ticket",
        client_payload: {
          issue_id: payload.data.id,
          title: payload.data.title,
          description: payload.data.description ?? "",
          priority: payload.data.priority,
          labels: (payload.data.labels ?? []).map((l) => l.name),
        },
      }),
    },
  );

  if (!dispatchResponse.ok) {
    const errorText = await dispatchResponse.text();
    console.error("GitHub dispatch failed:", errorText);
    return NextResponse.json(
      { error: "Failed to dispatch to GitHub" },
      { status: 502 },
    );
  }

  return NextResponse.json({ dispatched: true, issue_id: payload.data.id });
}
