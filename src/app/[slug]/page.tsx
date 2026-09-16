import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPostSlugs, getComments, getAdjacentPosts } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import CommentSection from "@/components/CommentSection";

// Cache at edge, revalidate in background every 10 minutes
export const revalidate = 600;

// Pre-render all posts as static HTML on Cloudflare edge CDN
export async function generateStaticParams() {
  try {
    const slugs = await getPostSlugs(); return slugs.map((slug: string) => ({ slug }));
    
  } catch {
    return [];
  }
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "文章不存在" };
  return { title: post.title };
}

export default async function ArticlePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Fetch comments and adjacent navigation in parallel
  const [comments, adjacent] = await Promise.all([
    getComments(post.id),
    getAdjacentPosts(post.id),
  ]);

  const d = new Date(post.date);
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const cats = (post.categories || []).filter(c => c.slug !== "uncategorized");

  return (
    <div className="wrap1">
      <div className="content1">
        <div className="breadcrumb1">
          <Link href="/">首页</Link>
          {cats.length > 0 && <> / <Link href={`/category/${cats[0].slug}`}>{cats[0].name}</Link></>}
          {" / 正文"}
        </div>

        <h1 className="article-title1">{post.title}</h1>

        <div className="article-meta1">
          <span>{dateStr}</span>
          {cats.map(c => (
            <Link key={c.id} href={`/category/${c.slug}`} className="cat-tag1">{c.name}</Link>
          ))}
        </div>

        <div className="article-body1" dangerouslySetInnerHTML={{ __html: post.content }} />

        <div className="article-nav1">
          {adjacent.prev ? (
            <Link href={`/${adjacent.prev.slug}`} className="nav-prev1">
              <span className="nav-label1">← 上一篇</span>
              <span className="nav-title1">{adjacent.prev.title}</span>
            </Link>
          ) : <div />}
          {adjacent.next ? (
            <Link href={`/${adjacent.next.slug}`} className="nav-next1">
              <span className="nav-label1">下一篇 →</span>
              <span className="nav-title1">{adjacent.next.title}</span>
            </Link>
          ) : <div />}
        </div>

        <CommentSection
          postId={post.id}
          postAuthorId={post.author}
          initialComments={comments}
          isMock={false}
        />
      </div>
      <Sidebar type="article" />
    </div>
  );
}