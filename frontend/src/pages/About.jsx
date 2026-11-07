
import {
  Target,
  Eye,
  ShieldCheck,
  Leaf,
  Lightbulb,
  Users,
  Microscope,
  GraduationCap,
  ArrowUpRight,
} from "lucide-react";
import "../styles/pages/About.css";

const values = [
  {
    icon: ShieldCheck,
    title: "Integrity",
    description:
      "We believe in conducting business with honesty, transparency, and ethical practices.",
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "We promote responsible agricultural practices that support long-term environmental and economic well-being.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We embrace new ideas, research, and practical approaches to address agricultural challenges.",
  },
  {
    icon: Users,
    title: "Community",
    description:
      "We value collaboration and the relationships that connect farmers, partners, and agricultural communities.",
  },
];

const focusAreas = [
  {
    icon: Microscope,
    title: "Research & Fieldwork",
    description:
      "Investigating agricultural conditions and learning from practical experiences in different farming environments.",
  },
  {
    icon: Target,
    title: "Agricultural Consultation",
    description:
      "Providing agricultural guidance and consultation informed by professional knowledge and field experience.",
  },
  {
    icon: GraduationCap,
    title: "Training & Education",
    description:
      "Supporting knowledge sharing, farmer education, and the development of practical agricultural skills.",
  },
  {
    icon: Leaf,
    title: "Agricultural Inputs",
    description:
      "Supporting access to agricultural inputs as part of a broader approach to agricultural development.",
  },
];

export default function About() {
  return (
    <div className="inner-page about-page">
      <section className="about-intro section-padding">
        <div className="container about-intro-grid">
          <div>
            <span className="eyebrow">ABOUT AGRIC X TRADING</span>
            <h1 className="section-heading">
              Understanding agriculture beyond the surface.
            </h1>
          </div>

          <div className="about-intro-copy">
            <p>
              Agriculture is shaped by different environments, farming
              practices, resources, and local challenges. Understanding
              these realities requires more than assumptions. It requires
              research, observation, engagement, and continuous learning.
            </p>
            <p>
              Agric X Trading brings together agricultural knowledge,
              practical field experience, consultation, training, and
              agricultural inputs to support progress across the agricultural
              sector.
            </p>
          </div>
        </div>
      </section>

      <section className="about-purpose section-padding">
        <div className="container purpose-grid">
          <article className="purpose-card">
            <div className="purpose-icon">
              <Target size={25} />
            </div>
            <span className="eyebrow">OUR MISSION</span>
            <h2>Empowering farmers and connecting opportunities.</h2>
            <p>
              To empower farmers with sustainable solutions and connect
              quality agricultural products to markets worldwide, bridging
              the gap between cultivation and consumption.
            </p>
          </article>

          <article className="purpose-card purpose-card-highlight">
            <div className="purpose-icon">
              <Eye size={25} />
            </div>
            <span className="eyebrow">OUR VISION</span>
            <h2>A more innovative and sustainable agricultural future.</h2>
            <p>
              To become a leading agricultural trading company recognized
              for innovation, sustainability, and farmer empowerment.
            </p>
          </article>
        </div>
      </section>

      <section className="about-values section-padding">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">WHAT GUIDES US</span>
            <h2 className="section-heading">Our core values</h2>
            <p>
              The principles that shape our approach to agricultural work
              and the relationships we build.
            </p>
          </div>

          <div className="values-grid">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <article className="value-card" key={value.title}>
                  <div className="value-icon">
                    <Icon size={23} />
                  </div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-focus section-padding">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">OUR APPROACH</span>
            <h2 className="section-heading">
              Where knowledge meets practical agriculture.
            </h2>
            <p>
              Our work brings together different areas of agricultural
              activity to support farmers and the wider agricultural sector.
            </p>
          </div>

          <div className="focus-grid">
            {focusAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article className="focus-card" key={area.title}>
                  <div className="focus-icon">
                    <Icon size={24} />
                  </div>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container about-cta-inner">
          <div>
            <span className="eyebrow">LET'S CONNECT</span>
            <h2>Interested in working with us?</h2>
            <p>
              Get in touch to discuss agricultural research, consultation,
              training, or other opportunities.
            </p>
          </div>

          <a href="/contact" className="primary-button">
            Contact Us <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}
