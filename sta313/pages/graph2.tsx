import React, { useEffect, useState } from "react";
import * as d3 from "d3";

export function GraphTwo() {
  const [data, setData] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const metricsColors = {
    Alert_at_Work: "blue",
    Phys_Drained: "red",
    Mentally_Drained: "violet",
  };

  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const width = 300 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;

  const groups = ["No Disorder", "Sleep Apnea", "Other Disorders"];
  const metrics = ["Alert_at_Work", "Phys_Drained", "Mentally_Drained"];

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
    d3.select("#chart-container").selectAll("*").remove();

    // Get the group for the current step
    const group = groups[currentStep];

    const container = d3
      .select("#chart-container")
      .attr("style", "display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;");

    metrics.forEach((metric) => {
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
      const percentages = Array.from(counts.entries()).map(([key, value]) => [
        key,
        (value / totalResponses) * 100,
      ]);

      const svg = container
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

      const yScale = d3
        .scaleLinear()
        .domain([0, 100]) // 100% for percentages
        .range([height, 0]);

      // X Axis
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

      // Y Axis
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`)); // Display as percentages

      // Bars
      const bars = svg
        .selectAll(".bar")
        .data(percentages, ([key]) => key as string);

      // Enter and update
      bars
        .join(
          (enter) =>
            enter
              .append("rect")
              .attr("class", "bar")
              .attr("x", ([key]) => xScale(key.toString())!)
              .attr("y", yScale(0)) // Start at 0 for animation
              .attr("width", xScale.bandwidth())
              .attr("height", 0) // Start height at 0 for animation
              .attr("fill", metricsColors[metric as keyof typeof metricsColors])
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
        );

      // Title
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(`${group}: ${metric.replace("_", " ")}`);
    });
  }, [data, currentStep]);

  const handleNext = () => {
    setCurrentStep((prevStep) => (prevStep + 1) % groups.length); // Loop back to the first step
  };

  return (
    <div>
      <div id="chart-container"></div>
      <button onClick={handleNext} style={{ marginTop: "20px" }}>
        Next
      </button>
    </div>
  );
}

export default function Page() {
    return (
        <div style={{
            textAlign: 'center',
            marginTop: '10px'
        }}>
            <GraphTwo />
        </div>
    )
}