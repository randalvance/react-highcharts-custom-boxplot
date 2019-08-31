import React from "react";
import ReactDOM from "react-dom";
import Highcharts from "highcharts";
import HighchartsMore from "highcharts/highcharts-more";
import HighchartsReact from "highcharts-react-official";

import "./styles.css";

HighchartsMore(Highcharts);

const displaySortedProperties = obj => {
  return Object.keys(obj)
    .sort()
    .reduce(
      (result, key) => ({
        ...result,
        [key]: obj[key]
      }),
      {}
    );
};

const HighchartsBoxPlotPlus = function(H) {
  H.wrap(H.seriesTypes.boxplot.prototype, "translate", function(proceed) {
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    this.points.forEach(p => {
      if (p.current !== null) {
        p.currentPlot = this.yAxis.translate(p.current, 0, 1, 0, 1);
      }
    });
  });

  H.wrap(H.seriesTypes.boxplot.prototype, "drawPoints", function(proceed) {
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    const { renderer } = this.chart;
    this.points.forEach(point => {
      const {
        plotX,
        currentPlot,
        indicatorShape,
        indicatorColor,
        shapeArgs: { width } = {}
      } = point;
      let shapePaths = null;
      // Use 50% of box width for indicator
      let indicatorWidth = Math.floor(width * 0.5);
      // Cap to 20 width so it doesn't look too big if bar widths are wide
      indicatorWidth = indicatorWidth > 20 ? 20 : indicatorWidth;
      const offset = indicatorWidth / 2;
      let polygonal = true;

      if (indicatorShape === "diamond") {
        // Make diamond 20% larger
        const adjustment = offset + Math.floor(offset * 0.2);
        shapePaths = [
          "M",
          plotX,
          currentPlot - adjustment,
          "L",
          plotX + adjustment,
          currentPlot,
          "L",
          plotX,
          currentPlot + adjustment,
          "L",
          plotX - adjustment,
          currentPlot,
          "z"
        ];
      } else if (indicatorShape === "square") {
        // Make square 20% smaller
        const adjustment = offset - Math.floor(offset * 0.2);
        shapePaths = [
          "M",
          plotX - adjustment,
          currentPlot - adjustment,
          "L",
          plotX + adjustment,
          currentPlot - adjustment,
          "L",
          plotX + adjustment,
          currentPlot + adjustment,
          "L",
          plotX - adjustment,
          currentPlot + adjustment,
          "z"
        ];
      } else if (indicatorShape === "circle") {
        polygonal = false;
      } else {
        // triangle
        shapePaths = [
          "M",
          plotX,
          currentPlot - offset,
          "L",
          plotX + offset,
          currentPlot + offset,
          "L",
          plotX - offset,
          currentPlot + offset,
          "z"
        ];
      }

      let shape;
      const attrs = {
        fill: indicatorColor,
        stroke: indicatorColor,
        "stroke-width": 0
      };
      if (!point.indicator) {
        if (polygonal) {
          shape = renderer.path(shapePaths).attr(attrs);
        } else {
          shape = renderer.circle(plotX, currentPlot, offset).attr(attrs);
        }
        point.indicator = shape
          .addClass("highcharts-boxplot-current-plot")
          .add(point.graphic);
      } else {
        if (polygonal) {
          point.indicator.animate({
            d: shapePaths
          });
        } else {
          point.indicator.animate({
            cx: plotX,
            cy: currentPlot,
            r: offset
          });
        }
      }
    });
  });

  H.wrap(H.seriesTypes.boxplot.prototype, "render", function(proceed) {
    proceed.apply(this, Array.prototype.slice.call(arguments, 1));

    const {
      backgroundShape,
      chart: { renderer }
    } = this;

    const xAxisStart = this.chart.plotLeft;
    const yAxisEnd = this.chart.plotHeight + this.chart.plotTop;
    const firstPoint = this.points[0];
    const lastPoint = this.points[this.points.length - 1];

    const start = firstPoint.plotX + xAxisStart - firstPoint.shapeArgs.width;
    const chartWidth = lastPoint.plotX + xAxisStart + lastPoint.shapeArgs.width;

    // console.log(displaySortedProperties(this));
    if (!backgroundShape) {
      this.backgroundShape = renderer
        .path([
          "M",
          start,
          0,
          "L",
          chartWidth,
          0,
          "L",
          chartWidth,
          yAxisEnd,
          "L",
          start,
          yAxisEnd,
          "z"
        ])
        .attr({
          "stroke-width": 0,
          fill: this.options.backgroundColor || "#ff0000"
        })
        .add();
    } else {
      this.backgroundShape.animate({
        d: [
          "M",
          start,
          0,
          "L",
          chartWidth,
          0,
          "L",
          chartWidth,
          yAxisEnd,
          "L",
          start,
          yAxisEnd,
          "z"
        ]
      });
    }
  });
};

