import { Loader } from "../Loader"
import { DatasetResultBox } from "./DatasetResultBox"
import React from "react"
import { makeFilters } from "../../hooks/api"

export function BiosamplesResults({ response, isLoading, error, query }) {
  return (
    <>
      <div className="subtitle ">
        <QuerySummary query={query} />
      </div>

      <Loader isLoading={isLoading} hasError={error} colored background>
        {() => (
          <>
            <AlleleResponses
              datasetAlleleResponses={response.datasetAlleleResponses}
              query={query}
            />
          </>
        )}
      </Loader>
    </>
  )
}

function AlleleResponses({ datasetAlleleResponses, query }) {
  if (!(datasetAlleleResponses?.length >= 0)) {
    return (
      <div className="notification">
        No results could be found for this query.
      </div>
    )
  }
  return datasetAlleleResponses.map((r, i) => (
    <DatasetResultBox key={i} data={r} query={query} />
  ))
}

function QuerySummary({ query }) {
  const filters = makeFilters(query)
  return (
    <ul className="BeaconPlus__query-summary">
      {query.assemblyId && (
        <li>
          <small>Assembly: </small>
          {query.assemblyId}
        </li>
      )}
      {query.referenceName && (
        <li>
          <small>Chro: </small>
          {query.referenceName}
        </li>
      )}
      {query.start && (
        <li>
          <small>Start: </small>
          {query.start}
        </li>
      )}
      {query.end && (
        <li>
          <small>End: </small>
          {query.end}
        </li>
      )}
      {query.variantType && (
        <li>
          <small>Type: </small>
          {query.variantType}
        </li>
      )}
      {query.referenceBases && (
        <li>
          <small>Ref. Base(s): </small>
          {query.referenceBases}
        </li>
      )}
      {query.alternateBases && (
        <li>
          <small>Alt. Base(s): </small>
          {query.alternateBases}
        </li>
      )}
      {filters.length > 0 && (
        <li>
          <small>Filters: </small>
          {filters.join(" "+query.filterLogic+" ")}
        </li>
      )}
      {filters.length > 1111 && (
        <li>
          <small>Filter Logic: </small>
          {query.filterLogic}
        </li>
      )}
    </ul>
  )
}
