import {
  getMockPosts, getMockPostBySlug, getMockComments, getMockArchives,
  type Post, type Comment
} from "./mock";

export type { Post, Comment };

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
}

const WP = (process.env.WP_URL || "https://dashboardyeye.maogeo.top").replace(/\/$/, "");

function wpUrl(route: string, params: Record<string, string | number> = {}): string {
  if (!WP) return "";
  const base = new URL(`${WP}/index.php`);
  base.searchParams.set("rest_route", route);
  for (const [k, v] of Object.entries(params)) {
    base.searchParams.set(k, String(v));
  }
  return base.toString();
}

interface WPPost {
  id: number; slug: string; date: string;
  title: { rendered: string };
  content: { rendered: string };
  author: number;
  categories?: number[];
  _embedded?: {
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

interface WPComment {
  id: number; post: number; parent: number; author: number;
  author_name: string; date: string;
  content: { rendered: string }; status: string;
}

function wpToPost(p: WPPost): Post {
  const cats = (p._embedded?.["wp:term"]?.[0] || []).map((c) => ({
    id: c.id, name: c.name, slug: c.slug,
  }));
  return {
    id: p.id, slug: p.slug, date: p.date.slice(0, 10),
    title: p.title.rendered, content: p.content.rendered,
    author: p.author, categories: cats,
  };
}

function wpToComment(c: WPComment): Comment {
  return {
    id: c.id, post: c.post, parent: c.parent || 0, author: c.author || 0,
    author_name: c.author_name, date: c.date.slice(0, 10),
    content: c.content?.rendered || c.content as unknown as string,
    status: c.status,
  };
}

/* ---- getPosts ---- */
export async function getPosts(page = 1, perPage = 20) {
  if (!WP) return getMockPosts(page, perPage);
  try {
    const url = wpUrl("/wp/v2/posts", { per_page: perPage, page, orderby: "date", order: "desc", _embed: 1 });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return getMockPosts(page, perPage);
    const data: WPPost[] = await res.json();
    const total = parseInt(res.headers.get("X-WP-Total") || "0");
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1");
    return { posts: data.map(wpToPost), total, totalPages };
  } catch { return getMockPosts(page, perPage); }
}

/* ---- getPostBySlug ---- */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!WP) return getMockPostBySlug(slug);
  try {
    const url = wpUrl("/wp/v2/posts", { slug, _embed: 1 });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return getMockPostBySlug(slug);
    const data: WPPost[] = await res.json();
    return data[0] ? wpToPost(data[0]) : null;
  } catch { return getMockPostBySlug(slug); }
}

/* ---- getComments ---- */
export async function getComments(postId: number): Promise<Comment[]> {
  if (!WP) return getMockComments(postId);
  try {
    const url = wpUrl("/wp/v2/comments", { post: postId, per_page: 100, order: "asc" });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data: WPComment[] = await res.json();
    return data.map(wpToComment);
  } catch { return []; }
}

/* ---- getRecentPosts ---- */
export async function getRecentPosts(count = 20): Promise<Post[]> {
  if (!WP) return getMockPosts(1, count).posts;
  try {
    const url = wpUrl("/wp/v2/posts", { per_page: count, orderby: "date", order: "desc" });
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return getMockPosts(1, count).posts;
    const data: WPPost[] = await res.json();
    return data.map(wpToPost);
  } catch { return getMockPosts(1, count).posts; }
}

/* ---- searchPosts ---- */
export async function searchPosts(q: string): Promise<Post[]> {
  if (!WP) {
    const lower = q.toLowerCase();
    return getMockPosts(1, 50).posts.filter(p => p.title.toLowerCase().includes(lower));
  }
  try {
    const url = wpUrl("/wp/v2/posts", { search: q, per_page: 20, _embed: 1 });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data: WPPost[] = await res.json();
    return data.map(wpToPost);
  } catch { return []; }
}

/* ---- getCategories ---- */
export async function getCategories(): Promise<Category[]> {
  if (!WP) return [];
  try {
    const url = wpUrl("/wp/v2/categories", { per_page: 50, hide_empty: 1 });
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data: Category[] = await res.json();
    return data.filter(c => c.slug !== "uncategorized" || data.length === 1);
  } catch { return []; }
}

/* ---- getCategoryPosts ---- */
export async function getCategoryPosts(categoryId: number, page = 1): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  if (!WP) return { posts: [], total: 0, totalPages: 0 };
  try {
    const url = wpUrl("/wp/v2/posts", { categories: categoryId, per_page: 20, page, _embed: 1 });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { posts: [], total: 0, totalPages: 0 };
    const data: WPPost[] = await res.json();
    const total = parseInt(res.headers.get("X-WP-Total") || "0");
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1");
    return { posts: data.map(wpToPost), total, totalPages };
  } catch { return { posts: [], total: 0, totalPages: 0 }; }
}

/* ---- getArchives ---- */
export async function getArchives() {
  if (!WP) return getMockArchives();
  try {
    const url = wpUrl("/wp/v2/posts", { per_page: 100, _fields: "date" });
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return getMockArchives();
    const data: WPPost[] = await res.json();
    const seen = new Set<string>();
    const result: { year: string; month: string; label: string }[] = [];
    data.forEach(p => {
      const d = new Date(p.date);
      const y = String(d.getFullYear()); const m = String(d.getMonth() + 1).padStart(2, "0");
      const key = y + m;
      if (!seen.has(key)) { seen.add(key); result.push({ year: y, month: m, label: `${y}年${Number(m)}月` }); }
    });
    return result;
  } catch { return getMockArchives(); }
}

/* ---- getArchivePosts ---- */
export async function getArchivePosts(year: string, month: string): Promise<Post[]> {
  const mEnd = new Date(Number(year), Number(month), 0).getDate();
  const after = `${year}-${month}-01T00:00:00`;
  const before = `${year}-${month}-${String(mEnd).padStart(2, "0")}T23:59:59`;
  if (!WP) return getMockPosts(1, 100).posts.filter(p => p.date.startsWith(`${year}-${month}`));
  try {
    const url = wpUrl("/wp/v2/posts", { per_page: 100, after, before, orderby: "date", order: "asc", _embed: 1 });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data: WPPost[] = await res.json();
    return data.map(wpToPost);
  } catch { return []; }
}
/* ---- getAdjacentPosts ---- */
export async function getAdjacentPosts(currentId: number): Promise<{
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}> {
  if (!WP) {
    const mock = getMockPosts(1, 50).posts;
    const idx = mock.findIndex(p => p.id === currentId);
    return {
      prev: idx > 0 ? { slug: mock[idx - 1].slug, title: mock[idx - 1].title } : null,
      next: idx >= 0 && idx < mock.length - 1 ? { slug: mock[idx + 1].slug, title: mock[idx + 1].title } : null,
    };
  }
  try {
    const url = wpUrl("/wp/v2/posts", { per_page: 100, _fields: "id,slug,title" });
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return { prev: null, next: null };
    const posts: { id: number; slug: string; title: { rendered: string } }[] = await res.json();
    const idx = posts.findIndex(p => p.id === currentId);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? { slug: posts[idx - 1].slug, title: posts[idx - 1].title.rendered } : null,
      next: idx < posts.length - 1 ? { slug: posts[idx + 1].slug, title: posts[idx + 1].title.rendered } : null,
    };
  } catch { return { prev: null, next: null }; }
}