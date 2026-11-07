
import {
  Sprout,
  Microscope,
  GraduationCap,
  Lightbulb,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import "../styles/pages/Services.css";

const services = [
  {
    number: "01",
    icon: Sprout,
    title: "Agricultural Trading",
    description:
      "Connecting agricultural products with opportunities across the agricultural value chain.",
    points: [
      "Agricultural product trading",
      "Market connections",
      "Supply chain opportunities",
    ],
  },
  {
    number: "02",
    icon: Microscope,
    title: "Agricultural Inputs",
    description:
      "Supporting agricultural production through access to relevant farming inputs and products.",
    points: [
      "Agricultural input solutions",
      "Production support",
      "Quality-focused products",
    ],
  },
  {
    number: "03",
    icon: Lightbulb,
    title: "Expert Consultation",
    description:
      "Providing agricultural guidance informed by professional knowledge, research, and practical experience.",
    points: [
      "Agricultural guidance",
      "Practical recommendations",
      "Problem assessment",
    ],
  },
  {
    number: "04",
    icon: GraduationCap,
    title: "Training & Education",
    description:
      "Supporting agricultural knowledge sharing and learning through training and educational activities.",
    points: [
      "Agricultural education",
      "Practical knowledge sharing",
      "Farmer learning support",
    ],
  },
];

export default function Services() {
  return (
    <div className="inner-page services-page">
      <section className="services-intro section-padding">
        <div className="container services-intro-grid">
          <div>
            <span className="eyebrow">OUR SERVICES</span>
            <h1 className="section-heading">
              Supporting agriculture through connected services.
            </h1>
          </div>

          <p>
            Agricultural progress requires more than a single solution.
            It involves access to relevant products, reliable knowledge,
            practical guidance, and opportunities to learn. Our service
            areas reflect these interconnected needs.
          </p>
        </div>
      </section>

      <section className="services-list section-padding">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">WHAT WE OFFER</span>
            <h2 className="section-heading">Explore our services</h2>
          </div>

          <div className="service-detail-grid">
            {services.map((service) => {
              const Icon = service.icon;

              return (
                <article className="service-detail-card" key={service.number}>
                  <div className="service-detail-top">
                    <span className="service-number">{service.number}</span>

                    <div className="service-detail-icon">
                      <Icon size={27} />
                    </div>
                  </div>

                  <h3>{service.title}</h3>
                  <p>{service.description}</p>

                  <ul>
                    {service.points.map((point) => (
                      <li key={point}>
                        <CheckCircle2 size={16} />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <a href="/contact" className="service-link">
                    Make an enquiry <ArrowUpRight size={16} />
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="services-cta">
        <div className="container services-cta-inner">
          <div>
            <span className="eyebrow">LET'S DISCUSS YOUR NEEDS</span>
            <h2>Looking for agricultural support?</h2>
            <p>
              Tell us what you need. Our team can discuss your enquiry
              and the appropriate next steps.
            </p>
          </div>

          <a href="/contact" className="primary-button">
            Get in Touch <ArrowUpRight size={17} />
          </a>
        </div>
      </section>
    </div>
  );
}
