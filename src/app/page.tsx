export const revalidate = 60;

import Link from "next/link";
import { getPosts } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default async function HomePage(props: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageStr } = await props.searchParams;
  const page = Number(pageStr) || 1;
  const { posts, totalPages } = await getPosts(page, 20);

  return (
    <div className="wrap1">
      <div className="content1">
        {posts.map(post => {
          const d = new Date(post.date);
          const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
          return (
            <div className="post-item1" key={post.id}>
              <div className="title1">
                <Link href={`/${post.slug}`}>{post.title}</Link>
              </div>
              <div className="meta1">
                <span>{dateStr}</span>
                {post.categories?.filter(c => c.slug !== "uncategorized").map(c => (
                  <Link key={c.id} href={`/category/${c.slug}`} className="cat-tag1">{c.name}</Link>
                ))}
              </div>
            </div>
          );
        })}
        {totalPages > 1 && (
          <div className="pagination1">
            {page > 1 && <Link href={`/?page=${page - 1}`}>上一页</Link>}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <span key={p} className={p === page ? "current" : undefined}>
                {p === page ? p : <Link href={`/?page=${p}`}>{p}</Link>}
              </span>
            ))}
            {page < totalPages && <Link href={`/?page=${page + 1}`}>下一页</Link>}
          </div>
        )}
      </div>
      <Sidebar type="home" />
    </div>
  );
}