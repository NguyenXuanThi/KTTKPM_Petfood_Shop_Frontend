import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-lg">
                🐾
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Paw<span className="text-amber-500">Mart</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t("pawmart.footer.tagline")}
            </p>
            <div className="mt-4 flex gap-3">
              {["🐦", "📘", "📸"].map((icon, i) => (
                <button
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-lg transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-gray-700 dark:hover:border-amber-600 dark:hover:bg-amber-900/20"
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              {t("pawmart.footer.quickLinks")}
            </h4>
            <ul className="space-y-2">
              {[
                { to: "/", label: t("pawmart.nav.home") },
                { to: "/products", label: t("pawmart.footer.allProducts") },
                { to: "/cart", label: t("pawmart.footer.myCart") },
                { to: "/wishlist", label: t("pawmart.footer.wishlist") },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-gray-500 transition-colors hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              {t("pawmart.footer.categories")}
            </h4>
            <ul className="space-y-2">
              {[
                { query: "Dog Food", label: t("pawmart.footer.dogFood") },
                { query: "Cat Food", label: t("pawmart.footer.catFood") },
                { query: "Bird Food", label: t("pawmart.footer.birdFood") },
                { query: "Fish Food", label: t("pawmart.footer.fishFood") },
                { query: "Treats & Snacks", label: t("pawmart.footer.treats") },
              ].map((cat) => (
                <li key={cat.query}>
                  <Link
                    to={`/search?q=${encodeURIComponent(cat.query)}`}
                    className="text-sm text-gray-500 transition-colors hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-semibold text-gray-900 dark:text-white">
              {t("pawmart.footer.contact")}
            </h4>
            <ul className="space-y-3">
              {[
                { icon: <Mail size={14} />, text: "vupro0211@gmail.com" },
                { icon: <Phone size={14} />, text: "0338975317" },
                { icon: <Phone size={14} />, text: "0902926344" },
                {
                  icon: <MapPin size={14} />,
                  text: t("pawmart.footer.location"),
                },
              ].map(({ icon, text }, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <span className="text-amber-500">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-gray-100 pt-6 text-center dark:border-gray-800 md:flex-row">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} PawMart. {t("pawmart.footer.rights")}
          </p>
          <p className="flex items-center gap-1 text-xs text-gray-400">
            {t("pawmart.footer.madeWith")}{" "}
            <Heart size={12} className="text-red-400" fill="currentColor" />{" "}
            {t("pawmart.footer.forPets")}
          </p>
        </div>
      </div>
    </footer>
  );
}
