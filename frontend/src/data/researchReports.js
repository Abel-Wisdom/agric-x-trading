import soilResearchImage from "../assets/agric-x-soil-research.png";
export const researchReports = [
  {
    id: "sample-maize-soil-assessment",
    slug: "soil-conditions-and-sustainable-maize-production",
    title:
      "Assessing Soil Conditions and Sustainable Maize Production Among Smallholder Farmers",
    subtitle:
      "Understanding soil management practices, production challenges, and opportunities for improving maize cultivation.",
    category: "Soil Management",
    topics: [
      "Agricultural Research",
      "Soil Health",
      "Maize Production",
      "Smallholder Farmers",
    ],
    reportType: "Sample Research Report",
    publicationDate: "Demonstration Edition",
    readingTime: "12-minute read",
    author: "Demonstration Research Unit",
    coverImage: soilResearchImage,
    status: "published",
    isDemonstration: true,

    executiveSummary: `
      Soil health is an important foundation of sustainable agricultural
      production. For smallholder maize farmers, understanding soil
      conditions and adopting appropriate soil management practices can
      support better production decisions and long-term farm productivity.

      This demonstration report explores the relationship between soil
      management practices, farmer knowledge, and sustainable maize
      cultivation. It presents a proposed framework for investigating
      common production challenges and identifying practical areas for
      agricultural support.

      This is an illustrative research document created to demonstrate
      Agric X Trading's proposed research publication format. It does not
      represent a completed field investigation or verified company
      research.
    `,

    introduction: `
      Maize is an important food and commercial crop across many
      agricultural communities in Nigeria. Its cultivation supports
      household food supply, livestock feed production, and agricultural
      trade.

      However, sustainable maize production depends on several
      interconnected factors. These include soil fertility, land
      preparation, rainfall patterns, seed quality, input accessibility,
      farming practices, and farmers' access to reliable agricultural
      information.

      Soil conditions are particularly important because they influence
      nutrient availability, water retention, root development, and crop
      performance.

      Understanding how farmers assess and manage their soils can help
      agricultural practitioners identify opportunities for better
      consultation, farmer education, and appropriate input support.
    `,

    problemStatement: `
      Smallholder farmers may face difficulties identifying soil
      limitations and selecting appropriate soil management practices.
      Limited access to soil testing, insufficient technical guidance,
      rising input costs, and inconsistent access to agricultural
      information can complicate farm-level decisions.

      Without a clear understanding of these challenges, agricultural
      interventions may fail to address the actual needs of farmers.

      This demonstration study therefore outlines how a structured
      investigation could examine soil management practices and the
      support requirements of smallholder maize farmers.
    `,

    objectives: [
      "Examine common soil management practices used in smallholder maize production.",
      "Identify factors that influence farmers' decisions about soil fertility management.",
      "Explore challenges affecting access to soil testing and agricultural guidance.",
      "Consider practical approaches to improving farmer education and soil management.",
      "Highlight opportunities for agricultural consultation and appropriate input support.",
    ],

    methodology: {
      description: `
        A suitable investigation would combine field observations,
        farmer engagement, and basic soil assessment to understand
        production conditions from both technical and practical
        perspectives.

        The following methodology is a proposed framework for a future
        field investigation. It is not a record of research activities
        already completed.
      `,
      methods: [
        {
          title: "Field Observation",
          description:
            "Observe farm conditions, land preparation methods, crop establishment, and visible soil characteristics.",
        },
        {
          title: "Farmer Engagement",
          description:
            "Conduct structured discussions with participating farmers about their cultivation practices, production challenges, and information needs.",
        },
        {
          title: "Soil Assessment",
          description:
            "Where facilities and appropriate procedures are available, collect representative soil samples for relevant laboratory analysis.",
        },
        {
          title: "Information Analysis",
          description:
            "Organize observations and verified assessment results to identify recurring themes and practical areas for support.",
        },
      ],
    },

    fieldObservations: [
      {
        title: "Soil management knowledge",
        description:
          "A field investigation could examine how farmers identify changes in soil condition and how they decide which soil management practices to adopt.",
      },
      {
        title: "Access to soil testing",
        description:
          "The investigation could explore whether farmers have access to reliable soil testing services and understand how to interpret the results.",
      },
      {
        title: "Input selection",
        description:
          "Farmer discussions could help establish how seed, fertilizer, and other agricultural input decisions are made.",
      },
      {
        title: "Agricultural information",
        description:
          "The study could examine the sources of technical information available to farmers and the usefulness of existing advisory support.",
      },
    ],

    analysis: `
      The proposed research framework highlights the importance of
      connecting technical soil assessment with farmers' practical
      experiences.

      Soil management recommendations should be informed by the
      characteristics of the specific farm environment rather than
      relying on assumptions that every farm has identical conditions.

      Soil testing, when properly conducted, can provide useful
      information about soil properties and nutrient levels. Such
      information can help guide decisions about soil amendments and
      fertilizer application.

      However, technical information is most useful when farmers can
      understand and apply it. Agricultural consultation and practical
      farmer education therefore form important parts of an effective
      soil management support system.
    `,

    recommendations: [
      {
        title: "Encourage appropriate soil assessment",
        description:
          "Promote access to suitable soil testing services where available and help farmers understand the results before making input decisions.",
      },
      {
        title: "Strengthen practical farmer education",
        description:
          "Develop accessible educational sessions covering soil health, nutrient management, and responsible input use.",
      },
      {
        title: "Promote informed input selection",
        description:
          "Encourage farmers to select agricultural inputs based on crop requirements, soil conditions, and credible technical guidance.",
      },
      {
        title: "Improve agricultural consultation",
        description:
          "Support farmers with practical guidance that considers their production environment, resources, and specific challenges.",
      },
      {
        title: "Support continuous field research",
        description:
          "Encourage further investigation and documentation so that future recommendations can be informed by verified field evidence.",
      },
    ],

    conclusion: `
      Sustainable maize production requires more than the availability
      of agricultural inputs. It also depends on understanding soil
      conditions, making informed production decisions, and ensuring
      farmers can access relevant technical guidance.

      A research approach that combines soil assessment, field
      observation, and farmer engagement can help identify practical
      opportunities for improving agricultural support.

      For Agric X Trading, this proposed research direction demonstrates
      how agricultural research can complement consultation, farmer
      education, and appropriate agricultural input services.
    `,

    limitations: [
      "This is a demonstration document, not a completed field study.",
      "No farmer interviews or farm visits were conducted for this sample.",
      "No laboratory soil tests or measured crop-yield results are presented.",
      "The observations and recommendations illustrate a proposed research approach and should not be treated as verified findings.",
    ],

    references: [
      "Food and Agriculture Organization of the United Nations (FAO) — Soil management and sustainable agricultural production resources.",
      "International Institute of Tropical Agriculture (IITA) — Research and resources relating to maize production in Africa.",
    ],
  },
];

export function getResearchReportBySlug(slug) {
  return researchReports.find((report) => report.slug === slug);
}
