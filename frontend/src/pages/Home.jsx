
import {
  ArrowRight,
  Sprout,
  FlaskConical,
  GraduationCap,
  Leaf,
  MapPin,
  Mail,
  Phone,
  Microscope,
  ChevronRight,
  Handshake,
} from "lucide-react";
import "../styles/pages/Home.css";


const services = [
  {
    number: "01",
    icon: FlaskConical,
    title: "Agricultural Research",
    description:
      "Exploring agricultural challenges, investigating farming practices, and developing practical knowledge through research and field observations.",
  },
  {
    number: "02",
    icon: Handshake,
    title: "Agricultural Consultation",
    description:
      "Providing informed agricultural guidance and practical support to farmers, businesses, and other agricultural stakeholders.",
  },
  {
    number: "03",
    icon: GraduationCap,
    title: "Training & Education",
    description:
      "Sharing agricultural knowledge through training, educational programmes, workshops, and practical learning opportunities.",
  },
  {
    number: "04",
    icon: Leaf,
    title: "Agricultural Inputs",
    description:
      "Supporting agricultural production through relevant inputs and solutions for farming activities.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero" id="home">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow">
              <span />
              RESEARCH · KNOWLEDGE · AGRICULTURE
            </div>

            <h1>
              Advancing Agriculture.
              <br />
              <span>Growing Possibilities.</span>
            </h1>

            <p>
              Combining agricultural knowledge, professional experience,
              research, and practical solutions to support a more informed
              and sustainable agricultural future.
            </p>

            <div className="hero-actions">
              <a href="/research" className="button button-primary">
                Explore Our Research <ArrowRight size={18} />
              </a>
              <a href="/about" className="button button-outline">
                Discover Agric X
              </a>
            </div>

            <div className="hero-note">
              <Sprout size={18} />
              Knowledge-driven agricultural development
            </div>
          </div>
        </div>

        <div className="hero-bottom container">
          <span>AGRICULTURE THROUGH RESEARCH AND EXPERIENCE</span>
          <span>01 / 04</span>
        </div>
      </section>

      <section className="intro-section section-padding" id="about">
        <div className="container intro-grid">
          <div>
            <div className="eyebrow">
              <span />
              WHO WE ARE
            </div>
            <h2 className="section-heading">
              Knowledge that meets the realities of agriculture.
            </h2>
          </div>

          <div className="intro-copy">
            <p>
              Agric X Trading is focused on agricultural development through
              professional knowledge, practical experience, research,
              consultation, and farmer education.
            </p>
            <p>
              We recognize that meaningful agricultural progress begins
              with understanding the people, practices, environments, and
              challenges that shape farming communities.
            </p>
            <a href="/about" className="text-link">
              Learn more about us <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <section className="principles-section section-padding">
        <div className="container">
          <div className="section-topline">
            <div className="eyebrow">
              <span />
              OUR FOUNDATION
            </div>
            <span className="section-index">01 — OUR PRINCIPLES</span>
          </div>

          <h2 className="section-heading">
            Guided by purpose.
            <br />
            Driven by knowledge.
          </h2>

          <div className="principles-grid">
            <article className="principle-card">
              <span>01</span>
              <h3>Our Mission</h3>
              <p>
                To empower farmers through sustainable solutions, quality
                agricultural products, and knowledge that supports
                agricultural development.
              </p>
            </article>

            <article className="principle-card">
              <span>02</span>
              <h3>Our Vision</h3>
              <p>
                To contribute to an innovative, sustainable, and
                farmer-focused agricultural future.
              </p>
            </article>

            <article className="principle-card">
              <span>03</span>
              <h3>Our Values</h3>
              <p>
                Integrity, sustainability, innovation, and community guide
                our approach to agricultural development.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="research-section section-padding" id="research">
        <div className="container research-grid">
          <div className="research-image">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=85"
              alt="Agricultural landscape with cultivated farmland"
            />
            <div className="image-caption">
              <Microscope size={19} />
              <span>Research informed by field experience</span>
            </div>
          </div>

          <div className="research-copy">
            <div className="eyebrow">
              <span />
              RESEARCH & FIELDWORK
            </div>
            <h2 className="section-heading">
              Understanding agriculture beyond the surface.
            </h2>
            <p>
              Agricultural progress requires more than assumptions. It
              requires investigation, observation, learning, and a deeper
              understanding of the conditions farmers face.
            </p>
            <p>
              Our research and fieldwork section will showcase documented
              investigations, agricultural reports, field observations,
              and practical knowledge from agricultural environments.
            </p>
            <a href="/research" className="button button-dark">
              Explore Fieldwork <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="services-section section-padding" id="services">
        <div className="container">
          <div className="section-topline">
            <div className="eyebrow">
              <span />
              WHAT WE DO
            </div>
            <span className="section-index">02 — OUR CAPABILITIES</span>
          </div>

          <div className="services-heading-row">
            <h2 className="section-heading">
              Supporting agriculture
              <br />
              at every stage.
            </h2>
            <p>
              Bringing together knowledge, professional guidance, and
              agricultural solutions to support farmers and stakeholders.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article className="service-card" key={service.number}>
                  <div className="service-card-top">
                    <span>{service.number}</span>
                    <Icon size={27} strokeWidth={1.6} />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <a
                    href="/services"
                    aria-label={`Learn about ${service.title}`}
                  >
                    <ChevronRight size={20} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="insights-section section-padding" id="insights">
        <div className="container insights-content">
          <div className="eyebrow">
            <span />
            KNOWLEDGE SHARING
          </div>
          <h2 className="section-heading">
            Research, ideas, and knowledge
            <br />
            worth sharing.
          </h2>
          <p>
            Explore agricultural articles, field reports, farming guides,
            educational resources, and practical insights.
          </p>
          <a href="/insights" className="button button-primary">
            Discover Our Insights <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="contact-section section-padding" id="contact">
        <div className="container contact-grid">
          <div>
            <div className="eyebrow">
              <span />
              LET'S CONNECT
            </div>
            <h2 className="section-heading">
              Let's work towards a better agricultural future.
            </h2>
            <p>
              Have an agricultural enquiry, consultation request, or
              partnership opportunity? We'd be glad to hear from you.
            </p>
          </div>

          <div className="contact-panel">
            <div className="contact-item">
              <span><Mail size={20} /></span>
              <div>
                <small>EMAIL</small>
                <p>Company email to be confirmed</p>
              </div>
            </div>
            <div className="contact-item">
              <span><Phone size={20} /></span>
              <div>
                <small>PHONE</small>
                <p>Company phone number to be confirmed</p>
              </div>
            </div>
            <div className="contact-item">
              <span><MapPin size={20} /></span>
              <div>
                <small>LOCATION</small>
                <p>Company address to be confirmed</p>
              </div>
            </div>
            <a href="/contact" className="button button-primary contact-button">
              Contact Agric X <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
