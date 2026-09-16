import { searchPosts } from "@/lib/api";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await props.searchParams;
  const results = q ? await searchPosts(q) : [];
  return (
    <div className="wrap1">
      <div className="content1">
        <div className="search-header1">
          {q ? `"${q}" 的搜索结果（${results.length} 篇）` : "请输入搜索关键词"}
        </div>
        {results.length > 0 ? results.map(post => {
          const d = new Date(post.date);
          return (
            <div className="post-item1" key={post.id}>
              <div className="title1"><Link href={`/${post.slug}`}>{post.title}</Link></div>
              <div className="meta1"><span>{d.getFullYear()}/{d.getMonth()+1}/{d.getDate()}</span></div>
            </div>
          );
        }) : q ? <div className="no-results1">没有找到相关文章。</div> : null}
      </div>
      <Sidebar type="home" />
    </div>
  );
}