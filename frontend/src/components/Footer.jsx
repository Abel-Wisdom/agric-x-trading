
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import "../styles/components/Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">A</span>
              <span className="brand-name">
                AGRIC <strong>X</strong>
                <small>TRADING</small>
              </span>
            </Link>

            <p>
              Cultivating growth through agricultural knowledge,
              research, and sustainable solutions.
            </p>
          </div>

          <div className="footer-links">
            <h3>Explore</h3>
            <Link to="/about">About Us</Link>
            <Link to="/research">Research & Fieldwork</Link>
            <Link to="/services">Our Services</Link>
            <Link to="/insights">Insights</Link>
          </div>

          <div className="footer-links">
            <h3>Get in touch</h3>
            <Link to="/contact">
              Contact Us <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Agric X Trading. All rights reserved.</p>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
