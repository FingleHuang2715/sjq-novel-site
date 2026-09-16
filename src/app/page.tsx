export const revalidate = 60;

import Link from "next/link";
import { getPosts } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export default async function HomePage() {
  // Fetch all posts to display on a single page without pagination
  const { posts } = await getPosts(1, 100);

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
      </div>
      <Sidebar type="home" />
    </div>
  );
}