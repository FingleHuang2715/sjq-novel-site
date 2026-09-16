"use client";
import { useState, useEffect } from "react";
import type { Comment } from "@/lib/api";

interface Props {
  postId: number;
  postAuthorId: number;
  initialComments: Comment[];
  isMock: boolean;
}

function fmtDate(d: string) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`;
}

function stripTags(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function CommentSection({ postId, postAuthorId, initialComments, isMock }: Props) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const key = "sjq_uid";
    let nick = localStorage.getItem(key);
    if (!nick) {
      nick = "匿名用户" + (Math.floor(Math.random() * 90000) + 10000);
      localStorage.setItem(key, nick);
    }
    setNickname(nick);
  }, []);

  const saveNickname = () => {
    if (nickname.trim()) localStorage.setItem("sjq_uid", nickname.trim());
  };

  const showMsg = (text: string, error = false) => {
    setMsg(text); setIsError(error);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    saveNickname();

    if (isMock) {
      const fake: Comment = {
        id: Date.now(), post: postId, parent: 0, author: 0,
        author_name: nickname || "匿名",
        date: new Date().toISOString().slice(0, 10),
        content: content.trim(), status: "approved",
      };
      setComments(prev => [...prev, fake]);
      setContent("");
      showMsg("评论已提交（本地预览模式）");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: nickname || "匿名",
          content: content.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const newComment: Comment = {
          id: data.id,
          post: data.post,
          parent: data.parent || 0,
          author: data.author || 0,
          author_name: data.author_name || nickname,
          date: data.date || new Date().toISOString().slice(0, 10),
          content: data.content || content.trim(),
          status: data.status || "hold",
        };
        setComments(prev => [...prev, newComment]);
        setContent("");
        if (data.status === "hold" || data.status === "pending") {
          showMsg("评论已提交，等待博主审核～");
        } else {
          showMsg("评论成功！");
        }
      } else {
        showMsg(data.error || "提交失败，请稍后重试", true);
      }
    } catch {
      showMsg("网络错误，请重试", true);
    } finally {
      setSubmitting(false);
    }
  };

  const topLevel = comments.filter(c => c.parent === 0);
  const getReplies = (parentId: number) => comments.filter(c => c.parent === parentId);

  return (
    <div className="comment-area1" id="comments">
      <h3>评论区</h3>

      {/* 评论表单 */}
      <div className="comment-form1">
        <form onSubmit={handleSubmit}>
          <div className="form-row1">
            <input
              type="text"
              className="cm-name1"
              placeholder="昵称（可修改）"
              value={nickname}
              maxLength={50}
              required
              onChange={e => setNickname(e.target.value)}
              onBlur={saveNickname}
            />
          </div>
          <textarea
            className="cm-content1"
            placeholder="写下你的评论..."
            value={content}
            required
            onChange={e => setContent(e.target.value)}
          />
          <button type="submit" className="cm-submit1" disabled={submitting}>
            {submitting ? "提交中..." : "提交评论"}
          </button>
          {msg && <div className={`cm-msg1${isError ? " error" : ""}`}>{msg}</div>}
        </form>
      </div>

      {/* 评论列表 */}
      {topLevel.length > 0 && (
        <div className="comment-list1">
          {topLevel.map(c => {
            const isBlogger = c.author !== 0 && c.author === postAuthorId;
            const replies = getReplies(c.id);
            const text = c.content || "";
            return (
              <div key={c.id} className="comment-item1">
                <div className="cm-header1">
                  <span className="cm-author1">
                    {c.author_name || "匿名"}
                    {isBlogger && <span className="cm-blogger-tag">博主</span>}
                  </span>
                  <span className="cm-date1">{fmtDate(c.date)}</span>
                </div>
                <div className="cm-text1"
                  dangerouslySetInnerHTML={{
                    __html: text.includes("<") ? text : text.replace(/\n/g, "<br>")
                  }}
                />

                {/* 回复 */}
                {replies.map(r => {
                  const rIsBlogger = r.author !== 0 && r.author === postAuthorId;
                  const rText = r.content || "";
                  const rHtml = rText.includes("<") ? stripTags(rText) : rText;
                  return rIsBlogger ? (
                    <div key={r.id} className="cm-reply1">
                      <span className="cm-reply-label1">博主回复</span>
                      {rHtml}
                    </div>
                  ) : (
                    <div key={r.id} className="comment-sub-item1">
                      <div className="cm-header1">
                        <span className="cm-author1">{r.author_name || "匿名"}</span>
                        <span className="cm-date1">{fmtDate(r.date)}</span>
                      </div>
                      <div className="cm-text1"
                        dangerouslySetInnerHTML={{
                          __html: rText.includes("<") ? rText : rText.replace(/\n/g, "<br>")
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {topLevel.length === 0 && (
        <div style={{ color: "#bbb", fontSize: 13, marginTop: 10 }}>暂无评论，快来留下第一条吧～</div>
      )}
    </div>
  );
}