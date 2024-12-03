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

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "absolute")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Chart Title
    const titleX = width / 2 + margin.left;
    const titleY = margin.top / 2;

    svg
      .append("text")
      .attr("x", titleX)
      .attr("y", titleY)
      .style("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .style("fill", "white")
      .text("Proportion of Dispatchers with Sleep Disorders by Years Of Experience");

    svg
      .append("line")
      .attr("x1", titleX - 350)
      .attr("x2", titleX + 350)
      .attr("y1", titleY + 5)
      .attr("y2", titleY + 5)
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
      .text("Years as Dispatcher (Range)");

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

    // Bars
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
        d3.select(this).attr("opacity", 1);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Years Range:</strong> ${d.binRange}<br/>
             <strong>Proportion Diagnosed:</strong> ${(d.proportion * 100).toFixed(2)}%<br/>
             <strong>Total Individuals:</strong> ${d.total}`
          )
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 40}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.pageX + 20}px`)
          .style("top", `${event.pageY - 60}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.8);
        tooltip.style("opacity", 0);
      });

    // Legend
    const legendWidth = 250;
    const legendHeight = 20;

    const legendGroup = svg
      .append("g")
      .attr("transform", `translate(${containerWidth - legendWidth - 120},${margin.top})`);

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
  }, [chartData]);

  return (
    <div ref={containerRef} style={{ position: "relative", height: "100%" }}>
      <svg ref={svgRef}></svg>
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
