/* eslint-disable react/display-name */
import Tippy, { useSingleton } from "@tippyjs/react"
import cn from "classnames"
import React, { useState } from "react"
import { checkIntegerRange, INTEGER_RANGE_REGEX } from "../hooks/api"

const outerBandsHeightRatio = 0.65 // pt
const innerBandsHeightRatio = 0.8 // pt
const outerRangeColor = "#5781ff"
const innerRangeColor = "#ff0033"
const height = 90
const autoZoomFactor = 1.4
export function Chromosome({
  bands,
  startRange,
  endRange,
  zoomStart = 0,
  zoomEnd = getMax(bands),
  width = 600,
  defaultAutoZoom = false
}) {
  const startRangeError = checkIntegerRange(startRange)
  const endRangeError = checkIntegerRange(endRange)

  const [autoZoom, setAutoZoom] = useState(defaultAutoZoom)

  const { start, startMax } = startRangeError ? {} : getStarts(startRange)
  const { end, endMin } = endRangeError ? {} : findEnds(endRange)
  if (autoZoom) {
    zoomStart = start - (end - start) / autoZoomFactor
    zoomEnd = end + (end - start) / autoZoomFactor
  }

  const calcX = (bandPosition) =>
    Math.min(
      ((bandPosition - zoomStart) / (zoomEnd - zoomStart)) * width,
      width
    )
  const [source, target] = useSingleton()

  const bandsHeight = height * outerBandsHeightRatio

  return (
    <>
      <Tippy singleton={source} delay={0} theme="light" placement="top" />
      <svg
        style={{ cursor: autoZoom ? "zoom-out" : "zoom-in" }}
        width={width}
        viewBox={`0 0 ${width} ${height}`}
        onClick={() => setAutoZoom(!autoZoom)}
      >
        <svg
          y={(height * (1 - outerBandsHeightRatio)) / 2}
          height={bandsHeight}
        >
          <svg
            y={(bandsHeight * (1 - innerBandsHeightRatio)) / 2}
            height={bandsHeight * innerBandsHeightRatio}
          >
            {bands.map((band) => {
              const x = calcX(band.start)
              const rectWidth = calcX(band.end) - calcX(band.start)
              return (
                <Tippy
                  key={band.cytoband}
                  singleton={target}
                  content={band.cytoband}
                >
                  <rect
                    x={x}
                    y={0}
                    className={cn(`stain stain--${band.stain}`, {
                      selected: true
                    })}
                    width={rectWidth}
                    height={"100%"}
                  />
                </Tippy>
              )
            })}
            <rect
              pointerEvents="none"
              height="100%"
              width="100%"
              stroke="black"
              strokeWidth={1}
              fillOpacity={0}
            />
          </svg>
          {start && verticalLine(calcX)(start, outerRangeColor)}
          {startMax && verticalLine(calcX)(startMax, innerRangeColor)}
          {endMin && verticalLine(calcX)(endMin, innerRangeColor)}
          {end && verticalLine(calcX)(end, outerRangeColor)}
          {start && end && (
            <rect
              pointerEvents="none"
              className="selection"
              x={calcX(start || end) + 1}
              width={calcX(end) - calcX(start) - 2}
              height="100%"
            />
          )}
        </svg>
        {start &&
          annotation(calcX, width)(start, "start", outerRangeColor, "top")}
        {end && annotation(calcX, width)(end, "end", outerRangeColor, "bottom")}
      </svg>
    </>
  )
}

const verticalLine = (calcX) => (bandPosition, stroke) => (
  <line
    x1={calcX(bandPosition)}
    x2={calcX(bandPosition)}
    y1={0}
    y2="100%"
    stroke={stroke}
    strokeWidth={2}
  />
)

const annotation = (calcX, width) => (bandPosition, text, fill, position) => {
  const x = calcX(bandPosition)
  let anchor = "middle"
  if (x < 20) anchor = "start"
  if (x > width - 20) anchor = "end"

  let y = "0"
  let alignmentBaseline = "hanging"
  if (position === "bottom") {
    y = height
    alignmentBaseline = ""
  }
  return (
    <text
      x={x}
      y={y}
      className="annotation"
      textAnchor={anchor}
      fill={fill}
      alignmentBaseline={alignmentBaseline}
    >
      {text}
    </text>
  )
}

function getMax(bands) {
  return bands[bands.length - 1].end
}

function getStarts(startRange) {
  const startRangeMatch = INTEGER_RANGE_REGEX.exec(startRange) ?? []
  const [, start0, start1] = startRangeMatch
  const start = Number.parseInt(start0)
  const startMax = start1 != null ? Number.parseInt(start1) : null
  return { start, startMax }
}

function findEnds(endRange) {
  const [, end0, end1] = INTEGER_RANGE_REGEX.exec(endRange) ?? []
  const end = end1 != null ? Number.parseInt(end1) : Number.parseInt(end0)
  const endMin = end1 != null ? Number.parseInt(end0) : null
  return { end, endMin }
}
