import { Link } from "react-router-dom";
import { ArrowRight, HeartHandshake, ShieldCheck, Star, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/Button";
import { HomeRewardSection } from "@/components/rewards/HomeRewardSection";
import { RecommendationSection } from "@/components/recommendations/RecommendationSection";

export default function HomePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useProducts({
    limit: 8,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const featured = data?.items ?? [];

  const HERO_CATEGORIES = [
    { emoji: "🐕", label: t("pawmart.shopByPet.dogs", "Dogs"), color: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800" },
    { emoji: "🐈", label: t("pawmart.shopByPet.cats", "Cats"), color: "bg-teal-50 dark:bg-teal-900/20", border: "border-teal-200 dark:border-teal-800" },
    { emoji: "🐦", label: t("pawmart.shopByPet.birds", "Birds"), color: "bg-sky-50 dark:bg-sky-900/20", border: "border-sky-200 dark:border-sky-800" },
    { emoji: "🐠", label: t("pawmart.shopByPet.fish", "Fish"), color: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800" },
    { emoji: "🐹", label: t("pawmart.shopByPet.smallPets", "Small Pets"), color: "bg-rose-50 dark:bg-rose-900/20", border: "border-rose-200 dark:border-rose-800" },
    { emoji: "🐇", label: t("pawmart.shopByPet.rabbits", "Rabbits"), color: "bg-green-50 dark:bg-green-900/20", border: "border-green-200 dark:border-green-800" },
  ];

  const FEATURES = [
    { icon: <Truck size={22} />, title: t("pawmart.features.freeShipping"), desc: t("pawmart.features.freeShippingDesc") },
    { icon: <ShieldCheck size={22} />, title: t("pawmart.features.quality"), desc: t("pawmart.features.qualityDesc") },
    { icon: <Star size={22} />, title: t("pawmart.features.topRated"), desc: t("pawmart.features.topRatedDesc") },
    { icon: <HeartHandshake size={22} />, title: t("pawmart.features.support"), desc: t("pawmart.features.supportDesc") },
  ];

  return (
    <div className="space-y-16 pb-16">
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwYzktOS45NDAgMTggOC4wNiAxOCAxOGgtMnptMCAyNGMwIDkuOTQtOC4wNiAxOC0xOCAxOHYtMmM4LjgyMiAwIDE2LTcuMTc4IDE2LTE2aDJ6IiBmaWxsPSIjZjU5ZTBiIiBmaWxsLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {t("pawmart.hero.badge")}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
                {t("pawmart.hero.title1")}
                <br />
                <span className="text-amber-500">{t("pawmart.hero.title2")}</span>{" "}
                {t("pawmart.hero.titleHighlight")}
              </h1>
              <p className="max-w-md text-lg text-gray-600 dark:text-gray-400">{t("pawmart.hero.subtitle")}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/products"><Button size="lg">{t("pawmart.hero.shopNow")} <ArrowRight size={16} /></Button></Link>
                <Link to="/search?q=featured"><Button size="lg" variant="outline">{t("pawmart.hero.browseCategories")}</Button></Link>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="text-center"><div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div><div className="text-xs text-gray-500">{t("pawmart.hero.products")}</div></div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="text-center"><div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div><div className="text-xs text-gray-500">{t("pawmart.hero.happyPets")}</div></div>
                <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                <div className="text-center"><div className="text-2xl font-bold text-gray-900 dark:text-white">4.9★</div><div className="text-xs text-gray-500">{t("pawmart.hero.avgRating")}</div></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:block">
              <div className="relative h-96 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-200 to-orange-300 shadow-2xl dark:from-amber-900/50 dark:to-orange-900/50">
                <img src="/banner.jpg" alt="Happy pets" className="h-full w-full object-cover mix-blend-overlay opacity-80" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="absolute inset-0 flex items-center justify-center text-8xl">🐾</div>
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 3 }} className="absolute bottom-6 left-6 rounded-2xl bg-white/95 p-4 shadow-lg dark:bg-gray-900/95">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🐕</div>
                    <div><div className="text-xs font-bold text-gray-900 dark:text-white">{t("pawmart.hero.premiumDogFood")}</div><div className="text-xs text-amber-500">{t("pawmart.hero.from")} 89,000₫</div></div>
                  </div>
                </motion.div>
                <motion.div animate={{ y: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 3, delay: 1 }} className="absolute right-6 top-6 rounded-2xl bg-white/95 p-4 shadow-lg dark:bg-gray-900/95">
                  <div className="text-center"><div className="text-lg font-bold text-amber-500">{t("pawmart.hero.freeShipping")}</div><div className="text-xs text-gray-600 dark:text-gray-400">{t("pawmart.hero.freeShippingDesc")}</div></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <HomeRewardSection />

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{t("pawmart.shopByPet.title")}</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">{t("pawmart.shopByPet.subtitle")}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {HERO_CATEGORIES.map((cat, i) => (
            <motion.div key={cat.label} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
              <Link to={`/search?q=${encodeURIComponent(cat.label)}`} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:-translate-y-1 hover:shadow-md ${cat.color} ${cat.border}`}>
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">{f.icon}</div>
                <div><div className="font-semibold text-gray-900 dark:text-white">{f.title}</div><div className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</div></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <RecommendationSection />

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div><h2 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">{t("pawmart.newArrivals.title")}</h2><p className="mt-1 text-gray-500 dark:text-gray-400">{t("pawmart.newArrivals.subtitle")}</p></div>
          <Link to="/products"><Button variant="outline" size="sm">{t("pawmart.newArrivals.viewAll")} <ArrowRight size={14} /></Button></Link>
        </div>
        <ProductGrid products={featured} isLoading={isLoading} skeletonCount={8} />
      </section>

      <section className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white shadow-2xl md:p-12">
          <div className="relative z-10 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div><h3 className="text-2xl font-bold md:text-3xl">{t("pawmart.cta.title")}</h3><p className="mt-1 text-amber-100">{t("pawmart.cta.subtitle")} <span className="font-bold text-white">PAWMART15</span> {t("pawmart.cta.subtitleEnd")}</p></div>
            <Link to="/products"><Button variant="secondary" size="lg" className="bg-white text-amber-600 hover:bg-amber-50 hover:text-amber-700">{t("pawmart.cta.shopNow")} <ArrowRight size={16} /></Button></Link>
          </div>
          <div className="absolute -right-8 -top-8 select-none text-[120px] opacity-10">🐾</div>
          <div className="absolute -bottom-6 -left-4 select-none text-[100px] opacity-10">🐾</div>
        </div>
      </section>
    </div>
  );
}
