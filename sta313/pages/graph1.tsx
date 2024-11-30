import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function GraphOne() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [showPink, togglePink] = useState(true); // Filter for Diagnosed with Sleep Disorder
  const [showCyan, toggleCyan] = useState(true); // Filter for Not Diagnosed with Sleep Disorder
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgGraphRef = useRef<d3.Selection<SVGSVGElement | null, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);

  // Get CSV Data
  useEffect(() => {
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        setChartData(d3.csvParse(text));
      });
  }, []);

  useEffect(() => {
    if (chartData.length === 0 || !svgRef.current || !containerRef.current) {
      return;
    }

    // Clear any previous content in the SVG
    d3.select(svgRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = window.innerHeight * 0.8; // To account for vertical arrangement
    const margin = {
      top: height * 0.1,
      right: width * 0.05,
      bottom: height * 0.15,
      left: width * 0.12,
    };

    // Parse the data and handle missing or invalid values
    const parsedData = chartData
      .map((d, i) => ({
        id: i, // Assign a unique id based on the index
        x: +d["Total_years_dispatcher"] || 0,
        y: +d["If_yes_how_many_daily"] || 0,
        sleepDisorder: +d["Diagnosed_Sleep_disorder"],
        sleepLoss: +d["Sleep_loss"] || 1,
        stress: d["Sleep_loss"] || "Unknown", // Include stress attribute
      }))
      .filter((d) => d.x > 0 && d.y > 0); // Filter out invalid entries

    // Filter data based on checkboxes
    const filteredData = parsedData.filter(
      (d) =>
        (showPink && d.sleepDisorder === 1) ||
        (showCyan && d.sleepDisorder === 2)
    );

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d) => d.x) || 10])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, (d) => d.y) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // Create scale for size mapping
    const sizeScale = d3.scaleLinear().domain([1, 4]).range([5, 15]);

    const svg_graph = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Store svg_graph in ref for access outside useEffect
    svgGraphRef.current = svg_graph;

    // Define clip path
    svg_graph
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom);

    // Add grid lines
    const xAxisGrid = d3.axisBottom(x)
      .ticks(10)
      .tickSize(-height + margin.top + margin.bottom)
      .tickFormat("");

    const yAxisGrid = d3.axisLeft(y)
      .ticks(10)
      .tickSize(-width + margin.left + margin.right)
      .tickFormat("");

    // X Axis
    const xAxisGroup = svg_graph
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    xAxisGroup.call(d3.axisBottom(x).ticks(10));

    xAxisGroup
      .selectAll("text")
      .style("font-size", "18px")
      .style("fill", "white");

    // X Axis Grid
    const xGridGroup = svg_graph
      .append("g")
      .attr("class", "x-grid")
      .attr("transform", `translate(0,${height - margin.bottom})`);

    xGridGroup.call(xAxisGrid)
      .selectAll("line")
      .style("stroke", "gray")
      .style("stroke-opacity", 0.2);

    xGridGroup.selectAll("path").remove();

    // X Axis Label
    svg_graph
      .append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 50)
      .attr("fill", "white")
      .style("font-size", "18px")
      .style("text-anchor", "middle")
      .text("Total Years as Dispatcher");

    // Y Axis
    const yAxisGroup = svg_graph
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},0)`);

    yAxisGroup.call(d3.axisLeft(y).ticks(10));

    yAxisGroup
      .selectAll("text")
      .style("font-size", "18px")
      .style("fill", "white");

    // Y Axis Grid
    const yGridGroup = svg_graph
      .append("g")
      .attr("class", "y-grid")
      .attr("transform", `translate(${margin.left},0)`);

    yGridGroup.call(yAxisGrid)
      .selectAll("line")
      .style("stroke", "gray")
      .style("stroke-opacity", 0.2);

    yGridGroup.selectAll("path").remove();

    // Y Axis Label
    svg_graph
      .append("text")
      .attr("class", "y-axis-label")
      .attr("x", -height / 2)
      .attr("y", margin.left - 50)
      .attr("fill", "white")
      .style("font-size", "18px")
      .style("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Daily Caffeine Intake (cups)");

    // Tooltip element
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "rgba(0, 0, 0, 0.7)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Circles Group with clip path
    const circlesGroup = svg_graph
      .append("g")
      .attr("class", "circles")
      .attr("clip-path", "url(#clip)");

    // Bind data to circles and handle enter, update, and exit selections
    const circles = circlesGroup
      .selectAll("circle")
      .data(filteredData, (d) => d.id);

    // Exit selection: Animate circles as they disappear
    circles
      .exit()
      .transition()
      .duration(500) // Duration of the exit animation
      .attr("opacity", 0)
      .remove();

    // Update selection: Update existing circles with new data
    circles
      .transition()
      .duration(500)
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", (d) => sizeScale(d.sleepLoss)) // Set radius based on Sleep_loss
      .attr("fill", (d) => (d.sleepDisorder === 1 ? "#FF6EC7" : "cyan")) // Change colour based on sleep disorder
      .attr("opacity", 0.7);

    // Enter selection: Animate new circles as they appear
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 0) // Start with radius 0 for animation
      .attr("fill", (d) => (d.sleepDisorder === 1 ? "#FF6EC7" : "cyan")) // Change colour based on sleep disorder
      .attr("opacity", 0)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 2);
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>Total Years as Dispatcher:</strong> ${d.x}<br/>
             <strong>Daily Caffeine Intake (cups):</strong> ${d.y}<br/>
             <strong>Sleep Disorder:</strong> ${d.sleepDisorder === 1 ? "Diagnosed" : "Not Diagnosed"}<br/>
             <strong>Sleep Loss:</strong> ${d.sleepLoss}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", null);
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(500)
      .attr("r", (d) => sizeScale(d.sleepLoss))
      .attr("opacity", 0.7);

    // Define the zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([1, 10]) // Adjust the scale extent as needed
      .translateExtent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on("zoom", zoomed);

    // Store zoom in ref for access outside useEffect
    zoomRef.current = zoom;

    svg_graph.call(zoom);

    // Zoom event handler
    function zoomed(event) {
      // Create new scales based on the event's transform
      const new_x = event.transform.rescaleX(x);
      const new_y = event.transform.rescaleY(y);

      // Update axes with new scales
      svg_graph
        .select(".x-axis")
        .call(d3.axisBottom(new_x).ticks(10))
        .selectAll("text")
        .style("font-size", "18px")
        .style("fill", "white");

      svg_graph
        .select(".y-axis")
        .call(d3.axisLeft(new_y).ticks(10))
        .selectAll("text")
        .style("font-size", "18px")
        .style("fill", "white");

      // Update grid lines
      xGridGroup
        .call(
          d3.axisBottom(new_x)
            .ticks(10)
            .tickSize(-height + margin.top + margin.bottom)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "gray")
        .style("stroke-opacity", 0.2);

      xGridGroup.selectAll("path").remove();

      yGridGroup
        .call(
          d3.axisLeft(new_y)
            .ticks(10)
            .tickSize(-width + margin.left + margin.right)
            .tickFormat("")
        )
        .selectAll("line")
        .style("stroke", "gray")
        .style("stroke-opacity", 0.2);

      yGridGroup.selectAll("path").remove();

      // Update circle positions with new scales
      circlesGroup
        .selectAll("circle")
        .attr("cx", (d) => new_x(d.x))
        .attr("cy", (d) => new_y(d.y));

      // Optionally, update axis labels if needed
      svg_graph
        .select(".x-axis-label")
        .attr("x", (new_x.range()[0] + new_x.range()[1]) / 2);

      svg_graph
        .select(".y-axis-label")
        .attr("x", -((new_y.range()[0] + new_y.range()[1]) / 2));
    }
  }, [chartData, showPink, showCyan]);

  // Zoom control functions
  function zoomIn() {
    if (svgGraphRef.current && zoomRef.current) {
      svgGraphRef.current
        .transition()
        .duration(500)
        .call(zoomRef.current.scaleBy, 1.2);
    }
  }

  function zoomOut() {
    if (svgGraphRef.current && zoomRef.current) {
      svgGraphRef.current
        .transition()
        .duration(500)
        .call(zoomRef.current.scaleBy, 0.8);
    }
  }

  function resetZoom() {
    if (svgGraphRef.current && zoomRef.current) {
      svgGraphRef.current
        .transition()
        .duration(500)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 200px)", // Offset due to footer
        color: "white",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          border: "2px solid white",
          padding: "10px",
          borderRadius: "8px",
          backgroundColor: "transparent",
          marginTop: "30px",
        }}
      >
        <h3
          style={{
            color: "white",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          Interactive Legend:
        </h3>

        <span>Click here to filter data</span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={showPink}
            onChange={(e) => togglePink(e.target.checked)}
            style={{
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          />
          <div
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              backgroundColor: "#FF6EC7",
            }}
          />
          <label style={{ color: "#FF6EC7" }}>
            Diagnosed With Sleep Disorder
          </label>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <input
            type="checkbox"
            checked={showCyan}
            onChange={(e) => toggleCyan(e.target.checked)}
            style={{
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          />
          <div
            style={{
              width: "15px",
              height: "15px",
              borderRadius: "50%",
              backgroundColor: "cyan",
            }}
          />
          <label style={{ color: "cyan" }}>
            Not Diagnosed With Sleep Disorder
          </label>
        </div>

        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <p
            style={{
              fontSize: "14px",
              color: "white",
              marginBottom: "5px",
            }}
          >
            Circle Size Represents Stress:
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexDirection: "column",
            }}
          >
            {[
              "No Stress",
              "A Little Stress",
              "Stressful",
              "Very Stressful",
            ].map((label, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: `${5 + index * 5}px`,
                    height: `${5 + index * 5}px`,
                    borderRadius: "50%",
                    backgroundColor: "white",
                    border: "1px solid black",
                  }}
                />
                <span style={{ fontSize: "12px", color: "white" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zoom Controls */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "white",
              marginBottom: "5px",
            }}
          >
            Click Here for Zoom Controls:
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <button
              onClick={zoomIn}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              +
            </button>
            <button
              onClick={zoomOut}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              -
            </button>
            <button
              onClick={resetZoom}
              style={{
                padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <h2 style={{ marginBottom: "20px", fontSize: "24px" }}>
        Daily Caffeine Intake, Total Years as Dispatcher and the Resulting Sleep Loss
      </h2>

      <svg ref={svgRef}></svg>
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <GraphOne />
    </div>
  );
}