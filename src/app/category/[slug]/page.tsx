import Link from "next/link";
import { getCategories, getCategoryPosts } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

export async function generateStaticParams() {
  try {
    const cats = await getCategories();
    return cats.map(c => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const cats = await getCategories();
  const cat = cats.find(c => c.slug === slug);
  const { posts } = cat
    ? await getCategoryPosts(cat.id, 1, 100)
    : { posts: [] };

  return (
    <div className="wrap1">
      <div className="content1">
        <div className="cate-page-title1">分类：{cat?.name || slug}</div>
        {posts.length > 0 ? (
          posts.map(post => {
            const d = new Date(post.date);
            return (
              <div className="post-item1" key={post.id}>
                <div className="title1"><Link href={`/${post.slug}`}>{post.title}</Link></div>
                <div className="meta1"><span>{d.getFullYear()}/{d.getMonth()+1}/{d.getDate()}</span></div>
              </div>
            );
          })
        ) : (
          <div className="no-results1">该分类下暂无文章。</div>
        )}
      </div>
      <Sidebar type="home" />
    </div>
  );
}