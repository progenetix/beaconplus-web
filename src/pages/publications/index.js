import React from "react"
import { Layout } from "../../components/Layout"
import { usePublicationList } from "../../effects/api"
import { Loader } from "../../components/Loader"
import Table from "../../components/Table"
import { epmcId, EpmcLink } from "../../components/publications/EpmcUrl"

export default function PublicationsListPage() {
  return (
    <Layout title="Progenetix Publication Collection">
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
        <p>
          A <a href="/publications-pgxdata.html">separate page</a> lists only
          articles with corresponding genome profiles in the Progenetix sample
          collection.
        </p>
      </article>
      <PublicationTableLoader />
    </Layout>
  )
}

function PublicationTableLoader() {
  const { data, error } = usePublicationList()
  const isLoading = !data && !error
  const columns = React.useMemo(
    () => [
      {
        Header: "id",
        accessor: "id",
        // eslint-disable-next-line react/display-name
        Cell: (cellInfo) => (
          <a
            href={`/publications/${cellInfo.value}?scope=datacollections`}
            rel="noreferrer"
            target="_blank"
          >
            {cellInfo.value}
          </a>
        )
      },
      {
        Header: "Publication",
        accessor: "citelabel",
        // eslint-disable-next-line react/display-name
        Cell: ({ value, row: { original } }) => {
          return (
            <>
              <div>{value}</div>
              <div>
                {original.journal} ( {epmcId(original.id)}){" "}
                <EpmcLink publicationId={original.id} />
              </div>
            </>
          )
        }
      },
      {
        Header: "Samples",
        columns: [
          {
            Header: "cCGH",
            accessor: "counts.ccgh"
          },
          {
            Header: "aCGH",
            accessor: "counts.acgh"
          },
          {
            Header: "WES",
            accessor: "counts.wes"
          },
          {
            Header: "WGS",
            accessor: "counts.wgs"
          }
        ]
      },
      { accessor: "authors" },
      { accessor: "title" },
      { accessor: "sortid" }
    ],
    []
  )

  return (
    <Loader isLoading={isLoading} hasError={error} background>
      <Table
        columns={columns}
        data={data}
        pageSize={15}
        hasGlobalFilter
        hiddenColumns={["authors", "title", "sortid"]}
      />
    </Loader>
  )
}
