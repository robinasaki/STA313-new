import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function GraphOne() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [showPink, togglePink] = useState(true); // Filter for Diagnosed with Sleep Disorder
  const [showCyan, toggleCyan] = useState(true); // Filter for Not Diagnosed with Sleep Disorder
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Get CSV Data
  useEffect(() => {
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        setChartData(d3.csvParse(text));
      })
  }, []);

  useEffect(() => {
    if (chartData.length === 0 || !svgRef.current || !containerRef.current) {
      return;
    }

    // Clear any previous content in the SVG
    d3.select(svgRef.current).selectAll("*").remove();


    const width = containerRef.current.clientWidth;
    const height = window.innerHeight * 0.8; // To account for vertical arrangment
    const margin = {
      top: height * 0.1,
      right: width * 0.05,
      bottom: height * 0.15,
      left: width * 0.12,
    };

    // Parse the data and handle missing or invalid values
    const parsedData = chartData
      .map(d => ({
        x: + d["Total_years_dispatcher"] || 0,
        y: + d["If_yes_how_many_daily"] || 0,
        sleepDisorder: + d["Diagnosed_Sleep_disorder"],
        sleepLoss: + d["Sleep_loss"] || 1
      }))
      .filter(d => d.x > 0 && d.y > 0); // Filter out invalid entries

    // Filter data based on checkboxes
    const filteredData = parsedData.filter(
      d => (showPink && d.sleepDisorder === 1) || (showCyan && d.sleepDisorder === 2)
    );

    const x = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, d => d.x) || 10])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(parsedData, d => d.y) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    // create scale for size mapping
    const sizeScale = d3.scaleLinear().domain([1, 4]).range([5, 15]); 

    const svg_graph = d3.select(svgRef.current).attr("width", width).attr("height", height);

    svg_graph.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(10))
      .selectAll("text")
      .style("font-size", "18px")
      .style("fill", "white");

    svg_graph.append("text")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 50)
      .attr("fill", "white")
      .style("font-size", "18px")
      .style("text-anchor", "middle")
      .text("Total Years as Dispatcher");

    svg_graph.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(10))
      .selectAll("text")
      .style("font-size", "18px")
      .style("fill", "white");

    svg_graph.append("text")
      .attr("x", -height / 2)
      .attr("y", margin.left - 50)
      .attr("fill", "white")
      .style("font-size", "18px")
      .style("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .text("Daily Caffeine Intake (cups)");

    svg_graph.append("g")
      .selectAll("circle")
      .data(filteredData)
      .join("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", d => sizeScale(d.sleepLoss)) // Set radius based on Sleep_loss
      .attr("fill", d => (d.sleepDisorder === 1 ? "#FF6EC7" : "cyan")) // Change colour based on sleep disorder
      .attr("opacity", 0.7);

  }, [chartData, showPink, showCyan]);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "calc(100vh - 200px)", // offset due to footer
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
        }}>
          <h3 style={{ color: "white", marginBottom: "10px", textAlign: "center" }}>
            Legend:
          </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input 
              type="checkbox" 
              checked={showPink} 
              onChange={e => togglePink(e.target.checked)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            />
            <div style={{width: "15px", height: "15px", borderRadius: "50%", backgroundColor: "#FF6EC7"}} />
            <label style={{ color: "#FF6EC7" }}>Diagnosed With Sleep Disorder</label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input 
              type="checkbox" 
              checked={showCyan} 
              onChange={e => toggleCyan(e.target.checked)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            />
            <div style={{width: "15px", height: "15px", borderRadius: "50%", backgroundColor: "cyan"}} />
            <label style={{ color: "cyan" }}>Not Diagnosed With Sleep Disorder</label>
            </div>

          <div style={{ marginTop: "10px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", color: "white", marginBottom: "5px" }}>
              Circle Size Represents Stress:
            </p>
            <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
              {["No Stress", "A Little Stress", "Stressful", "Very Stressful"].map(
                (label, index) => (
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
                      }}/>
                    <span style={{ fontSize: "12px", color: "white" }}>{label}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

      <h2 style={{ marginBottom: "20px", fontSize: "24px" }}>
        Daily Caffeine Intake vs. Total Years as Dispatcher
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
