import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-page__topline"><span>BREWLITE</span><span>COFFEE · MADE PERSONAL</span></div>
      <section className="home-page__content">
        <p className="eyebrow">Một khoảng nghỉ, pha theo ý bạn</p>
        <h1>BrewLite<span>.</span></h1>
        <p className="home-page__intro">Cà phê và đồ uống yêu thích, tùy chỉnh vừa gu của bạn.</p>
        <Link className="button button--accent" href="/menu">Khám phá menu <span aria-hidden="true">↗</span></Link>
      </section>
      <div className="home-page__footer"><span>BREW SLOW. LIVE WELL.</span><span>01 — MENU</span></div>
    </main>
  );
}