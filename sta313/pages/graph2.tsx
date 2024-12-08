import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface UserInput {
  Sleep_loss: number;
  Total_life_events: number;
  Job_pressure: number;
  Resp_for_others_safety: number;
  Inadeq_Staff: number;
  TimeOff: number;
  BreakTime: number;
  Age_Group: string; // Example: "20-29"
}

export function GraphTwo() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [minMaxValues, setMinMaxValues] = useState<any>({});
  const [userInput, setUserInput] = useState<UserInput>({
    Sleep_loss: 1,
    Total_life_events: 0,
    Job_pressure: 1,
    Resp_for_others_safety: 1,
    Inadeq_Staff: 1,
    TimeOff: 1,
    BreakTime: 1,
    Age_Group: "20-29",
  });
  const [userRiskIndex, setUserRiskIndex] = useState<[number, string] | null>(
    null
  );
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/data/data.csv")
      .then((response) => response.text())
      .then((text) => {
        const rows = d3.csvParse(text);

        // Helper to calculate min and max
        const calculateMinMax = (values: number[]) => ({
          min: Math.min(...values),
          max: Math.max(...values),
        });

        // Extract relevant columns and calculate min/max
        const minMax = {
          Sleep_loss: calculateMinMax(rows.map((d) => +d["Sleep_loss"] || 0)),
          Total_life_events: calculateMinMax(
            rows.map((d) => +d["Total_life_events"] || 0)
          ),
          Job_pressure: calculateMinMax(
            rows.map((d) => +d["Job_pressure"] || 0)
          ),
          Resp_for_others_safety: calculateMinMax(
            rows.map((d) => +d["Resp_for_others_safety"] || 0)
          ),
          Inadeq_Staff: calculateMinMax(
            rows.map((d) => +d["Inadeq_Staff"] || 0)
          ),
          TimeOff: calculateMinMax(rows.map((d) => +d["TimeOff"] || 0)),
          BreakTime: calculateMinMax(rows.map((d) => +d["BreakTime"] || 0)),
        };

        setMinMaxValues(minMax);

        // Normalize function
        const normalize = (values: number[], min: number, max: number) =>
          values.map((v) => (v - min) / (max - min));

        // Calculate Sleep Risk Index
        const sleepRiskIndices = rows.map((_, i) => {
          const factors = [
            normalize(
              rows.map((d) => +d["Sleep_loss"] || 0),
              minMax.Sleep_loss.min,
              minMax.Sleep_loss.max
            )[i],
            normalize(
              rows.map((d) => +d["Total_life_events"] || 0),
              minMax.Total_life_events.min,
              minMax.Total_life_events.max
            )[i],
            normalize(
              rows.map((d) => +d["Job_pressure"] || 0),
              minMax.Job_pressure.min,
              minMax.Job_pressure.max
            )[i],
            normalize(
              rows.map((d) => +d["Resp_for_others_safety"] || 0),
              minMax.Resp_for_others_safety.min,
              minMax.Resp_for_others_safety.max
            )[i],
            normalize(
              rows.map((d) => +d["Inadeq_Staff"] || 0),
              minMax.Inadeq_Staff.min,
              minMax.Inadeq_Staff.max
            )[i],
            normalize(
              rows.map((d) => +d["TimeOff"] || 0),
              minMax.TimeOff.min,
              minMax.TimeOff.max
            )[i],
            normalize(
              rows.map((d) => +d["BreakTime"] || 0),
              minMax.BreakTime.min,
              minMax.BreakTime.max
            )[i],
          ];
          return (
            factors.reduce((sum, value) => sum + value, 0) / factors.length
          );
        });

        const ageGroupMapping: { [key: string]: string } = {
          1: "20-29",
          2: "30-39",
          3: "40-49",
          4: "50-59",
          5: "60+",
        };

        const parsedData = rows
          .filter((d) => {
            const ageGroup = +d["Age_Group"];
            return (
              d["Diagnosed_Sleep_disorder"] === "1" && ageGroupMapping[ageGroup]
            );
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
    renderChart();
  }, [chartData, userRiskIndex]);

  const renderChart = () => {
    if (!svgRef.current || !containerRef.current || chartData.length === 0)
      return;

    // Dimensions
    const containerWidth = 800;
    const containerHeight = 500;

    const margin = { top: 90, right: 40, bottom: 90, left: 100 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const ageGroupOrder = ["30-39", "40-49", "50-59", "60+"];

    const xScale = d3
      .scalePoint()
      .domain(ageGroupOrder)
      .range([margin.left, width + margin.left])
      .padding(0.5);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height + margin.top, margin.top]);

    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["true", "false"])
      .range(["#ff7f0e", "#1f77b4"]);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

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
      .style("opacity", 0)
      .style("font-size", "20px");

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0,${height + margin.top})`)
      .call(d3.axisBottom(xScale))
      .style("font-size", "20px");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2 + margin.left) // Center it along the X-axis
      .attr("y", height + margin.top + 60) // Position it below the X-axis
      .style("font-size", "24px") // Adjust font size
      .style("fill", "white") // Optional: Set label color
      .text("Age Groups"); // Text content for the X-axis label

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".0%")))
      .style("font-size", "20px");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2 - margin.top) // Center it along the Y-axis, accounting for rotation
      .attr("y", margin.left - 70) // Position it to the left of the Y-axis
      .attr("transform", "rotate(-90)") // Rotate the label for the Y-axis
      .style("font-size", "24px") // Adjust font size
      .style("fill", "white") // Optional: Set label colo
      .text("Sleep Risk Index Percentage"); // Text content for the Y-axis label

    // Bubbles
    svg
      .append("g")
      .selectAll("circle")
      .data(chartData)
      .join("circle")
      .attr("cx", (d) => xScale(d.ageGroup) || 0)
      .attr("cy", (d) => yScale(d.sleepRisk) || 0)
      .attr("r", 10)
      .attr("fill", (d) => colorScale(d.hasDisorder.toString()))
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 0.8);
        tooltip.style("opacity", 1).html(
          `<strong>Age Group:</strong> ${d.ageGroup}<br/>
             <strong>Sleep Risk Index:</strong> ${(d.sleepRisk * 100).toFixed(
               2
             )}%`
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

    // Plot User Input Risk Index
    if (userRiskIndex !== null) {
      const [riskIndex, ageGroup] = userRiskIndex; // Destructure tuple
      svg
        .append("text")
        .attr("x", xScale(userInput.Age_Group) || 0)
        .attr("y", yScale(riskIndex) || 0)
        .text("X")
        .attr("font-size", "24px")
        .attr("fill", "red")
        .attr("text-anchor", "middle");
    }
  };

  const normalizeValue = (value: number, min: number, max: number) =>
    (value - min) / (max - min);

  const calculateUserRiskIndex = () => {
    const {
      Sleep_loss,
      Total_life_events,
      Job_pressure,
      Resp_for_others_safety,
      Inadeq_Staff,
      TimeOff,
      BreakTime,
      Age_Group,
    } = userInput;

    const normalizedFactors = [
      normalizeValue(
        Sleep_loss,
        minMaxValues.Sleep_loss.min,
        minMaxValues.Sleep_loss.max
      ),
      normalizeValue(
        Total_life_events,
        minMaxValues.Total_life_events.min,
        minMaxValues.Total_life_events.max
      ),
      normalizeValue(
        Job_pressure,
        minMaxValues.Job_pressure.min,
        minMaxValues.Job_pressure.max
      ),
      normalizeValue(
        Resp_for_others_safety,
        minMaxValues.Resp_for_others_safety.min,
        minMaxValues.Resp_for_others_safety.max
      ),
      normalizeValue(
        Inadeq_Staff,
        minMaxValues.Inadeq_Staff.min,
        minMaxValues.Inadeq_Staff.max
      ),
      normalizeValue(
        TimeOff,
        minMaxValues.TimeOff.min,
        minMaxValues.TimeOff.max
      ),
      normalizeValue(
        BreakTime,
        minMaxValues.BreakTime.min,
        minMaxValues.BreakTime.max
      ),
    ];

    const riskIndex =
      normalizedFactors.reduce((sum, val) => sum + +val, 0) /
      normalizedFactors.length;

    setUserRiskIndex([riskIndex, Age_Group]); // Set the tuple with riskIndex and Age_Group
  };

  const ageGroupOptions = ["30-39", "40-49", "50-59", "60+"];

  const labelsMap: { [key: string]: string } = {
    Sleep_loss: "Sleep Loss",
    Job_pressure: "Job Pressure",
    Resp_for_others_safety: "Responsibility for Others' Safety",
    Inadeq_Staff: "Inadequate Staff",
    TimeOff: "Time Off",
    BreakTime: "Break Time",
  };

  useEffect(() => {
    const handleResize = () => {
      renderChart(); // Call your render function to adapt dimensions
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        // position: "relative",
        alignContent: "center",
        marginBottom: "25%",
        color: "white",
        overflow: "auto",
        gap: "20px", // Adds space between graph and controls
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <h1
        style={{
          color: "white",
          textAlign: "center",
          fontSize: "48px", // Increase font size
          fontWeight: "bold", // Make it bold
          paddingBottom: "20px"
        }}
      >
        How does the sleep risk index change with respect to age?
      </h1>

      <div
        style={{
          fontSize: "16px",
          color: "white",
          lineHeight: "1.6", // Improves readability
          marginBottom: "20px",
        }}
      >
        <p>
          The <strong>Sleep Risk Index</strong> is calculated using a
          combination of key variables that represent workplace and life
          stressors. These include:
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
                <th style={{ borderBottom: "2px solid white", padding: "8px" }}>
                  Variable
                </th>
                <th style={{ borderBottom: "2px solid white", padding: "8px" }}>
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Sleep Loss</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The degree of stress experienced due to insufficient or
                  poor-quality sleep.
                </td>
              </tr>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Total Life Events</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The number of significant life changes or challenges impacting
                  an individual’s stress levels.
                </td>
              </tr>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Job Pressure</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The level of stress arising from high workloads and demanding
                  job responsibilities.
                </td>
              </tr>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Responsibility for Others’ Safety</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The stress associated with ensuring the safety and well-being
                  of others in the workplace.
                </td>
              </tr>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Inadequate Staffing</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The stress caused by insufficient staffing levels leading to
                  increased workloads.
                </td>
              </tr>
              <tr>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  <strong>Time Off</strong>
                </td>
                <td style={{ borderBottom: "1px solid gray", padding: "8px" }}>
                  The availability and quality of recovery time from
                  work-related duties.
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px" }}>
                  <strong>Break Time</strong>
                </td>
                <td style={{ padding: "8px" }}>
                  The frequency and adequacy of breaks during work hours.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <svg
          ref={svgRef}
          style={{
            height: "40vh",
            width: "100%",
          }}
          viewBox={`0 0 ${800} ${500}`} // Replace with your actual dimensions
          preserveAspectRatio="xMidYMid meet"
        ></svg>
      </div>
      <div
        style={{
          flex: 1,
          padding: "20px",
          color: "white",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <h3>Enter Your Data</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {Object.keys(userInput).map((key) => (
            <div
              key={key}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px"
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  marginBottom: "4px",
                }}
              >
                {labelsMap[key] || key.replace(/_/g, " ")}{" "}
                {/* Use the custom label */}
              </label>
              {key === "Age_Group" ? (
                <select
                  value={userInput.Age_Group}
                  onChange={(e) =>
                    setUserInput({
                      ...userInput,
                      Age_Group: e.target.value,
                    })
                  }
                  style={{
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid white",
                    background: "#2a2a2a",
                    color: "white",
                    fontSize: "14px",
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  {ageGroupOptions.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              ) : [
                  "Sleep_loss",
                  "Job_pressure",
                  "Resp_for_others_safety",
                  "Inadeq_Staff",
                  "TimeOff",
                  "BreakTime",
                ].includes(key) ? (
                <select
                  value={userInput[key as keyof UserInput]}
                  onChange={(e) =>
                    setUserInput({
                      ...userInput,
                      [key]: parseInt(e.target.value, 10),
                    })
                  }
                  style={{
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid white",
                    background: "#2a2a2a",
                    color: "white",
                    fontSize: "14px",
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  <option value="1">No Stress</option>
                  <option value="2">A Little Stress</option>
                  <option value="3">Stressful</option>
                  <option value="4">Very Stressful</option>
                </select>
              ) : (
                <input
                  type="number"
                  value={userInput[key as keyof UserInput]} // Explicit cast
                  onChange={(e) =>
                    setUserInput({
                      ...userInput,
                      [key]: +e.target.value,
                    })
                  }
                  style={{
                    padding: "4px",
                    borderRadius: "4px",
                    border: "1px solid white",
                    background: "#2a2a2a",
                    color: "white",
                    fontSize: "14px",
                    textAlign: "center",
                    width: "80px", // Consistent input width
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <button
          onClick={calculateUserRiskIndex}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#ff7f0e",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Calculate and Plot Risk Index
        </button>
      </div>
      <div
        style={{
          marginLeft: "20px",
          flex: 1,
          display: "flex",
          gap: "20px",
          flexWrap: "wrap", // Allows wrapping if screen size is small
          maxWidth: "100%",
        }}
      >
        {/* First Column */}
        <div style={{ flex: 1, minWidth: "300px" }}>
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
            <strong style={{ fontWeight: "bold" }}>30-39</strong> group show
            generally lower Sleep Risk Index values, indicating younger
            individuals are at comparatively lower risk.
          </p>
        </div>

        {/* Second Column */}
        <div style={{ flex: 1, minWidth: "300px" }}>
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
        width: "100%",
        height: "100%",
      }}
    >
      <GraphTwo />
    </div>
  );
}
