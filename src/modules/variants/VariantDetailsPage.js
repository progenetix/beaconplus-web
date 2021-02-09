import {
  getDataItemUrl,
  useDataItemDelivery,
  NoResultsHelp
} from "../../hooks/api"
import { Loader } from "../../components/Loader"
import { withUrlQuery } from "../../hooks/url-query"
import { Layout } from "../../components/Layout"

const itemColl = "variants"
const exampleId = "5bab576a727983b2e00b8d32"

const VariantDetailsPage = withUrlQuery(({ urlQuery }) => {
  const { _id, datasetIds } = urlQuery
  const hasAllParams = _id && datasetIds
  return (
    <Layout title="Variant Details" headline="Variant Details">
      {!hasAllParams ? (
        NoResultsHelp(exampleId, itemColl)
      ) : (
        <VariantLoader _id={_id} datasetIds={datasetIds} />
      )}
    </Layout>
  )
})

export default VariantDetailsPage

function VariantLoader({ _id, datasetIds }) {
  const { data, error, isLoading } = useDataItemDelivery(
    _id,
    itemColl,
    datasetIds
  )
  return (
    <Loader isLoading={isLoading} error={error} background>
      {data && (
        <VariantResponse response={data} _id={_id} datasetIds={datasetIds} />
      )}
    </Loader>
  )
}

function VariantResponse({ response, datasetIds }) {
  if (!results) {
    return NoResultsHelp(exampleId, itemColl)
  }

  return <Variant variant={results[0]} datasetIds={datasetIds} />
}

function Variant({ variant, datasetIds }) {
  return (
    <section className="content">
      <h3 className="mb-6">
        {variant._id} ({datasetIds})
      </h3>

      {variant.digest && (
        <>
          <h5>Digest</h5>
          <p>{variant.digest}</p>
        </>
      )}

      <h5>
        Download Data as{" "}
        <a
          rel="noreferrer"
          target="_blank"
          href={
            getDataItemUrl(variant._id, itemColl, datasetIds) +
            "&responseFormat=simple"
          }
        >
          {"{JSON↗}"}
        </a>
      </h5>
    </section>
  )
}
