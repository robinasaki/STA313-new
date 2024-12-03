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
    if (chartData.length === 0 || !svgRef.current || !containerRef.current) return;

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

    svg
      .append("text")
      .attr("x", width / 2 + margin.left)
      .attr("y", margin.top / 2)
      .style("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text("Proportion of Dispatchers with Sleep Disorders by Years Of Experience");

    svg
      .append("line")
      .attr("x1", width / 2 + margin.left - 350)
      .attr("x2", width / 2 + margin.left + 350)
      .attr("y1", margin.top / 2 + 5)
      .attr("y2", margin.top / 2 + 5)
      .style("stroke", "white")
      .style("stroke-width", 2);

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
      .attr("opacity", 0.8);

  }, [chartData]);

  return (
    <div
      style={{

        overflowY: "auto", // Enable vertical scrolling if content overflows
        backgroundColor: "#1a1a1a", // Optional: Set a background color for the entire page
        color: "white", // Set text color for the paragraph
      }}
    >
      <div ref={containerRef} style={{ position: "relative" }}>
        <svg ref={svgRef}></svg>
      </div>
      <div style={{ marginTop: "20px", padding: "10px" }}>
        <p>
          We aim to answer the research question: Does an increase in years as a
          dispatcher elevate the likelihood of sleep disorders? By examining the
          relationship between the proportion of dispatchers diagnosed with sleep
          disorders across years of experience from this visualization, we may
          answer this question. It is easy to see that the proportion of
          dispatchers diagnosed with a sleep disorder increases significantly as
          the number of years of experience grows.
        </p>
        <p>
          The prolonged exposure to factors such as irregular schedules, high
          pressure, and lack of sleep is inherently part of the job as a
          dispatcher. The cumulative stress from the role reveals its
          consequences from longer years of experience in the role. The trend
          begins to show after 14 years of experience where the proportion jumps
          twice as much as the previous bin and from there grows each bin up to
          the range of 35+ years of experience as a dispatcher, which shows 25%
          of individuals with a sleep disorder.
        </p>
        <p>
          Thus, this visualization highlights the urgent need to provide
          dispatchers with better work conditions and promote safer sleep hygiene
          among long-term employees. By addressing this, we can improve the
          health and safety of dispatchers.
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
