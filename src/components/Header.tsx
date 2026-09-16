"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/search?q=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setQ(""); }
  };

  return (
    <>
      <header className="header1">
        <div className="logo1"><Link href="/">沈见青×李遇泽</Link></div>
        <div className="header-right1">
          <div className="search-btn1" onClick={() => setSearchOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="hamburger1" onClick={() => setMenuOpen(v => !v)}>
            <span /><span /><span />
          </div>
        </div>
      </header>

      <nav className={`mobile-nav1${menuOpen ? " show1" : ""}`}>
        <Link href="/" onClick={() => setMenuOpen(false)}>首页</Link>
        <Link href="/search" onClick={() => setMenuOpen(false)}>搜索</Link>
      </nav>

      {searchOpen && (
        <div className="search-overlay1" onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}>
          <form className="search-inner1" onSubmit={handleSearch}>
            <input
              type="text" placeholder="搜索文章..." autoFocus
              value={q} onChange={e => setQ(e.target.value)}
            />
            <button type="submit" className="s-icon1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="20" height="20">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
