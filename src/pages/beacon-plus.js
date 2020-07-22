import React, { useState } from "react"
import { useBeaconQuery } from "../effects/api"
import Nav from "../components/Nav"
import { BeaconForm } from "../components/beacon-plus/BeaconForm"
import { DatasetResultBox } from "../components/beacon-plus/DatasetResultBox"
import requestTypesConfig from "../../config/beacon-plus/requestTypes.yaml"
import parametersConfig from "../../config/beacon-plus/parameters.yaml"
import Panel from "../components/Panel"
import { FaSlidersH } from "react-icons/fa"
import { Loader } from "../components/Loader"

export default function BeaconPlus() {
  const [query, setQuery] = useState(null) // actual valid query
  const [searchCollapsed, setSearchCollapsed] = useState(false)

  const {
    data: queryResponse,
    error: queryError,
    mutate: mutateQuery
  } = useBeaconQuery(query)

  const isLoading = !queryResponse && !queryError && !!query

  const handleValidFormQuery = (formValues) => {
    mutateQuery(null) // mutateQuery and clear current results
    setQuery(formValues)
    setSearchCollapsed(true)
  }

  return (
    <>
      <Nav />
      <section className="section">
        <div className="container mb-5">
          <Panel
            isOpened={!searchCollapsed}
            heading={
              <>
                <span>Search</span>
                {searchCollapsed && (
                  <button className="button ml-3">
                    <FaSlidersH
                      onClick={() => setSearchCollapsed(false)}
                      className="icon has-text-info"
                    />
                    {/*<span>Edit</span>*/}
                  </button>
                )}
              </>
            }
          >
            <BeaconForm
              requestTypesConfig={requestTypesConfig}
              parametersConfig={parametersConfig}
              isLoading={isLoading}
              onValidFormQuery={handleValidFormQuery}
            />
          </Panel>
        </div>
      </section>
      <section className="section pt-0">
        <div className="container">
          {query && (
            <Results
              isLoading={isLoading}
              response={queryResponse}
              error={queryError}
              query={query}
            />
          )}
        </div>
      </section>
    </>
  )
}

function Results({ response, isLoading, error, query }) {
  return (
    <>
      <div className="subtitle ">
        <QuerySummary query={query} />
      </div>
      <Loader isLoading={isLoading} hasError={error} colored background>
        <AlleleResponses
          datasetAlleleResponses={response?.datasetAlleleResponses}
          query={query}
        />
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
  let filters = []
  if (query.bioontology) {
    filters = [...filters, ...query.bioontology]
  }
  if (query.materialtype) {
    filters = [...filters, query.materialtype]
  }
  if (query.freeFilters) {
    filters = [...filters, query.freeFilters]
  }
  return (
    <ul className="beacon-plus__query-summary">
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
          {filters.join(", ")}
        </li>
      )}
    </ul>
  )
}
