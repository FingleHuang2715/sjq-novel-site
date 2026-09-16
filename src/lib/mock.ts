export interface Post {
  id: number; slug: string; date: string; title: string; content: string; author: number;
  categories: { id: number; name: string; slug: string }[];
}
export interface Comment {
  id: number; post: number; parent: number; author: number;
  author_name: string; date: string; content: string; status: string;
}

export const MOCK_POSTS: Post[] = [
  { id: 1, slug: "shi-shui-hai-le-qing-niang-niang-11", date: "2026-09-13",
    title: "是谁害了青娘娘！11", author: 1,
    categories: [{ id: 1, name: "未分类", slug: "uncategorized" }],
    content: `<p style="text-indent:2em">第十一章</p><p style="text-indent:2em">有句话说得好，不是一家人，不进一家门。虽然这句话说出来被沈见青听到，他一定会不高兴，但是李遇泽还是很不适时地想到这个。</p><p style="text-indent:2em">沈见青和皖萤再怎么说也有一点点血缘关系，表哥已经靠自己的手段爬到贵妃的位置上，表妹自然不是什么省油的灯。</p><p style="text-indent:2em">李遇泽忍不住抬手揉了揉太阳穴。</p>` },
  { id: 2, slug: "ren-mian-he-hua-xiang-ying-hong", date: "2026-08-26",
    title: "人面荷花相映红", author: 1,
    categories: [{ id: 1, name: "未分类", slug: "uncategorized" }],
    content: `<p style="text-indent:2em">荷花盛开的季节，沈见青坐在湖边，看着水面上的倒影发呆。</p><p style="text-indent:2em">李遇泽悄悄走过来，在他身边坐下，两人就这样静静地看着荷花。</p>` },
  { id: 3, slug: "shi-shui-hai-le-qing-niang-niang-10", date: "2026-08-25",
    title: "是谁害了青娘娘！10", author: 1,
    categories: [{ id: 1, name: "未分类", slug: "uncategorized" }],
    content: `<p style="text-indent:2em">第十章</p><p style="text-indent:2em">这一天，养心殿里来了一位不速之客。</p>` },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 1, post: 1, parent: 0, author: 0, author_name: "匿名用户12345", date: "2026-09-14", content: "辅导员泽调和寝室矛盾来的～蛊虫阵营迎来史诗级加强！", status: "approved" },
  { id: 2, post: 1, parent: 1, author: 1, author_name: "博主", date: "2026-09-14", content: "哈哈哈哈没错就是这个感觉！", status: "approved" },
];

export function getMockPosts(page = 1, perPage = 20) {
  const start = (page - 1) * perPage;
  const slice = MOCK_POSTS.slice(start, start + perPage);
  return { posts: slice, total: MOCK_POSTS.length, totalPages: Math.ceil(MOCK_POSTS.length / perPage) };
}
export function getMockPostBySlug(slug: string) { return MOCK_POSTS.find(p => p.slug === slug) ?? null; }
export function getMockComments(postId: number) { return MOCK_COMMENTS.filter(c => c.post === postId); }
export function getMockArchives() {
  const seen = new Set<string>(); const result: { year: string; month: string; label: string }[] = [];
  MOCK_POSTS.forEach(p => {
    const d = new Date(p.date); const y = String(d.getFullYear()); const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = y + m;
    if (!seen.has(key)) { seen.add(key); result.push({ year: y, month: m, label: `${y}年${Number(m)}月` }); }
  });
  return result;
}