HighchartsBoxPlotPlus(Highcharts);

const tooltip = {
  pointFormat:
    '<span style="color:{point.color}">\u25CF</span> <b> ' +
    "{series.name}</b><br/>" +
    "Current: {point.current}<br/>" +
    "Maximum: {point.high}<br/>" +
    "Median: {point.median}<br/>" +
    "Minimum: {point.low}<br/>"
};

const xAxisLabelsFormatter = function() {
  return this.pos >= 0 && this.pos <= 8 ? this.value : "";
};

const chartOptions = {
  chart: {
    type: "boxplot"
  },
  xAxis: {
    title: {
      text: "Example"
    },
    categories: [
      "Book to Price",
      "Earnings Yield (-12M)",
      "Earnings Yield (+12M)",
      "Dividend Yield",
      "FCF Yield",
      "Sales Growth 3Y",
      "Earnings Growth 3Y",
      "Forecast Growth 1Y",
      "Forecast Growth 2Y"
    ],
    labels: {
      formatter: xAxisLabelsFormatter
    }
  },
  yAxis: {
    title: {
      text: "Example"
    }
  },
  plotOptions: {
    boxplot: {
      whiskerLength: 0,
      grouping: false,
      events: {
        hide() {
          this.backgroundShape.hide();
        },
        show() {
          this.backgroundShape.show();
        }
      }
    }
  },
  series: [
    {
      name: "Value",
      tooltip,
      zIndex: 0,
      backgroundColor: "#EAFFFF",
      data: [
        {
          x: 0,
          low: -3,
          q1: -3,
          median: 5,
          q3: 12,
          high: 12,
          current: 7,
          name: "Book to Price",
          color: "#000000",
          fillColor: "#9DC3E6",
          indicatorShape: "square",
          indicatorColor: "#203864"
        },
        {
          x: 1,
          low: 4,
          q1: 4,
          median: 8,
          q3: 15,
          high: 15,
          current: 8,
          name: "Earnings Yield (-12M)",
          color: "#000000",
          fillColor: "#9DC3E6",
          indicatorColor: "#203864"
        },
        {
          x: 2,
          low: 1,
          q1: 1,
          median: 7,
          q3: 10,
          high: 10,
          current: 7,
          name: "Earnings Yield (+12M)",
          color: "#000000",
          fillColor: "#9DC3E6",
          indicatorShape: "diamond",
          indicatorColor: "#203864"
        },
        {
          x: 3,
          low: -5,
          q1: -5,
          median: 10,
          q3: 12,
          high: 12,
          current: -5,
          name: "Dividend Yield",
          color: "#000000",
          fillColor: "#9DC3E6",
          indicatorShape: "circle",
          indicatorColor: "#203864"
        },
        {
          x: 4,
          low: 3,
          q1: 3,
          median: 8,
          q3: 16,
          high: 16,
          current: 9,
          name: "FCF Yield",
          color: "#000000",
          fillColor: "#9DC3E6",
          indicatorColor: "#203864"
        }
      ]
    },
    {
      name: "Growth",
      tooltip,
      backgroundColor: "#F6FFDB",
      data: [
        {
          x: 5,
          low: -2,
          q1: -2,
          median: 7,
          q3: 16,
          high: 16,
          current: 9,
          name: "Book to Price",
          color: "#000000",
          fillColor: "#A9D18E",
          indicatorShape: "square",
          indicatorColor: "#385723"
        },
        {
          x: 6,
          low: -5,
          q1: -5,
          median: 7,
          q3: 15,
          high: 15,
          current: 0,
          name: "Earnings Yield (-12M)",
          color: "#000000",
          fillColor: "#A9D18E",
          indicatorColor: "#385723"
        },
        {
          x: 7,
          low: 2,
          q1: 2,
          median: 4,
          q3: 8,
          high: 8,
          current: 6,
          name: "Earnings Yield (+12M)",
          color: "#000000",
          fillColor: "#A9D18E",
          indicatorShape: "diamond",
          indicatorColor: "#385723"
        },
        {
          x: 8,
          low: -3,
          q1: -3,
          median: 5,
          q3: 9,
          high: 9,
          current: 5,
          name: "Dividend Yield",
          color: "#000000",
          fillColor: "#A9D18E",
          indicatorShape: "circle",
          indicatorColor: "#385723"
        }
      ]
    }
  ],
  title: false,
  credits: false
};

function App() {
  return (
    <div className="App" style={{ margin: 30 }}>
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
