import swr from "swr"
import defaultFetcher, { svgFetcher } from "./fetcher"
import { keyBy } from "lodash"

// eslint-disable-next-line no-undef
export const basePath = process.env.NEXT_PUBLIC_API_PATH
export const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === "true"
export const SITE = process.env.NEXT_PUBLIC_SITE_URL

export function useExtendedSWR(url, fetcher = defaultFetcher) {
  const { data, error, ...other } = swr(url, fetcher)
  return { data, error, ...other, isLoading: !data && !error }
}

export const SITE_DEFAULTS = {
  SITE: process.env.NEXT_PUBLIC_SITE_URL,
  API_PATH: process.env.NEXT_PUBLIC_API_PATH,
  PREFETCH_PATH: process.env.NEXT_PUBLIC_PREFETCH_API_PATH,
  DATASETID: "examplez",
  DATASETLABEL: "Examplez",
  PROJECTROOTLINK: "http://beaconplus.org",
  PROJECTDOCLINK: "https://docs.progenetix.org",
  MASTERROOTLINK: "https://progenetix.org",
  MASTERDOCLINK: "https://docs.progenetix.org",
  NEWSLINK: "https://docs.progenetix.org/news",
  ORGSITELINK: "https://info.baudisgroup.org"
}
export const MAX_HISTO_SAMPLES = 1000
export const THISYEAR = new Date().getFullYear()
export const BIOKEYS = ["histologicalDiagnosis", "icdoMorphology", "icdoTopography", "sampleOriginDetail"]

export function useProgenetixApi(...args) {
  const { data, error, ...other } = useExtendedSWR(...args)
  if (data) {
    const errorMessage = findErrorMessage(data)
    // Compatible with the simple responses.
    return { ...other, data, error: errorMessage ?? error }
  }
  // Connection error or http error code
  else if (error) {
    const errorMessage = error.info
      ? findErrorMessage(error.info)
      : error.message
    return { ...other, error: errorMessage }
  } else {
    return { ...other }
  }
}

// Return an error message contained in the payload.
function findErrorMessage(data) {
  return (
    data.error?.errorMessage ||
    (data.errors ? errorsToMessage(data.errors) : null) ||
    null
  )
}

function errorsToMessage(errors) {
  return errors.join(", ")
}

export async function tryFetch(url, fallBack = "N/A") {
  console.info(`Fetching data from ${url}.`)
  try {
    const response = await fetch(url)
    return response.json()
  } catch (e) {
    console.error(`Count not fetch ${url}`)
    if (fallBack) {
      console.info(`Using ${JSON.stringify(fallBack)} as fallBack`)
      return fallBack
    } else {
      throw e
    }
  }
}

/**
 * When param is null no query will be triggered.
 */

// This Beacon query only retrieves the counts & handovers using a custom `output=handoversonly`
// parameter, to avoid "double-loading" of the results.
// TODO: refactor using requestedGranularity ...
export function useBeaconQuery(queryData) {
  return useProgenetixApi(
    queryData
      ? `${SITE_DEFAULTS.API_PATH}beacon/biosamples/?includeHandovers=true&requestedGranularity=record&onlyHandovers=true&${buildQueryParameters(queryData)}`
      : null
  )
}

export function useAggregatorQuery(queryData) {
  return useProgenetixApi(
    queryData
      ? `${SITE_DEFAULTS.API_PATH}services/aggregator/?requestedGranularity=boolean&${buildQueryParameters(queryData)}`
      : null
  )
}

export function validateBeaconQuery(queryData) {
  try {
    buildQueryParameters(queryData)
    return null
  } catch (e) {
    return e
  }
}

export function mkGeoParams(geoCity, geodistanceKm) {
  if (!geoCity) return null
  const coordinates = geoCity.data.geoLocation.geometry.coordinates ?? []
  const [geoLongitude, geoLatitude] = coordinates
  const geoDistance = geodistanceKm ? geodistanceKm * 1000 : 100 * 1000
  return { geoLongitude, geoLatitude, geoDistance }
}

