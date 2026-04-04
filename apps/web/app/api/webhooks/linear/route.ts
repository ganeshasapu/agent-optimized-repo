import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const LINEAR_WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const GITHUB_REPO = process.env.GITHUB_REPO ?? "";
const LINEAR_TRIGGER_STATUS = process.env.LINEAR_TRIGGER_STATUS ?? "Todo";
const LINEAR_DECOMPOSE_STATUS = process.env.LINEAR_DECOMPOSE_STATUS ?? "Decompose";

function verifySignature(body: string, signature: string): boolean {
  const hmac = createHmac("sha256", LINEAR_WEBHOOK_SECRET);
  hmac.update(body);
  const digest = hmac.digest("hex");
  return digest === signature;
}

interface LinearIssuePayload {
  action: string;
  type: "Issue";
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

interface LinearCommentPayload {
  action: string;
  type: "Comment";
  data: {
    id: string;
    body: string;
    issueId: string;
    userId: string;
  };
}

type LinearWebhookPayload = LinearIssuePayload | LinearCommentPayload;

async function dispatchToGitHub(
  eventType: string,
  clientPayload: Record<string, unknown>,
): Promise<Response> {
  const [owner, repo] = GITHUB_REPO.split("/");
  return fetch(
    `https://api.github.com/repos/${owner}/${repo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_type: eventType,
        client_payload: clientPayload,
      }),
    },
  );
}

function handleIssueEvent(payload: LinearIssuePayload): { eventType: string; clientPayload: Record<string, unknown> } | { ignored: true; reason: string } {
  const currentStatus = payload.data.state?.name;
  let eventType: string;
  if (currentStatus === LINEAR_TRIGGER_STATUS) {
    eventType = "linear-ticket";
  } else if (currentStatus === LINEAR_DECOMPOSE_STATUS) {
    eventType = "linear-decompose";
  } else {
    return { ignored: true, reason: `status is "${currentStatus}", not "${LINEAR_TRIGGER_STATUS}" or "${LINEAR_DECOMPOSE_STATUS}"` };
  }

  if (payload.action !== "create" && !payload.updatedFrom?.stateId) {
    return { ignored: true, reason: "status was not changed in this update" };
  }

  return {
    eventType,
    clientPayload: {
      issue_id: payload.data.id,
      title: payload.data.title,
      description: payload.data.description ?? "",
      priority: payload.data.priority,
      labels: (payload.data.labels ?? []).map((l) => l.name),
    },
  };
}

function handleCommentEvent(payload: LinearCommentPayload): { eventType: string; clientPayload: Record<string, unknown> } | { ignored: true; reason: string } {
  const commentBody = payload.data.body ?? "";

  // Only trigger on comments that mention @agent
  if (!commentBody.includes("@agent")) {
    return { ignored: true, reason: "comment does not mention @agent" };
  }

  // Ignore bot comments (contain the agent marker) to prevent loops
  if (commentBody.includes("— Agent")) {
    return { ignored: true, reason: "comment is from agent (loop prevention)" };
  }

  // Extract instructions (everything after @agent)
  const instructions = commentBody.replace(/@agent\s*/g, "").trim();

  return {
    eventType: "linear-agent-fix",
    clientPayload: {
      issue_id: payload.data.issueId,
      comment_id: payload.data.id,
      instructions,
    },
  };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("linear-signature") ?? "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload: LinearWebhookPayload = JSON.parse(body);

  let result: { eventType: string; clientPayload: Record<string, unknown> } | { ignored: true; reason: string };

  if (payload.type === "Issue") {
    result = handleIssueEvent(payload);
  } else if (payload.type === "Comment" && payload.action === "create") {
    result = handleCommentEvent(payload);
  } else {
    return NextResponse.json({ ignored: true, reason: `unhandled event type: ${payload.type}` });
  }

  if ("ignored" in result) {
    return NextResponse.json(result);
  }

  const dispatchResponse = await dispatchToGitHub(result.eventType, result.clientPayload);

  if (!dispatchResponse.ok) {
    const errorText = await dispatchResponse.text();
    console.error("GitHub dispatch failed:", errorText);
    return NextResponse.json(
      { error: "Failed to dispatch to GitHub" },
      { status: 502 },
    );
  }

  return NextResponse.json({ dispatched: true, event_type: result.eventType });
}
