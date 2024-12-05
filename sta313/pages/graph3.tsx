import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function GraphThree() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [showWithDisorder, toggleWithDisorder] = useState(true);
  const [showWithoutDisorder, toggleWithoutDisorder] = useState(true);

  // Interactive filters
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState([0, 50]); // Range slider: min and max years of experience

  const stressVars = [
    "Lack_of_control",
    "Job_pressure",
    "Scanty_Rules",
    "Emergencies",
    "Mgmt_policies",
    "Inadeq_Staff",
    "Surges_in_work",
    "Communication",
    "Resp_for_others_safety",
  ];

  const stressLabels = [
    "Lack of Control",
    "Job Pressure",
    "Scanty Rules",
    "Emergencies",
    "Management Policies",
    "Inadequate Staff",
    "Work Surges",
    "Communication",
    "Safety Responsibility",
  ];

  // Add legend items dynamically
  const legendItems = [
    { level: 1, description: "No Stress" },
    { level: 2, description: "A Little Stress" },
    { level: 3, description: "Stressful" },
    { level: 4, description: "Very Stressful" },
    { level: 5, description: "Extremely Stressful" },
  ];

  const levels = 4;
  const maxValue = 5;

  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    // Fetch and load the data
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        const parsedData = d3.csvParse(text);
        // Filter out invalid `Diagnosed_Sleep_disorder` values
        const validData = parsedData.filter(
          (d) =>
            d.Diagnosed_Sleep_disorder === "1" ||
            d.Diagnosed_Sleep_disorder === "2"
        );
        setChartData(validData);
      });
  }, []);

  useEffect(() => {
    if (!chartData.length) return;

    const width = 600;
    const height = 600;
    const margin = { top: 15, right: 50, bottom: 0, left: 50 };
    const radius = Math.min(width, height) / 2 - 100;

    // Filter data based on user-selected filters
    const filteredChartData = chartData.filter((d) => {
      // Filter by marital status
      if (
        maritalStatusFilter !== "all" &&
        d.Marital_Status !== maritalStatusFilter
      ) {
        return false;
      }
      // Filter by age group
      if (ageFilter !== "all" && d.Age_Group !== ageFilter) {
        return false;
      }
      // Filter by experience
      const experience = +d.Total_years_dispatcher;
      if (
        experience < experienceFilter[0] ||
        experience > experienceFilter[1]
      ) {
        return false;
      }
      return true;
    });

    // Group and process data
    const groupedData = d3.group(
      filteredChartData,
      (d) => d.Diagnosed_Sleep_disorder
    );

    const processedData = Array.from(groupedData, ([key, group]) => {
      const averages = stressVars.map((varName) => {
        const values = group.map((d) => +d[varName]);
        return d3.mean(values);
      });
      return {
        group: key === "1" ? "With Sleep Disorder" : "Without Sleep Disorder",
        values: averages,
      };
    }).filter(
      (d) =>
        (d.group === "With Sleep Disorder" && showWithDisorder) ||
        (d.group === "Without Sleep Disorder" && showWithoutDisorder)
    );

    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();

    const svg = d3
      .select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr(
        "transform",
        `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`
      )
      .attr("padding", 50);

    const angleSlice = (Math.PI * 2) / stressLabels.length;
    const radiusScale = d3
      .scaleLinear()
      .range([0, radius])
      .domain([0, maxValue]);

    // Draw grid circles
    for (let i = 1; i <= levels; i++) {
      svg
        .append("circle")
        .attr("r", (radius / levels) * i)
        .attr("fill", "none")
        .attr("stroke", "#ccc");
    }

    // Add grid labels
    svg
      .selectAll(".grid-label")
      .data(d3.range(1, levels + 1))
      .enter()
      .append("text")
      .attr("y", (d) => -radiusScale(d))
      .attr("dy", "-0.3em")
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .text((d) => d);

    // Draw axes
    const axis = svg
      .selectAll(".axis")
      .data(stressLabels)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr(
        "x2",
        (d, i) => radiusScale(maxValue) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y2",
        (d, i) => radiusScale(maxValue) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("stroke", "#333");

    axis
      .append("text")
      .attr(
        "x",
        (d, i) =>
          radiusScale(maxValue + 0.5) * Math.cos(angleSlice * i - Math.PI / 2)
      )
      .attr(
        "y",
        (d, i) =>
          radiusScale(maxValue + 0.5) * Math.sin(angleSlice * i - Math.PI / 2)
      )
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text((d) => d);

    // Radar line generator
    const radarLine = d3
      .lineRadial()
      .curve(d3.curveCardinalClosed)
      .radius((d) => radiusScale(d))
      .angle((d, i) => i * angleSlice);

    // Draw radar chart areas
    const radarGroup = svg
      .selectAll(".radar-group")
      .data(processedData)
      .enter()
      .append("g")
      .attr("class", "radar-group");

    radarGroup
      .append("path")
      .attr("d", (d) => radarLine(d.values))
      .attr("fill", (d) =>
        d.group === "With Sleep Disorder" ? "blue" : "orange"
      )
      .attr("fill-opacity", 0.4)
      .attr("stroke", (d) =>
        d.group === "With Sleep Disorder" ? "blue" : "orange"
      )
      .attr("stroke-width", 2);

    radarGroup
      .selectAll(".radar-point")
      .data((d) =>
        d.values.map((v, i) => ({
          value: v,
          label: stressLabels[i],
          group: d.group,
        }))
      )
      .enter()
      .append("circle")
      .attr(
        "cx",
        (d) =>
          radiusScale(d.value) *
          Math.cos(angleSlice * stressLabels.indexOf(d.label) - Math.PI / 2)
      )
      .attr(
        "cy",
        (d) =>
          radiusScale(d.value) *
          Math.sin(angleSlice * stressLabels.indexOf(d.label) - Math.PI / 2)
      )
      .attr("r", 4)
      .attr("fill", "black");

    d3.select("#legend-container").selectAll("*").remove();

    const legendContainer = d3
      .select("#legend-container")
      .append("div")
      .style("marginTop", "10px") // Space above the legend
      .style("padding", "1px") // Padding inside the box
      .style("border", "3px solid #ccc") // Border for the box
      .style("borderRadius", "25px") // Rounded corners
      .style("backgroundColor", "black") // Light blue background color
      .style("boxShadow", "0 4px 8px rgba(0, 0, 0, 0.1)") // Subtle shadow for depth
      .style("width", "200px")
      .style("textAlign", "center") // Center-align the text
      .style("display", "inline-block") // Ensures box width adjusts to content
      .style("marginLeft", "1px")
      .style("height", "150px");

    // Add legend title
    legendContainer
      .append("strong")
      .text("Legend:")
      .style("display", "block")
      .style("marginBottom", "10px");

    legendContainer
      .selectAll("div")
      .data(legendItems)
      .enter()
      .append("div")
      .style("marginBottom", "5px")
      .style("color", "#333") // Text color
      .text((d) => `${d.level}: ${d.description}`);
  }, [
    chartData,
    showWithDisorder,
    showWithoutDisorder,
    maritalStatusFilter,
    ageFilter,
    experienceFilter,
  ]);

  return (
    <div
      style={{
        color: "black", // Set font color
        fontSize: "16px", // Optional: Set font size
        fontWeight: "bold", // Optional: Set font weight
      }}
    >
      <div>
        <label>
          <input
            type="checkbox"
            checked={showWithDisorder}
            onChange={() => toggleWithDisorder(!showWithDisorder)}
          />
          Show With Sleep Disorder
        </label>
        <label>
          {" "}
          <input
            type="checkbox"
            checked={showWithoutDisorder}
            onChange={() => toggleWithoutDisorder(!showWithoutDisorder)}
          />{" "}
          Show Without Sleep Disorder
        </label>
      </div>
      <div>
        {" "}
        <label>
          {" "}
          Marital Status:{" "}
          <select
            value={maritalStatusFilter}
            onChange={(e) => setMaritalStatusFilter(e.target.value)}
          >
            <option value="all">All</option>{" "}
            <option value="1">Not Married</option>{" "}
            <option value="2">Married</option>{" "}
          </select>
        </label>{" "}
      </div>{" "}
      <div>
        {" "}
        <label>
          {" "}
          Age Group:{" "}
          <select
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
          >
            {" "}
            <option value="all">All</option> <option value="1.00">20-29</option>{" "}
            <option value="2.00">30-39</option>{" "}
            <option value="3.00">40-49</option>{" "}
            <option value="4.00">50-59</option>{" "}
            <option value="5.00">60+</option>{" "}
          </select>{" "}
        </label>{" "}
      </div>{" "}
      <div>
        {" "}
        <label>
          {" "}
          Years of Experience:{" "}
          <input
            type="range"
            min="0"
            max="50"
            value={experienceFilter[0]}
            onChange={(e) =>
              setExperienceFilter([+e.target.value, experienceFilter[1]])
            }
          />{" "}
          to{" "}
          <input
            type="range"
            min="0"
            max="50"
            value={experienceFilter[1]}
            onChange={(e) =>
              setExperienceFilter([experienceFilter[0], +e.target.value])
            }
          />{" "}
          <span>
            {" "}
            {experienceFilter[0]} - {experienceFilter[1]} years{" "}
          </span>{" "}
        </label>{" "}
      </div>{" "}
      <div style={{ display: "flex", marginTop: "5%" }}>
        <svg ref={chartRef}></svg> 
        <div id="legend-container"></div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // Stack children vertically
        justifyContent: "flex-start", // Align at the top
        alignItems: "center",
        height: "100%", // Full height of the viewport
        textAlign: "center",
        paddingTop: "1px", // Add padding equal to the height of your sticky header
        boxSizing: "border-box", // Ensure padding doesn't affect width
        // margin: "2%",
        overflow: "auto",
        paddingBottom: "10%"
      }}
    >
      <div style={{ width: "100%", margin: "2%" }}>
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
          The Stress Factor: How Sleep Disorders Amplify Stress
        </h2>

        <p style={{ textAlign: "left", padding: ".5%", paddingLeft: "3%", paddingRight: "3%" }}>
          A dispatcher who has to do physically intensive work every morning has
          multiple kinds of stress he/she is going through, work-related, job
          pressure, work surges, management policies, and many more.{" "}
        </p>

        <p style={{ textAlign: "left", padding: ".5%", paddingLeft: "3%", paddingRight: "3%" }}>
          Now imagine the despatcher getting a sleep disorder. Our study found
          that sleep disorders increase the intensity of these stressors,
          highlighting the problems workers go through with work pressure and
          disrupted sleep patterns.
        </p>

        <p style={{ textAlign: "left", padding: ".5%", paddingLeft: "3%", paddingRight: "3%" }}>
          The question we studied is: How does a sleep disorder amplify stress?
          We created the following chart that depicts the average stress for a
          dispatcher (with or without sleep disorder) for a list of stressors
          listed below. The chart can be filtered for age, experience at work,
          and marital status.
        </p>

        <div
          style={{
            marginTop: "1%",
            textAlign: "center",
            overflowX: "auto",
            alignContent: "center",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <table
            style={{
              borderCollapse: "collapse",
              textAlign: "center",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "10px",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  Stressor
                </th>
                <th
                  style={{
                    padding: "10px",
                    borderBottom: "2px solid #ccc",
                  }}
                >
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Lack of Control
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress arising from an inability to influence workplace
                  decisions or processes.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Job Pressure
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress related to heavy workloads, tight deadlines, or high
                  performance expectations.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Scanty Rules
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress caused by unclear or insufficient workplace guidelines
                  and policies.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Emergencies
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress resulting from handling unpredictable and high-stakes
                  situations.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Management Policies
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress stemming from disagreements or challenges with
                  workplace management or policies.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Inadequate Staff
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress caused by insufficient staff to handle the workload.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Work Surges
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress from sudden increases in work demand.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Communication
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress due to unclear, insufficient, or ineffective
                  communication in the workplace.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Safety Responsibility
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  Stress related to ensuring the safety and well-being of others
                  as part of the job.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          width: "1000px", // Adjust based on the size of your graph
          height: "800px", // Adjust based on the size of your graph
          backgroundColor: "#f9f9f9", // Light background color for the box
          border: "1px solid #ccc", // Border around the box
          borderRadius: "10px", // Rounded corners for the box
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Subtle shadow for depth
          padding: "20px", // Padding inside the box
          // display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <GraphThree />
      </div>

      <div style={{ marginTop: "20px", textAlign: "left", height: "100%", overflow: "auto", padding: "10px", marginBottom: "2px", overflowY: "auto", display: "block",maxHeight: "400px" }}>
        <h2 style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>
          Key Insights:
        </h2>
        <ul style={{ fontSize: "16px", lineHeight: "1.8", paddingLeft: "20px", overflow: "auto", overflowY: "auto", listStyleType: "disc" }}>
          <li> Stressors amplify in general if a dispatcher has a sleep disorder</li>
          <li>The Average amplification of the stressors is much more if a person is unmarried</li>
          <li>As the age group increases, the amplification of stressors also increase</li>
          <li>As the years of experience increase, the amplification of stressors also increase</li>
        </ul>
     </div>
    </div>
  );
}
