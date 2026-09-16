import Link from "next/link";
import { getRecentPosts, getArchives, getCategories } from "@/lib/api";

interface Props { type: "home" | "article" }

export default async function Sidebar({ type }: Props) {
  const archives = await getArchives();
  const categories = await getCategories();

  if (type === "article") {
    return (
      <aside className="sidebar1">
        {categories.length > 0 && (
          <div className="category-widget1">
            <h3>分类</h3>
            <ul>
              {categories.map(c => (
                <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}（{c.count}）</Link></li>
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

  const recent = await getRecentPosts(20);
  return (
    <aside className="sidebar1">
      <div className="search-box1">
        <div className="s-label1">搜索</div>
        <form className="s-input-wrap1" action="/search" method="get">
          <input type="text" name="q" placeholder="" />
          <button type="submit" className="s-btn1">搜索</button>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="category-widget1">
          <h3>分类</h3>
          <ul>
            {categories.map(c => (
              <li key={c.id}><Link href={`/category/${c.slug}`}>{c.name}（{c.count}）</Link></li>
            ))}
          </ul>
        </div>
      )}

      <div className="recent1">
        <h3>近期文章</h3>
        <ul>
          {recent.map(p => (
            <li key={p.id}><Link href={`/${p.slug}`}>{p.title}</Link></li>
          ))}
        </ul>
      </div>
    </aside>
  );
}