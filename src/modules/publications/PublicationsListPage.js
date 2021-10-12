import React, { useEffect, useState } from "react"
import { Layout } from "../../components/Layout"
import { Infodot } from "../../components/Infodot"
import { PublicationTable } from "./PublicationTables"
import { useGeoCity, usePublicationList, Link } from "../../hooks/api"
import { WithData } from "../../components/Loader"
import { useAsyncSelect } from "../../hooks/asyncSelect"
import CustomSelect from "../../components/Select"
import dynamic from "next/dynamic"
import { sumBy } from "lodash"
import { matchSorter } from "match-sorter"
import useDebounce from "../../hooks/debounce"

export default function PublicationsListPage() {
  const [geoCity, setGeoCity] = useState(null)
  const [geodistanceKm, setGeodistanceKm] = useState(100)
  const [searchInput, setSearchInput] = useState(null)
  const debouncedSearchInput = useDebounce(searchInput, 500)
  return (
    <Layout title="Publications" headline="Progenetix Publication Collection">
      <article className="content">
        <p>
          The current page lists articles describing whole genome screening
          (WGS, WES, aCGH, cCGH) experiments in cancer, registered in the
          Progenetix publication collection. For each publication the table
          indicates the numbers of samples analysed with a given technology and
          if sample profiles are available in Progenetix.
        </p>
        <p>
          Please <a href="mailto:contact@progenetix.org">contact us</a> to alert
          us about additional articles you are aware of. The
          inclusion criteria are described{" "}
          <Link
            href="https://info.progenetix.org/doc/publication-collection.html"
            label="in the documentation"
          />.
        </p>
      </article>
      <div className="mb-5">
        <div className="columns my-0">
          <div className="field column py-0 mb-3 is-one-third">
            <label className="label">
              Filter
              <Infodot infoText={"Filter publications by keyword"} />
            </label>{" "}
            <input
              className="input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="field column py-0 mb-3 is-one-third">
            <label className="label">
              City
              <Infodot
                infoText={"Filter publications by city or proximity to one"}
              />
            </label>
            <GeoCitySelector geoCity={geoCity} setGeoCity={setGeoCity} />
          </div>
          {geoCity && (
            <div className="field column py-0 mb-3 is-narrow animate__fadeIn animate__animated animate__faster">
              <label className="label">Range (km)</label>
              <input
                className="input"
                type="number"
                value={geodistanceKm}
                onChange={(e) => setGeodistanceKm(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
      <PublicationsLoader
        geoCity={geoCity}
        geodistanceKm={geodistanceKm}
        textSearch={debouncedSearchInput?.trim() ?? ""}
      />
    </Layout>
  )
}

function FilteredPublication({ publications, textSearch }) {
  const filteredPublications = matchSorter(publications, textSearch, {
    keys: ["id", "authors", "title"],
    threshold: matchSorter.rankings.CONTAINS
  })
  return (
    <>
      <div className="mb-5">
        <PublicationTable publications={filteredPublications} />
      </div>
      <PublicationsMapContainer publications={filteredPublications} />
    </>
  )
}

function PublicationsLoader({ geoCity, geodistanceKm, textSearch }) {
  const publicationsResult = usePublicationList({
    geoCity,
    geodistanceKm
  })

  return (
    <WithData
      apiReply={publicationsResult}
      background
      render={(data) => (
        <FilteredPublication
          publications={data.results}
          textSearch={textSearch}
        />
      )}
    />
  )
}

function GeoCitySelector({ setGeoCity }) {
  const { inputValue, value, onChange, onInputChange } = useAsyncSelect()
  useEffect(() => setGeoCity(value), [setGeoCity, value])
  const { data, isLoading } = useGeoCity({ city: inputValue })
  let options = []
  if (data) {
    options = data.results.map((g) => ({
      value: g.id,
      data: g,
      label: `${g.geoLocation.properties.city} (${g.geoLocation.properties.country})`
    }))
  }
  return (
    <CustomSelect
      options={options}
      isLoading={!!inputValue && isLoading}
      onInputChange={onInputChange}
      value={value}
      onChange={onChange}
      placeholder="Type to search..."
      isClearable
    />
  )
}

function PublicationsMapContainer({ publications }) {
  const acghSum = sumBy(publications, "counts.acgh")
  const ccghSum = sumBy(publications, "counts.ccgh")
  const wesSum = sumBy(publications, "counts.wes")
  const wgsSum = sumBy(publications, "counts.wgs")
  const publicationsCount = publications.length
  return (
    <>
      <div className="mb-5">
        <PublicationsMap publications={publications} height={600} />
      </div>
      <p className="content">
        Geographic distribution (by corresponding author) of the{" "}
        <b>{acghSum}</b> genomic array, <b>{ccghSum}</b> chromosomal CGH and{" "}
        <b>{wesSum + wgsSum}</b> whole genome/exome based cancer genome datasets
        from the <b>{publicationsCount}</b> listed publications. Area sizes
        correspond to the sample numbers reported from a given location.
      </p>
    </>
  )
}

const PublicationsMap = dynamic(() => import("./PublicationsMap"), {
  ssr: false
})
