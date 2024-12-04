import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function YearsVsSleepDisorderBarChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        const rows = d3.csvParse(text);
        setChartData(rows);
      })
      .catch((error) => console.error("Error fetching CSV:", error));
  }, []);

  useEffect(() => {
    if (chartData.length === 0 || !svgRef.current || !containerRef.current)
      return;

    d3.select(svgRef.current).selectAll("*").remove();

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = window.innerHeight * 0.8;

    const margin = { top: 90, right: 40, bottom: 90, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const parsedData = chartData.map((d: any) => ({
      years: +d["Total_years_dispatcher"] || 0,
      sleepDisorder: +d["Diagnosed_Sleep_disorder"],
    }));

    const binStep = 7;
    const maxYears = 42;
    const bins = d3
      .bin()
      .value((d) => d.years)
      .thresholds(d3.range(0, maxYears, binStep))(parsedData);

    const groupedData = bins.map((bin, index, array) => {
      const isLastBin = index === array.length - 1;
      const total = bin.length;
      const diagnosed = bin.filter((d) => d.sleepDisorder === 1).length;
      const proportion = total === 0 ? 0 : diagnosed / total;
      return {
        binRange: isLastBin
          ? `${Math.floor(bin.x0)}-${Math.floor(maxYears - 1)}`
          : `${Math.floor(bin.x0)}-${Math.floor(bin.x1) - 1}`,
        proportion,
        total,
      };
    });

    const xScale = d3
      .scaleBand()
      .domain(groupedData.map((d) => d.binRange))
      .range([margin.left, width + margin.left])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, 0.5])
      .range([height + margin.top, margin.top]);

    const colorScale = d3.scaleLinear().domain([0, 0.5]).range(["lightblue", "darkred"]);

    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight);

    // Create a tooltip
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

    // Chart title
    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .style("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text(
        "Proportion of Dispatchers with Sleep Disorders by Years Of Experience"
      );

    svg
      .append("line")
      .attr("x1", width / 2 + margin.left - 350)
      .attr("x2", width / 2 + margin.left + 350)
      .attr("y1", margin.top / 2 + 5)
      .attr("y2", margin.top / 2 + 5)
      .style("stroke", "white")
      .style("stroke-width", 2);

    // X-axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height + margin.top})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "16px")
      .style("fill", "white")
      .attr("transform", "rotate(45)")
      .style("text-anchor", "start");

    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", height + margin.top + 70)
      .style("text-anchor", "middle")
      .style("font-size", "18px")
      .style("fill", "white")
      .text("Years as Dispatcher");

    // Y-axis
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".0%")))
      .selectAll("text")
      .style("font-size", "16px")
      .style("fill", "white");

    svg
      .append("text")
      .attr("x", -height / 2 - margin.top)
      .attr("y", margin.left - 70)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .style("font-size", "18px")
      .style("fill", "white")
      .text("Proportion Diagnosed with Sleep Disorder");

    // Bars with interactivity
    svg
      .append("g")
      .selectAll("rect")
      .data(groupedData)
      .join("rect")
      .attr("x", (d) => xScale(d.binRange))
      .attr("y", (d) => yScale(d.proportion))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => height + margin.top - yScale(d.proportion))
      .attr("fill", (d) => colorScale(d.proportion))
      .attr("opacity", 0.8)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", "orange");

        tooltip
          .style("opacity", 1)
          .html(
            `<strong style={{fontWeight: "bold"}}>Years:</strong> ${d.binRange}<br/>
             <strong style={{fontWeight: "bold"}}>Proportion:</strong> ${(d.proportion * 100).toFixed(
               2
             )}%<br/>
             <strong style={{fontWeight: "bold"}}>Total Dispatchers:</strong> ${d.total}`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX - 5 + "px")
          .style("top", event.pageY - 90 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill", (d) => colorScale(d.proportion));

        tooltip.style("opacity", 0);
      });

    
    // Legend
  const legendWidth = 250;
  const legendHeight = 20;
  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${width - 200},${margin.top + 1})`);

  legendGroup
    .append("rect")
    .attr("width", legendWidth + 40)
    .attr("height", legendHeight + 80)
    .attr("x", -20)
    .attr("y", -30)
    .style("fill", "transparent")
    .style("stroke", "white")
    .style("stroke-width", 2);

  legendGroup
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", -10)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "white")
    .text("Legend:");

  legendGroup
    .append("text")
    .attr("x", legendWidth / 2)
    .attr("y", 5)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("fill", "white")
    .text("Proportion Diagnosed with Sleep Disorder");

  const gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  gradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "lightblue");

  gradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "darkred");

  legendGroup
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("y", 15)
    .style("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear().domain([0, 0.5]).range([0, legendWidth]);
  const legendAxis = d3.axisBottom(legendScale).ticks(5).tickFormat(d3.format(".0%"));

  legendGroup
    .append("g")
    .attr("transform", `translate(0,${legendHeight + 15})`)
    .call(legendAxis)
    .selectAll("text")
    .style("fill", "white")
    .style("font-size", "12px");
    
    // Cleanup tooltip on component unmount
    return () => {
      tooltip.remove();
    };
  
  }, [chartData]);

  return (
    <div
      style={{
        overflowY: "auto",
        backgroundColor: "#1a1a1a",
        color: "white",
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        padding: "20px",
      }}
    >
      <div
        ref={containerRef}
        style={{ position: "relative", flex: 1, minWidth: "500px" }}
      >
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ marginLeft: "20px", flex: 1, maxWidth: "500px" }}>
  <h1 style={{ fontSize: "30px", marginBottom: "20px" }}>Trends and Insights</h1>
  <p style={{ marginBottom: "10px" }}>
    The visualization examines the research question:{" "}
    <strong style={{fontWeight: "bold"}}>
      Does an increase in years as a dispatcher elevate the likelihood of sleep
      disorders?
    </strong>{" "}
    Key trends relating to this are:
  </p>
  <p style={{ marginBottom: "10px" }}>
  <strong style={{fontWeight: "bold", textDecoration: "underline"}}>Proportion Increases with Experience:</strong> Dispatchers with{" "}
    <strong style={{fontWeight: "bold"}}>14–20 years</strong> of experience have a{" "}
    <strong style={{fontWeight: "bold"}}>13.7% proportion</strong> of being diagnosed with a sleep disorder,
    doubling the rate from the previous bin (7–13 years). Beyond{" "}
    <strong style={{fontWeight: "bold"}}>20 years</strong>, the proportion continues to rise more!
  </p>
  <p style={{ marginBottom: "10px" }}>
    <strong style={{fontWeight: "bold", textDecoration: "underline"}}>Highest Risk:</strong> Those with <strong style={{fontWeight: "bold"}}>35+ years</strong> of
    experience show the <strong style={{fontWeight: "bold"}}>highest proportion</strong>, with{" "}
    <strong style={{fontWeight: "bold"}}>25%</strong> diagnosed with a sleep disorder.
  </p>
  <p style={{ marginBottom: "10px" }}>
  <strong style={{fontWeight: "bold", textDecoration: "underline"}}>Key Factors:</strong> Inconsistent work schedule, high pressure work
    environments, and long works hours of a dispatcher, combine to increase the proportion over the years of experience
  </p>
  <p style={{ marginTop: "20px" }}>
    This visualization suggests that long term dispatchers that have been exposed to factors such as
    inconsistent work schedule, high pressure work environments, and long works hours of a dispatcher
    have a <strong style={{fontWeight: "bold"}}>higher risk</strong> to being diagnosed with a sleep disorder.
  </p>

  <p style={{ marginTop: "20px" }}>
    This highlights the need to emphasize better work conditions for dispatchers and promotes
    healthier sleep habits espically for long term dispatchers.
  </p>
</div>

    </div>
  );
}

export default function Page() {
  return (
    <div>
      <YearsVsSleepDisorderBarChart />
    </div>
  );
}
