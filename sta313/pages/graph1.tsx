import React, { useEffect, useState } from "react";
import * as d3 from "d3";

export function GraphOne() {
  const [data, setData] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const metricsColors = {
    Alert_at_Work: "blue",
    Phys_Drained: "red",
    Mentally_Drained: "violet",
  };

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom; // Increased height slightly

  const groups = ["No Disorder", "Sleep Apnea", "Other Disorders"];
  const metrics = ["Alert_at_Work", "Phys_Drained", "Mentally_Drained"];
  const chartIds = ["chart1", "chart2", "chart3"];

  useEffect(() => {
    // Load data from CSV
    d3.csv("/data/data.csv").then((rawData) => {
      const processedData = rawData.map((d: any) => {
        const disorderGroup =
          +d.Diagnosed_Sleep_disorder === 2
            ? "No Disorder"
            : +d.Diagnosed_Sleep_disorder === 1 && +d.Sleep_Apnea === 1
            ? "Sleep Apnea"
            : +d.Diagnosed_Sleep_disorder === 1 && +d.Sleep_Apnea === 2
            ? "Other Disorders"
            : null;

        return {
          Sleep_Disorder_Group: disorderGroup!,
          Alert_at_Work: +d.Alert_at_Work,
          Phys_Drained: +d.Phys_Drained,
          Mentally_Drained: +d.Mentally_Drained,
        };
      });

      setData(processedData.filter((d) => d.Sleep_Disorder_Group));
    });
  }, []);

  useEffect(() => {
    if (data.length === 0) return;

    // Clear existing charts
    chartIds.forEach((id) => {
      d3.select(`#${id}`).selectAll("*").remove();
    });

    // Remove existing tooltips
    d3.selectAll(".tooltip").remove();

    // Tooltip div (created once)
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("padding", "8px")
      .style("background-color", "rgba(0,0,0,0.6)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("font-size", "14px");

    // Get the group for the current step
    const group = groups[currentStep];

    metrics.forEach((metric, index) => {
      const metricData = data
        .filter((d) => d.Sleep_Disorder_Group === group)
        .map((d) => d[metric as keyof typeof metricsColors]);

      const counts = d3.rollup(
        metricData,
        (v) => v.length,
        (d) => d
      );

      const totalResponses = d3.sum(Array.from(counts.values()));

      // Convert counts to percentages
      const percentages = Array.from(counts.entries()).map(
        ([key, value]) => [key, (value / totalResponses) * 100]
      );

      const svg = d3
        .select(`#${chartIds[index]}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "chart")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Scales
      const xScale = d3
        .scaleBand()
        .domain([1, 2, 3, 4, 5].map(String))
        .range([0, width])
        .padding(0.1);

      const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      // X Axis
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "14px");

      // Y Axis
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "14px");

      // Axis lines and ticks
      svg.selectAll(".domain").attr("stroke", "white");
      svg.selectAll(".tick line").attr("stroke", "white");

      // Bars
      const bars = svg
        .selectAll(".bar")
        .data(percentages, ([key]) => key as string);

      bars
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("class", "bar")
              .attr("x", ([key]) => xScale(key.toString())!)
              .attr("y", yScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .attr(
                "fill",
                metricsColors[metric as keyof typeof metricsColors]
              )
              .call((enter) =>
                enter
                  .transition()
                  .duration(1000)
                  .attr("y", ([, value]) => yScale(value))
                  .attr("height", ([, value]) => height - yScale(value))
              ),
          (update) =>
            update.call((update) =>
              update
                .transition()
                .duration(1000)
                .attr("y", ([, value]) => yScale(value))
                .attr("height", ([, value]) => height - yScale(value))
            )
        )
        // Hover events for tooltip
        .on("mouseover", function (event, [key, value]) {
          d3.select(this).attr("fill", "orange");
          tooltip
            .style("visibility", "visible")
            .text(`Percentage of respondents: ${value.toFixed(2)}%`);
        })
        .on("mousemove", function (event) {
          tooltip
            .style("top", event.pageY - 10 + "px")
            .style("left", event.pageX + 10 + "px");
        })
        .on("mouseout", function () {
          d3.select(this).attr(
            "fill",
            metricsColors[metric as keyof typeof metricsColors]
          );
          tooltip.style("visibility", "hidden");
        });

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text(`${group}: ${metric.replace("_", " ")}`);
    });
  }, [data, currentStep]);

  const handleNext = () => {
    setCurrentStep((prevStep) => (prevStep + 1) % groups.length); // Loop back to the first step
  };

  return (
    <div>
      <div
        id="main-container"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "40px",
        }}
      >
        {/* Left Column with Graphs */}
        <div
          id="charts-column"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <div id="chart1"></div>
          <div id="chart2"></div>
          <div id="chart3"></div>
        </div>

        {/* Right Column with Context */}
        <div
          id="context"
          style={{
            width: `${width + margin.left + margin.right}px`,
            color: "white",
            fontSize: "20px",
            backgroundColor: "#21262d",
            padding: "15px",
            height: "100%", // Match the height of the graphs column
          }}
        >
          INSERT BODY TEXT HERE!!!
        </div>
      </div>
      <button
        onClick={handleNext}
        style={{
          marginTop: "40px",
          padding: "10px 20px",
          fontSize: "16px",
          color: "white",
          backgroundColor: "gray",
          border: "none",
          cursor: "pointer",
        }}
      >
        Next
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: '20px',
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <GraphOne />
    </div>
  );
}