// export function mkGeneParams(gene) {
//   if (!gene) return null
//   const geneId = gene.map((gene) => gene.value).join(',')
//   return { geneId }
// }

export function makeFilters({
  allTermsFilters,
  freeFilters,
  clinicalClasses,
  bioontology,
  referenceid,
  cohorts,
  sex,
  materialtype
}) {
  const parsedFreeFilters =
    freeFilters
      ?.split(",")
      .map((ff) => ff.trim())
      .filter((v) => v != null && v.length !== 0) ?? []

  return [
    ...(allTermsFilters ?? []),
    ...(bioontology ?? []),
    ...(clinicalClasses ?? []),
    ...(referenceid ?? []),
    ...(cohorts ? [cohorts] : []),
    ...(sex ? [sex] : []),
    ...(materialtype ? [materialtype] : []),
    ...parsedFreeFilters
  ]
}

export function buildQueryParameters(queryData) {
  console.log("...queryData in buildQueryParameters", queryData)
  const {
    start,
    end,
    bioontology,
    referenceid,
    cohorts,
    sex,
    materialtype,
    allTermsFilters,
    freeFilters,
    clinicalClasses,
    geoCity,
    geodistanceKm,
    ...otherParams
  } = queryData
  // positions from the form have to be -1 adjusted (only first value if interval)
  const starts = []
  if (start) {
    const match = INTEGER_RANGE_REGEX.exec(start)
    if (!match) throw new Error("incorrect start range")
    const [, start0, start1] = match
    var s0 = start0 - 1
    s0 = s0.toString()
    starts.push(s0)
    start1 && starts.push(start1)
  }
  const ends = []
  if (end) {
    const match = INTEGER_RANGE_REGEX.exec(end)
    if (!match) throw new Error("incorrect end range")
    const [, end0, end1] = match
    ends.push(end0)
    end1 && ends.push(end1)
  }
  console.log("...buildQueryParameters before filters")
  const filters = makeFilters({
    allTermsFilters,
    freeFilters,
    clinicalClasses,
    bioontology,
    referenceid,
    cohorts,
    sex,
    materialtype
  })
  // const geneParams = mkGeneParams(geneId) ?? {}
  const geoParams = mkGeoParams(geoCity, geodistanceKm) ?? {}
  return new URLSearchParams(
    flattenParams([
      ...Object.entries({ ...otherParams, ...geoParams }),
      ["start", starts],
      ["end", ends],
      ["filters", filters],
    ]).filter(([, v]) => !!v)
  ).toString()
}

export function useDataVisualization(queryData) {
  var q_path = "beacon/biosamples"
  if (queryData.fileId && queryData.fileId != "null") {
    q_path = "services/samplesPlotter"
  }
  return useProgenetixApi(
    queryData
      ? `${SITE_DEFAULTS.API_PATH}${q_path}/?${buildDataVisualizationParameters(
          queryData
        )}`
      : null
  )
}

export function buildDataVisualizationParameters(queryData) {
  return new URLSearchParams(
    flattenParams([...Object.entries(queryData)]).filter(([, v]) => !!v)
  ).toString()
}

export function publicationDataUrl(id) {
  return `${SITE_DEFAULTS.API_PATH}services/publications?filters=${id}&method=details`
}

export function useDataItemDelivery(id, entity, datasetIds) {
  return useProgenetixApi(getDataItemUrl(id, entity, datasetIds))
}

export function getDataItemUrl(id, entity, datasetIds) {
  return `${SITE_DEFAULTS.API_PATH}beacon/${entity}/${id}/?datasetIds=${datasetIds}`
}

export function NoResultsHelp(id, entity) {
  return (
    <div className="notification is-size-5">
      This page will only show content if called with an existing {entity} ID;{" "}
      is not valid.
    </div>
  )
}

export function useCytomapper(querytext) {
  const url =
    querytext &&
    querytext.length > 0 &&
    `${SITE_DEFAULTS.API_PATH}services/cytomapper/?cytoBands=${querytext}`
  return useProgenetixApi(url)
}

