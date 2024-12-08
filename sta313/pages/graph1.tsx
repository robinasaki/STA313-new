import React, { useEffect, useState } from "react";
import * as d3 from "d3";

export function GraphOne() {
  const [data, setData] = useState<any[]>([]);
  const [currentStep_g1, setCurrentStep_g1] = useState(0);
  const [currentStep_g2, setCurrentStep_g2] = useState(0);
  const [currentStep_g3, setCurrentStep_g3] = useState(0);

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
    const group_g1 = groups[currentStep_g1];
    const group_g2 = groups[currentStep_g2];
    const group_g3 = groups[currentStep_g3];

    const groups_curr = { 0: group_g1, 1: group_g2, 2: group_g3 };

    metrics.forEach((metric, index) => {
      const metricData = data
        .filter((d) => d.Sleep_Disorder_Group === groups_curr[index])
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
        .domain([1, 2, 3, 4].map(String))
        .range([0, width])
        .padding(0.1);

      const yScale = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      const customLabels = {
        1: "Very Low",
        2: "Low",
        3: "Neutral",
        4: "High",
        5: "Very High",
      };

      // X Axis
      svg
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).tickFormat((d) => customLabels[d] || d))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "14px");

      svg
        .append("text")
        .attr("x", width / 2) // Center horizontally
        .attr("y", height + margin.bottom - 10) // Position below the x-axis
        .attr("text-anchor", "middle") // Center align the text
        .style("font-size", "16px") // Customize font size
        .style("fill", "white") // Customize text color
        .text("Response Scale"); // Replace with the desired x-axis title

      // Y Axis
      svg
        .append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat((d) => `${d}%`))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "14px");

      svg
        .append("text")
        .attr("transform", "rotate(-90)") // Rotate for vertical alignment
        .attr("x", -height / 2) // Center vertically (negative because of rotation)
        .attr("y", -margin.left + 20) // Position left of the y-axis
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "white")
        .text("Percentage of Responses");

      // Axis lines and ticks
      svg.selectAll(".domain").attr("stroke", "white");
      svg.selectAll(".tick line").attr("stroke", "white");

      // Bars
      const bars = svg
        .selectAll(".bar")
        .data(percentages, ([key]) => key as string);

      const key_to_lab = {
        1: "never",
        2: "occasionally",
        3: "frequently",
        4: "always",
      };
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
        .text(`${groups_curr[index]}: ${metric.replace("_", " ")}`);
    });
  }, [data, currentStep_g1, currentStep_g2, currentStep_g3]);

  const handleNext_g1 = () => {
    setCurrentStep_g1((prevStep) => (prevStep + 1) % groups.length); // Loop back to the first step
  };
  const handleNext_g2 = () => {
    setCurrentStep_g2((prevStep) => (prevStep + 1) % groups.length); // Loop back to the first step
  };
  const handleNext_g3 = () => {
    setCurrentStep_g3((prevStep) => (prevStep + 1) % groups.length); // Loop back to the first step
  };

  const handlePrev_g1 = () => {
    setCurrentStep_g1((prevStep) => (prevStep - 1) % groups.length); // Loop back to the first step
  };
  const handlePrev_g2 = () => {
    setCurrentStep_g2((prevStep) => (prevStep - 1) % groups.length); // Loop back to the first step
  };
  const handlePrev_g3 = () => {
    setCurrentStep_g3((prevStep) => (prevStep - 1) % groups.length); // Loop back to the first step
  };
  return (
    <div
      id="main-container"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center", // Vertically centers content
        alignItems: "center", // Horizontally centers content
        gap: "40px",
        textAlign: "center",
        overflow: "auto",
        height: "100%", // Ensures the container takes the full viewport height
        marginBottom: "25%", // Reset margin for proper centering
      }}
    >
      <div
        id="context"
        style={{
          width: `100%`,
          color: "white",
          padding: "15px",
          height: "100%",
        }}
      >
        <h2
          style={{
            color: "white", // Set font color
            fontSize: "48px", // Increased font size for a heading
            fontWeight: "bold", // Bold text for emphasis
            textAlign: "center", // Center-align the heading
            margin: "2px 0", // Add spacing above and below the heading
            display: "block", // Ensures the heading takes the full width of its line
            clear: "both", // Clears any floated elements above or beside it
          }}
        >
          Starting Point: The Impact of Sleep Disorders on Alertness and Fatigue
        </h2>

        <p
          style={{
            textAlign: "center",
            padding: ".5%",
            paddingLeft: "3%",
            paddingRight: "3%",
          }}
        >
          content .......
        </p>
      </div>

      <div
        id="charts-column"
        style={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid #ccc",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "20px",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            id="chart1"
            style={{
              width: "100%",
              justifyContent: "center",
              textAlign: "center",
            }}
          ></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              onClick={handleNext_g1}
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
            <button
              onClick={handlePrev_g1}
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
              Prev
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            id="chart2"
            style={{
              width: "100%",
              justifyContent: "center",
              textAlign: "center",
            }}
          ></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              onClick={handleNext_g2}
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
            <button
              onClick={handlePrev_g2}
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
              Prev
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            id="chart3"
            style={{
              width: "100%",
              justifyContent: "center",
              textAlign: "center",
            }}
          ></div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <button
              onClick={handleNext_g3}
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
            <button
              onClick={handlePrev_g3}
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
              Prev
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: "20px",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "auto",
      }}
    >
      <GraphOne />
    </div>
  );
}
