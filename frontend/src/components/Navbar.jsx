import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, ArrowRight, Sprout } from "lucide-react";
import { prefetchRoute } from "../utils/routePrefetch";
import "../styles/components/Navbar.css";

const navItems = [
  { label: "Home", path: "/" },
  { label: "About Us", path: "/about" },
  { label: "Research & Fieldwork", path: "/research" },
  { label: "Our Services", path: "/services" },
  { label: "Insights", path: "/insights" },
  { label: "Contact Us", path: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handlePrefetch = (path) => {
    prefetchRoute(path);
  };

  return (
    <header className="site-header">
      <div className="container navbar">
        <Link
          to="/"
          className="brand"
          onClick={closeMenu}
          onMouseEnter={() => handlePrefetch("/")}
          onFocus={() => handlePrefetch("/")}
          onTouchStart={() => handlePrefetch("/")}
        >
          <span className="brand-icon">
            <Sprout size={25} />
          </span>

          <span className="brand-name">
            AGRIC <strong>X</strong>
            <small>TRADING</small>
          </span>
        </Link>

        <button
          className="mobile-menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={closeMenu}
              onMouseEnter={() => handlePrefetch(item.path)}
              onFocus={() => handlePrefetch(item.path)}
              onTouchStart={() => handlePrefetch(item.path)}
            >
              {item.label}
            </NavLink>
          ))}

          <Link
            to="/contact"
            className="nav-cta"
            onClick={closeMenu}
            onMouseEnter={() => handlePrefetch("/contact")}
            onFocus={() => handlePrefetch("/contact")}
            onTouchStart={() => handlePrefetch("/contact")}
          >
            Get in Touch <ArrowRight size={16} />
          </Link>
        </nav>
      </div>
    </header>
  );
}