export function useSubsethistogram({ datasetIds, id, filter, plotRegionLabels, plotGeneSymbols, plotCytoregionLabels, size, plotChros }) {
  const svgbaseurl = subsetHistoBaseLink(id, datasetIds)
  const params = []
  filter && params.push(["filter", filter])
  plotRegionLabels && params.push(["plotRegionLabels", plotRegionLabels])
  plotGeneSymbols && params.push(["plotGeneSymbols", plotGeneSymbols])
  plotCytoregionLabels && params.push(["plotCytoregionLabels", plotCytoregionLabels])
  size && params.push(["plotWidth", size])
  plotChros && params.push(["plotChros", plotChros])
  const searchQuery = new URLSearchParams(params).toString()
  return useExtendedSWR(size > 0 && `${svgbaseurl}&${searchQuery}`, svgFetcher)
}

// method is "counts" / "child_terms" for smaller payloads
export function useCollationsById({ datasetIds }) {
  const { data, ...other } = useCollations({
    filters: "",
    method: "counts",
    datasetIds
  })

  if (data) {
    const mappedResults = keyBy(data.response.results, "id")
    return {
      data: {
        ...data,
        results: mappedResults
      },
      ...other
    }
  }
  return { data, ...other }
}

export function useCollations({ datasetIds, method, filters }) {
  const url = `${SITE_DEFAULTS.API_PATH}beacon/filtering_terms/?datasetIds=${datasetIds}&method=${method}&filters=${filters}`
  return useProgenetixApi(url)
}

export function useCollationsByType({ datasetIds, method, collationTypes }) {
  const url = `${SITE_DEFAULTS.API_PATH}beacon/filtering_terms/?datasetIds=${datasetIds}&method=${method}&collationTypes=${collationTypes}`
  return useProgenetixApi(url)
}

export function useGeoCity({ city }) {
  const url = city ?`${SITE_DEFAULTS.API_PATH}services/geolocations?city=${city}` : null
  return useProgenetixApi(url)
}

export function useGeneSymbol({ geneId }) {
  const url = geneId ? `${SITE_DEFAULTS.API_PATH}services/genespans/?geneId=${geneId}&filterPrecision=start&method=genespan` : null
  return useProgenetixApi(url)
}

export function subsetHistoBaseLink(id, datasetIds) {
  return `${SITE_DEFAULTS.API_PATH}services/collationplots/?datasetIds=${datasetIds}&id=${id}`
}

// the targets are resolved by `bycon` (bycon/services/ids.py)
// TODO: make this a function here - UI links resolved in UI, API links in bycon
export function subsetIdLink(id) {
  return `${SITE_DEFAULTS.API_PATH}services/ids/${id}`
}

export function subsetPgxsegLink(id) {
  return `${SITE_DEFAULTS.API_PATH}services/intervalFrequencies/?&output=pgxseg&filters=${id}`
}

export async function uploadFile(formData) {
  // Default options are marked with *
  const response = await fetch(`${SITE_DEFAULTS.API_PATH}services/uploader/`, {
    method: "POST",
    headers: {},
    body: formData
  })
  return response.json()
}

// Transforms [[k1, v1], [k2, [v2, v3]]] into [[k1, v1], [k2, v2], [k3, v3]]
function flattenParams(paramArray) {
  return paramArray.flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((v) => [key, v])
    } else {
      return [[key, value]]
    }
  })
}

export const INTEGER_RANGE_REGEX = /^(\d+)(?:[-,;])?(\d+)?$/

export const checkIntegerRange = (value) => {
  if (!value) return
  const match = INTEGER_RANGE_REGEX.exec(value)
  if (!match) return "Input should be a range (ex: 1-5) or a single value"
  const [, range0Str, range1Str] = match
  const range0 = Number.parseInt(range0Str)
  const range1 = Number.parseInt(range1Str)
  if (range1 && range0 > range1)
    return "Incorrect range input, max should be greater than min"
}

export function replaceWithProxy(
  url,
  useProxyOpt = useProxy,
  basePathOpt = SITE_DEFAULTS.API_PATH
) {
  if (!url) return false
  if (!useProxyOpt) return url
  return url.toString().replace(new URL(url).origin + "/", basePathOpt)
}

