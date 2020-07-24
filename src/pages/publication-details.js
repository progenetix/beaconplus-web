import {
  publicationUrl,
  usePublication,
  useSubsethistogram
} from "../effects/api"
import { Loader } from "../components/Loader"
import React, { useRef } from "react"
import { useContainerDimensions } from "../effects/containerDimensions"
import { useSearch } from "../effects/location"
import Histogram from "../components/Histogram"

export default function PublicationDetailsPage() {
  const search = useSearch()
  if (!search) return null
  const { id, scope, filter } = search

  return (
    <Layout>
      {!id ? (
        <MissingId />
      ) : (
        <Publication id={id} scope={scope} filter={filter} />
      )}
    </Layout>
  )
}

function Layout({ children }) {
  return (
    <div>
      <header
        className="has-background-visual-identity"
        style={{ height: "2rem" }}
      />
      <div className="section">
        <div className="container">
          <h1 className="title is-2">Publication Details</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

function MissingId() {
  return (
    <div className="notification is-warning">
      This page will only show content if called with a specific Pubmed ID which
      already exists in the Progenetix `publications` database, e.g.{" "}
      <a href={"/publication-details?id=PMID:28966033"}>
        /publication-details?id=PMID:28966033
      </a>
      . Please start over from the Progenetix Publication Collection page.
    </div>
  )
}

function Publication({ id, scope, filter }) {
  const { data, error } = usePublication(id)
  const isLoading = !data && !error

  return (
    <Loader isLoading={isLoading} hasError={error} background>
      {data &&
        data.map((publication, i) => (
          <PublicationDetails
            key={i}
            publication={publication}
            id={id}
            scope={scope}
            filter={filter}
          />
        ))}
    </Loader>
  )
}

function PublicationDetails({ publication, id, scope, filter }) {
  const componentRef = useRef()
  const { width } = useContainerDimensions(componentRef)

  const epmcUrl = `http://www.europepmc.org/abstract/MED/${id.split(":")[1]}`
  return (
    <section ref={componentRef} className="content">
      <h3 className="subtitle">
        {publication.title}{" "}
        <a rel="noreferrer" target="_blank" href={publicationUrl(id)}>
          {"{↗}"}
        </a>
      </h3>

      <p className="has-text-weight-semibold">{publication.authors}</p>
      <p>
        <i>{publication.journal}</i> {id}{" "}
        <a href={epmcUrl} rel="noreferrer" target="_BLANK">
          <img src="https://progenetix.org/p/EPMC_16.gif" />
        </a>
      </p>
      <p>{publication.abstract}</p>
      <h5>Origin</h5>
      <p>{publication.provenance.geo.label}</p>
      <h5>Genome Screens</h5>
      <div>
        <ul>
          {technologies.map((technologie, i) =>
            publication.counts[technologie] ? (
              <li key={i}>
                {technologie}: {publication.counts[technologie]}
              </li>
            ) : null
          )}
          {publication.info.progenetix_biosamples_count > 0 && (
            <li>
              {publication.info.progenetix_biosamples_count} sample profiles are{" "}
              <a
                href={`${progenetixBasePath}/pgx_biosamples.cgi?datasetIds=progenetix&filters=${id}`}
              >
                registered in Progenetix
              </a>
            </li>
          )}
          {publication.info.arraymap_biosamples_count > 0 && (
            <li>
              {publication.info.arraymap_biosamples_count} sample profiles are{" "}
              <a
                href={`${progenetixBasePath}/pgx_biosamples.cgi?datasetIds=arraymap&filters=${id}`}
              >
                registered in arrayMap
              </a>
            </li>
          )}
        </ul>
      </div>
      {publication.info.progenetix_biosamples_count > 0 && (
        <Histogram
          background
          dataEffect={useSubsethistogram({
            datasetIds: "progenetix",
            id,
            filter,
            scope,
            size: width
          })}
        />
      )}
      {publication.info.arraymap_biosamples_count > 0 && (
        <Histogram
          background
          dataEffect={useSubsethistogram({
            datasetIds: "arraymap",
            id,
            filter,
            scope,
            size: width
          })}
        />
      )}
    </section>
  )
}

const progenetixBasePath = `https://progenetix.org/cgi-bin`
const technologies = ["ccgh", "acgh", "wes", "wgs"]
