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
  content?: { rendered: string };
  author?: number;
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
    title: p.title.rendered, content: p.content?.rendered || "",
    author: p.author || 0, categories: cats,
  };
}

function wpToComment(c: WPComment): Comment {
  return {
    id: c.id, post: c.post, parent: c.parent || 0, author: c.author || 0,
    author_name: c.author_name, date: c.date.slice(0, 10),
    content: c.content?.rendered || (c.content as unknown as string),
    status: c.status,
  };
}

/* ---- High-performance in-memory cache for Cloudflare Worker & Build ---- */
const memCache = new Map<string, { data: unknown; total?: number; totalPages?: number; exp: number }>();

async function fetchCached<T>(
  url: string,
  ttlSec = 300
): Promise<{ data: T | null; total: number; totalPages: number }> {
  const now = Date.now();
  const hit = memCache.get(url);
  if (hit && hit.exp > now) {
    return { data: hit.data as T, total: hit.total || 0, totalPages: hit.totalPages || 1 };
  }

  try {
    const res = await fetch(url, { next: { revalidate: ttlSec } });
    if (!res.ok) return { data: null, total: 0, totalPages: 1 };
    const data = await res.json();
    const total = parseInt(res.headers.get("X-WP-Total") || "0");
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") || "1");
    memCache.set(url, { data, total, totalPages, exp: now + ttlSec * 1000 });
    return { data, total, totalPages };
  } catch {
    return { data: null, total: 0, totalPages: 1 };
  }
}

/* ---- Lightweight slug fetcher for SSG pre-rendering (1.5 KB payload) ---- */
export async function getPostSlugs(): Promise<string[]> {
  if (!WP) return getMockPosts(1, 50).posts.map(p => p.slug);
  const url = wpUrl("/wp/v2/posts", { per_page: 100, _fields: "slug" });
  const { data } = await fetchCached<{ slug: string }[]>(url, 600);
  if (!data) return [];
  return data.map(p => p.slug);
}

/* ---- getPosts (Optimized: excludes full article text to reduce payload 95%) ---- */
export async function getPosts(page = 1, perPage = 20) {
  if (!WP) return getMockPosts(page, perPage);
  const url = wpUrl("/wp/v2/posts", {
    per_page: perPage, page, orderby: "date", order: "desc",
    _fields: "id,slug,date,title,_links,_embedded", _embed: 1
  });
  const { data, total, totalPages } = await fetchCached<WPPost[]>(url, 180);
  if (!data) return getMockPosts(page, perPage);
  return { posts: data.map(wpToPost), total, totalPages };
}

/* ---- getPostBySlug (Fetches full content for single article) ---- */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!WP) return getMockPostBySlug(slug);
  const url = wpUrl("/wp/v2/posts", { slug, _embed: 1 });
  const { data } = await fetchCached<WPPost[]>(url, 600);
  if (!data || !data[0]) return getMockPostBySlug(slug);
  return wpToPost(data[0]);
}

/* ---- getComments ---- */
export async function getComments(postId: number): Promise<Comment[]> {
  if (!WP) return getMockComments(postId);
  const url = wpUrl("/wp/v2/comments", { post: postId, per_page: 100, order: "asc" });
  const { data } = await fetchCached<WPComment[]>(url, 30);
  if (!data) return [];
  return data.map(wpToComment);
}

/* ---- getRecentPosts (Lightweight fields) ---- */
export async function getRecentPosts(count = 20): Promise<Post[]> {
  if (!WP) return getMockPosts(1, count).posts;
  const url = wpUrl("/wp/v2/posts", { per_page: count, orderby: "date", order: "desc", _fields: "id,slug,date,title" });
  const { data } = await fetchCached<WPPost[]>(url, 300);
  if (!data) return getMockPosts(1, count).posts;
  return data.map(wpToPost);
}

/* ---- searchPosts ---- */
export async function searchPosts(q: string): Promise<Post[]> {
  if (!WP) {
    const lower = q.toLowerCase();
    return getMockPosts(1, 50).posts.filter(p => p.title.toLowerCase().includes(lower));
  }
  const url = wpUrl("/wp/v2/posts", { search: q, per_page: 20, _fields: "id,slug,date,title", _embed: 1 });
  const { data } = await fetchCached<WPPost[]>(url, 60);
  if (!data) return [];
  return data.map(wpToPost);
}

/* ---- getCategories ---- */
export async function getCategories(): Promise<Category[]> {
  if (!WP) return [];
  const url = wpUrl("/wp/v2/categories", { per_page: 50, hide_empty: 1 });
  const { data } = await fetchCached<Category[]>(url, 600);
  if (!data) return [];
  return data.filter(c => c.slug !== "uncategorized" || data.length === 1);
}

/* ---- getCategoryPosts ---- */
export async function getCategoryPosts(categoryId: number, page = 1): Promise<{ posts: Post[]; total: number; totalPages: number }> {
  if (!WP) return { posts: [], total: 0, totalPages: 0 };
  const url = wpUrl("/wp/v2/posts", {
    categories: categoryId, per_page: 20, page,
    _fields: "id,slug,date,title,_links,_embedded", _embed: 1
  });
  const { data, total, totalPages } = await fetchCached<WPPost[]>(url, 180);
  if (!data) return { posts: [], total: 0, totalPages: 0 };
  return { posts: data.map(wpToPost), total, totalPages };
}

/* ---- Shared helper to fetch all post IDs and titles for fast index lookup ---- */
async function getAllPostsIndex(): Promise<{ id: number; slug: string; title: string; date: string }[]> {
  const url = wpUrl("/wp/v2/posts", { per_page: 100, _fields: "id,slug,title,date" });
  const { data } = await fetchCached<{ id: number; slug: string; title: { rendered: string }; date: string }[]>(url, 600);
  if (!data) return [];
  return data.map(p => ({ id: p.id, slug: p.slug, title: p.title.rendered, date: p.date }));
}

/* ---- getArchives ---- */
export async function getArchives() {
  if (!WP) return getMockArchives();
  const posts = await getAllPostsIndex();
  if (!posts.length) return getMockArchives();
  const seen = new Set<string>();
  const result: { year: string; month: string; label: string }[] = [];
  posts.forEach(p => {
    const d = new Date(p.date);
    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = y + m;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ year: y, month: m, label: `${y}年${Number(m)}月` });
    }
  });
  return result;
}

/* ---- getArchivePosts ---- */
export async function getArchivePosts(year: string, month: string): Promise<Post[]> {
  const mEnd = new Date(Number(year), Number(month), 0).getDate();
  const after = `${year}-${month}-01T00:00:00`;
  const before = `${year}-${month}-${String(mEnd).padStart(2, "0")}T23:59:59`;
  if (!WP) return getMockPosts(1, 100).posts.filter(p => p.date.startsWith(`${year}-${month}`));
  const url = wpUrl("/wp/v2/posts", {
    per_page: 100, after, before, orderby: "date", order: "asc",
    _fields: "id,slug,date,title", _embed: 1
  });
  const { data } = await fetchCached<WPPost[]>(url, 600);
  if (!data) return [];
  return data.map(wpToPost);
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
  const posts = await getAllPostsIndex();
  const idx = posts.findIndex(p => p.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? { slug: posts[idx - 1].slug, title: posts[idx - 1].title } : null,
    next: idx < posts.length - 1 ? { slug: posts[idx + 1].slug, title: posts[idx + 1].title } : null,
  };
}