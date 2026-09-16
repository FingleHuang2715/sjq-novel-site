import Link from "next/link";
import { getRecentPosts, getArchives, getCategories } from "@/lib/api";

interface Props { type: "home" | "article" }

export default async function Sidebar({ type }: Props) {
  // Fetch sidebar data in parallel for maximum speed
  const [archives, categories, recent] = await Promise.all([
    getArchives(),
    getCategories(),
    type === "home" ? getRecentPosts(20) : Promise.resolve([]),
  ]);

  return (
    <aside className="sidebar1">
      {type === "home" && (
        <div className="search-box1">
          <div className="s-label1">搜索</div>
          <form className="s-input-wrap1" action="/search" method="get">
            <input type="text" name="q" placeholder="" />
            <button type="submit" className="s-btn1">搜索</button>
          </form>
        </div>
      )}

      {categories.length > 0 && (
        <div className="category-widget1">
          <h3>分类</h3>
          <ul>
            {categories.map(c => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`}>{c.name}（{c.count}）</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {type === "home" && (
        <div className="recent1">
          <h3>近期文章</h3>
          <ul>
            {recent.map(post => (
              <li key={post.id}>
                <Link href={`/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="archive1">
        <h3>归档</h3>
        <ul>
          {archives.map(a => (
            <li key={a.year + a.month}>
              <Link href={`/archive/${a.year}/${a.month}`}>{a.label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}