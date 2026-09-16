import { getArchivePosts } from "@/lib/api";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default async function ArchivePage(props: { params: Promise<{ year: string; month: string }> }) {
  const { year, month } = await props.params;
  const posts = await getArchivePosts(year, month);
  return (
    <div className="wrap1">
      <div className="content1">
        <div className="cate-page-title1">{year}年{Number(month)}月 归档</div>
        {posts.length > 0 ? posts.map(post => {
          const d = new Date(post.date);
          return (
            <div className="post-item1" key={post.id}>
              <div className="title1"><Link href={`/${post.slug}`}>{post.title}</Link></div>
              <div className="meta1"><span>{d.getFullYear()}/{d.getMonth()+1}/{d.getDate()}</span></div>
            </div>
          );
        }) : <div className="no-results1">该月份暂无文章。</div>}
      </div>
      <Sidebar type="article" />
    </div>
  );
}