const WP       = (process.env.WP_URL      || "").replace(/\/$/, "");
const APP_USER =  process.env.WP_APP_USER || "";
const APP_PASS =  process.env.WP_APP_PASS || "";

function authHeader(): Record<string, string> {
  if (APP_USER && APP_PASS) {
    const b64 = Buffer.from(`${APP_USER}:${APP_PASS}`).toString("base64");
    return { Authorization: `Basic ${b64}` };
  }
  return {};
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "invalid body" }, { status: 400 });

  const { postId, authorName, content, parent } = body;

  if (!WP) {
    return Response.json({
      id: Date.now(), post: postId, parent: parent || 0,
      author: 0, author_name: authorName || "匿名",
      date: new Date().toISOString().slice(0, 10),
      content: content, status: "approved",
    });
  }

  const hasAuth = APP_USER && APP_PASS;
  const payload: Record<string, unknown> = {
    post:         postId,
    author_name:  authorName || "匿名",
    author_email: `guest_${Date.now()}@noreply.local`,
    content:      content,
  };
  if (hasAuth) payload.status = "approved";
  if (parent)  payload.parent = parent;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeader(),
  };

  try {
    const url = `${WP}/index.php?rest_route=/wp/v2/comments`;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
    const data = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      console.error("[comment proxy] WP error:", data);
      return Response.json({ error: (data?.message as string) || "提交失败" }, { status: res.status });
    }

    const rendered = (data.content as Record<string,string>)?.rendered;
    return Response.json({
      id:          data.id,
      post:        data.post,
      parent:      (data.parent as number) || 0,
      author:      (data.author as number) || 0,
      author_name: (data.author_name as string) || authorName,
      date:        ((data.date as string) || "").slice(0, 10),
      content:     rendered || content,
      status:      data.status,
    });
  } catch (e) {
    console.error("[comment proxy] error:", e);
    return Response.json({ error: "服务器连接失败" }, { status: 500 });
  }
}