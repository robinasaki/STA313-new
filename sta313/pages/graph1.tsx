import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function SleepRiskBubbleChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        const rows = d3.csvParse(text);

        // Normalize function
        const normalize = (values: number[]) => {
          const min = Math.min(...values);
          const max = Math.max(...values);
          return values.map((v) => (v - min) / (max - min));
        };

        // Extract and normalize relevant columns
        const sleepLoss = rows.map((d) => +d["Sleep_loss"] || 0);
        const totalLifeEvents = rows.map((d) => +d["Total_life_events"] || 0);
        const jobPressure = rows.map((d) => +d["Job_pressure"] || 0);
        const safetyResponsibility = rows.map(
          (d) => +d["Resp_for_others_safety"] || 0
        );
        const inadequateStaff = rows.map((d) => +d["Inadeq_Staff"] || 0);
        const timeOff = rows.map((d) => +d["TimeOff"] || 0);
        const breakTime = rows.map((d) => +d["BreakTime"] || 0);

        const normalizedSleepLoss = normalize(sleepLoss);
        const normalizedLifeEvents = normalize(totalLifeEvents);
        const normalizedJobPressure = normalize(jobPressure);
        const normalizedSafetyResponsibility = normalize(safetyResponsibility);
        const normalizedInadequateStaff = normalize(inadequateStaff);
        const normalizedTimeOff = normalize(timeOff);
        const normalizedBreakTime = normalize(breakTime);

        // Calculate Sleep Risk Index
        const sleepRiskIndices = rows.map((_, i) => {
          const factors = [
            normalizedSleepLoss[i],
            normalizedLifeEvents[i],
            normalizedJobPressure[i],
            normalizedSafetyResponsibility[i],
            normalizedInadequateStaff[i],
            normalizedTimeOff[i],
            normalizedBreakTime[i],
          ];
          return (
            factors.reduce((sum, value) => sum + value, 0) / factors.length
          ); // Average of factors
        });

        const ageGroupMapping: { [key: string]: string } = {
          1: "20-29",
          2: "30-39",
          3: "40-49",
          4: "50-59",
          5: "60+",
        };

        // Debug Age_Group values
        console.log(
          "Age_Group values:",
          rows.map((d) => d["Age_Group"])
        );

        // Filter and process data
        const parsedData = rows
          .filter((d) => {
            const ageGroup = +d["Age_Group"];
            if (!ageGroupMapping[ageGroup]) {
              console.warn("Unmapped or invalid age group:", ageGroup); // Debug unmapped values
              return false; // Exclude invalid rows
            }
            return d["Diagnosed_Sleep_disorder"] === "1";
          })
          .map((d, i) => ({
            ageGroup: ageGroupMapping[+d["Age_Group"]],
            sleepRisk: sleepRiskIndices[i],
            hasDisorder: true,
          }));

        setChartData(parsedData);
      })
      .catch((error) => console.error("Error fetching CSV:", error));
  }, []);

  useEffect(() => {
    if (chartData.length === 0 || !svgRef.current || !containerRef.current)
      return;

    // Clean previous SVG
    d3.select(svgRef.current).selectAll("*").remove();

    // Dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = window.innerHeight * 0.8;

    const margin = { top: 90, right: 40, bottom: 90, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const ageGroupOrder = ["20-29", "30-39", "40-49", "50-59", "60+"];

    const xScale = d3
      .scalePoint()
      .domain(ageGroupOrder) // Ensure X-axis is sorted correctly
      .range([margin.left, width + margin.left])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1]) // Sleep Risk Index is normalized to 0-1
      .range([height + margin.top, margin.top]);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["true", "false"])
      .range(["#ff7f0e", "#1f77b4"]);

    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Title
    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .style("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("Sleep Risk Index by Age Group and Sleep Disorder Status");

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height + margin.top})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".0%")));

    // Bubbles
    svg
      .append("g")
      .selectAll("circle")
      .data(chartData)
      .join("circle")
      .attr("cx", (d) => xScale(d.ageGroup))
      .attr("cy", (d) => yScale(d.sleepRisk))
      .attr("r", 10)
      .attr("fill", (d) => colorScale(d.hasDisorder.toString()))
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 0.8);
        tooltip.style("opacity", 1).html(
          `<strong>Age Group:</strong> ${d.ageGroup}<br/>
           <strong>Sleep Risk Index:</strong> ${d.sleepRisk.toFixed(2)}<br/>
           <strong>Disorder:</strong> ${d.hasDisorder ? "Yes" : "No"}`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // Cleanup
    return () => {
      tooltip.remove();
    };
  }, [chartData]);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", background: "#1a1a1a", color: "white" }}
    >
      <svg ref={svgRef}></svg>
      <div style={{ marginLeft: "20px", flex: 1, maxWidth: "500px" }}>
        <h1 style={{ fontSize: "30px", marginBottom: "20px" }}>
          Trends and Insights
        </h1>
        <p style={{ marginBottom: "10px" }}>
          The visualization examines the research question:{" "}
          <strong style={{ fontWeight: "bold" }}>
            How does age influence sleep risk for individuals diagnosed with
            sleep disorders?
          </strong>{" "}
          Key trends relating to this are:
        </p>
        <p style={{ marginBottom: "10px" }}>
          <strong style={{ fontWeight: "bold", textDecoration: "underline" }}>
            Higher Risk Among Older Age Groups:
          </strong>
          Individuals in the{" "}
          <strong style={{ fontWeight: "bold" }}>50-59</strong> and{" "}
          <strong style={{ fontWeight: "bold" }}>60+ years</strong> age groups
          show a{" "}
          <strong style={{ fontWeight: "bold" }}>
            higher Sleep Risk Index
          </strong>
          , with a significant clustering of high-risk cases.
        </p>
        <p style={{ marginBottom: "10px" }}>
          <strong style={{ fontWeight: "bold", textDecoration: "underline" }}>
            Variation Across Age Groups:
          </strong>
          The <strong style={{ fontWeight: "bold" }}>40-49</strong> age group
          has moderate variability, while the{" "}
          <strong style={{ fontWeight: "bold" }}>20-29</strong>
          and <strong style={{ fontWeight: "bold" }}>30-39</strong> groups show
          generally lower Sleep Risk Index values, indicating younger
          individuals are at comparatively lower risk.
        </p>
        <p style={{ marginBottom: "10px" }}>
          <strong style={{ fontWeight: "bold", textDecoration: "underline" }}>
            Underlying Factors:
          </strong>
          Stress-related workplace and life factors, such as{" "}
          <strong style={{ fontWeight: "bold" }}>job pressure</strong>,{" "}
          <strong style={{ fontWeight: "bold" }}>inadequate time off</strong>,
          and{" "}
          <strong style={{ fontWeight: "bold" }}>
            responsibility for others’ safety
          </strong>
          , contribute significantly to the Sleep Risk Index across all age
          groups.
        </p>
        <p style={{ marginTop: "20px" }}>
          This visualization demonstrates that older individuals (50+) with
          sleep disorders tend to have higher sleep risk levels, likely due to
          cumulative stress and reduced recovery over time.
        </p>
        <p style={{ marginTop: "20px" }}>
          These findings highlight the importance of addressing stressors and
          promoting better sleep hygiene, especially for individuals in older
          age brackets.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <SleepRiskBubbleChart />
    </div>
  );
}
