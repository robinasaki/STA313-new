import React from "react";

const Introduction: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: "inherit",
        color: "white",
        padding: "40px",
        lineHeight: "1.8",
        margin: "0 auto",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        The Vital Role of Sleep in Workforce Health
      </h1>
      <p style={{ marginBottom: "20px" }}>
        Sleep is a cornerstone of human health and performance, playing a
        critical role in maintaining alertness, managing fatigue, and coping
        with stress. The National Sleep Foundation highlights that adults need{" "}
        <strong>7–9 hours</strong> of sleep per night to maintain optimal
        cognitive and physical health, yet up to <strong>35% of adults</strong>{" "}
        report not getting sufficient sleep (
        <a
          href="https://www.cdc.gov/sleep/about_sleep/chronic_sleep_deprivation.html"
          target="_blank"
          style={{ color: "#ff7f0e", textDecoration: "underline" }}
        >
          CDC, 2017
        </a>
        ). For dispatchers—a profession characterized by irregular schedules,
        long hours, and high-stress environments—insufficient sleep can have
        far-reaching consequences.
      </p>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        Why Dispatchers?
      </h2>
      <p style={{ marginBottom: "20px" }}>
        Research shows that professions with irregular work schedules, like
        dispatchers, are prone to disrupted circadian rhythms, resulting in
        heightened levels of stress, fatigue, and diminished alertness (
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/"
          target="_blank"
          style={{ color: "#ff7f0e", textDecoration: "underline" }}
        >
          Philbert et al., 2021
        </a>
        ). This combination of factors makes dispatchers uniquely vulnerable to
        the cumulative effects of sleep disorders, affecting their health and
        professional performance.
      </p>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        Why These Variables?
      </h2>
      <p style={{ marginBottom: "20px" }}>
        The selected variables—age, job pressure, responsibility for others'
        safety, inadequate staffing, time off, and break time—are grounded in
        previous studies identifying key stressors in high-demand professions:
      </p>
      <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
        <li>
          <strong>Age:</strong> Older individuals tend to experience more
          fragmented sleep, reduced recovery from fatigue, and higher stress (
          <a
            href="https://aasm.org/"
            target="_blank"
            style={{ color: "#ff7f0e", textDecoration: "underline" }}
          >
            American Academy of Sleep Medicine, 2020
          </a>
          ).
        </li>
        <li>
          <strong>Job Pressure and Safety Responsibility:</strong> Studies show
          that high workloads and responsibilities contribute significantly to
          workplace stress and exacerbate sleep deprivation (
          <a
            href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7522727/"
            target="_blank"
            style={{ color: "#ff7f0e", textDecoration: "underline" }}
          >
            Karasek & Theorell, 1990
          </a>
          ).
        </li>
        <li>
          <strong>Time Off and Break Time:</strong> Limited recovery periods are
          associated with increased fatigue and reduced resilience to stress (
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/"
            target="_blank"
            style={{ color: "#ff7f0e", textDecoration: "underline" }}
          >
            Dinges et al., 2016
          </a>
          ).
        </li>
      </ul>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        Research Purpose
      </h2>
      <p style={{ marginBottom: "20px" }}>
        The research questions stem from these known associations, aiming to
        explore:
      </p>
      <ol style={{ marginLeft: "20px", marginBottom: "20px" }}>
        <li>How sleep disorders impact alertness and fatigue.</li>
        <li>Whether stress and fatigue levels vary across age groups.</li>
        <li>
          How cumulative stress in the dispatcher role amplifies the likelihood
          of developing sleep disorders.
        </li>
      </ol>
      <p style={{ marginBottom: "20px" }}>
        By synthesizing these elements, our study aims to provide actionable
        insights into how stress, sleep, and fatigue interact in a high-pressure
        profession. These findings contribute to ongoing discussions about
        improving workplace health and productivity, aligning with
        recommendations from organizations like the World Health Organization
        (WHO) on combating occupational stress (
        <a
          href="https://www.who.int/news/item/28-09-2022"
          target="_blank"
          style={{ color: "#ff7f0e", textDecoration: "underline" }}
        >
          WHO, 2022
        </a>
        ).
      </p>
      <h2
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "15px",
        }}
      >
        A Data-Driven Exploration
      </h2>
      <div style={{marginBottom: '200px'}}>
        This study bridges existing literature with visualization-based
        insights, demonstrating how the interplay of stressors manifests in
        dispatchers’ health outcomes. Through the lens of age, experience, and
        occupational challenges, our findings not only reveal the trends but
        also highlight actionable pathways for intervention.
      </div>
    </div>
  );
};

export default Introduction;
