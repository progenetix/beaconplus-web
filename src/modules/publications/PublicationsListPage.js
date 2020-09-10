import React, { useEffect, useState } from "react"
import { Layout } from "../../components/layouts/Layout"
import { useGeoCity, usePublicationList } from "../../hooks/api"
import { WithData } from "../../components/Loader"
import Table, { TooltipHeader } from "../../components/Table"
import { EpmcLink } from "./EpmcUrl"
import cn from "classnames"
import { useAsyncSelect } from "../../hooks/asyncSelect"
import CustomSelect from "../../components/Select"
import dynamic from "next/dynamic"
import { sumBy } from "lodash"

export default function PublicationsListPage() {
  const [geoCity, setGeoCity] = useState(null)
  const [geodistanceKm, setGeodistanceKm] = useState(100)
  return (
    <Layout title="Publications" headline="Progenetix Publication Collection">
      <article className="mb-6">
        <p>
          The current page lists articles describing whole genome screening
          (WGS, WES, aCGH, cCGH) experiments in cancer, registered in the
          Progenetix publication collection.
        </p>
        <p>
          Please <a href="mailto:contact@progenetix.org">contact us</a> to alert
          us about additional articles you are aware of.
        </p>
      </article>
      <div className="columns mb-4">
        <div className="column is-one-third">
          <label className="label">City</label>
          <GeoCitySelector geoCity={geoCity} setGeoCity={setGeoCity} />
        </div>
        {geoCity && (
          <div className="column is-narrow animate__fadeIn animate__animated animate__faster">
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
      <PublicationsLoader geoCity={geoCity} geodistanceKm={geodistanceKm} />
    </Layout>
  )
}

function PublicationsLoader({ geoCity, geodistanceKm }) {
  const publicationsResult = usePublicationList({
    geoCity,
    geodistanceKm
  })

  return (
    <WithData
      dataEffectResult={publicationsResult}
      background
      render={(data) => (
        <>
          <div className="mb-5">
            <PublicationsContainer publications={data} />
            <PublicationTable publications={data} />
          </div>
        </>
      )}
    />
  )
}
function PublicationTable({ publications }) {
  const columns = React.useMemo(
    () => [
      {
        Header: "id",
        accessor: "id",
        // eslint-disable-next-line react/display-name
        Cell: (cellInfo) => (
          <a
            href={`/publications/details?id=${cellInfo.value}&filterPrecision=exact`}
          >
            {cellInfo.value}
          </a>
        )
      },
      {
        Header: "Publication",
        accessor: "label",
        // eslint-disable-next-line react/display-name
        Cell: ({ value, row: { original } }) => {
          return (
            <>
              <div>{value}</div>
              <div>
                {original.journal} <EpmcLink publicationId={original.id} />
              </div>
            </>
          )
        }
      },
      {
        Header: "Samples",
        columns: [
          {
            Header: TooltipHeader(
              "cCGH",
              "Chromosomal Comparative Genomic Hybridization"
            ),
            accessor: "counts.ccgh",
            Cell: CountCell
          },
          {
            Header: TooltipHeader("aCGH", "Genomic Arrays"),
            accessor: "counts.acgh",
            Cell: CountCell
          },
          {
            Header: TooltipHeader("WES", "Whole Exome Sequencing"),
            accessor: "counts.wes",
            Cell: CountCell
          },
          {
            Header: TooltipHeader("WGS", "Whole Genome Sequencing"),
            accessor: "counts.wgs",
            Cell: CountCell
          },
          {
            Header: TooltipHeader("pgx", "Progenetix"),
            accessor: "counts.progenetix",
            Cell: CountCell
          },
          {
            Header: TooltipHeader("am", "Arraymap"),
            accessor: "counts.arraymap",
            Cell: CountCell
          }
        ]
      },
      { accessor: "authors" },
      { accessor: "title" }
    ],
    []
  )
  return (
    <Table
      columns={columns}
      data={publications}
      pageSize={15}
      hasGlobalFilter
      hiddenColumns={["authors", "title"]}
    />
  )
}

function CountCell({ value }) {
  return (
    <span className={cn(value === 0 && "has-text-grey-light")}>{value}</span>
  )
}

function GeoCitySelector({ setGeoCity }) {
  const { inputValue, value, onChange, onInputChange } = useAsyncSelect()
  useEffect(() => setGeoCity(value), [setGeoCity, value])
  const { data, isLoading } = useGeoCity({ city: inputValue })
  let options = []
  if (data) {
    options = data.map((g) => ({
      value: g.id,
      data: g,
      label: `${g.city} (${g.country})`
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

function PublicationsContainer({ publications }) {
  const acghSum = sumBy(publications, "counts.acgh")
  const ccghSum = sumBy(publications, "counts.ccgh")
  const wesSum = sumBy(publications, "counts.wes")
  const wgsSum = sumBy(publications, "counts.wgs")
  const publicationsCount = publications.length
  return (
    <>
      <div className="mb-5">
        <PublicationsMap publications={publications} height={400} />
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
