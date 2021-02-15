import { useExtendedSWR, basePath } from "../../hooks/api"
import { useEffect, useState } from "react"
import { keyBy } from "lodash"

export function LabeledGeneSpanOptions(inputValue) {
  const { data, isLoading } = useGeneSpans(inputValue)
  const [cachedGenes, setCachedGenes] = useState({})
  useEffect(() => {
    if (data) {
      const genes = keyBy(data.response.results, "gene_symbol")
      setCachedGenes({ ...genes, ...cachedGenes })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])
  const options = Object.entries(cachedGenes).map(([, gene]) => {
    return {
      value: labeledGeneSpan(gene),
      label: geneLabel(gene)
    }
  })
  return { isLoading, options }
}

export function useGeneSpanSelect(inputValue) {
  const { data, error, isLoading } = useGeneSpans(inputValue)
  let options = []
  if (data) {
    options = data.response.results.map((gene) => ({
      value: gene,
      label: labeledGeneSpan(gene)
    }))
  }
  return { isLoading, error, options }
}

function useGeneSpans(querytext) {
  const url = querytext && querytext.length > 0 && geneSearchUrl(querytext)
  return useExtendedSWR(url, (...args) =>
    fetch(...args)
      .then((res) => res.text())
      .then((t) => {
        // dataEffectResult returned is not JSON
        return JSON.parse(t)
      })
  )
}

function labeledGeneSpan(gene) {
  return (
    gene.reference_name +
    ":" +
    gene.start +
    "-" +
    gene.end +
    ":" +
    gene.gene_symbol
  )
}

function geneLabel(gene) {
  return (
    gene.gene_symbol +
    " (" +
    gene.reference_name +
    ":" +
    gene.start +
    "-" +
    gene.end +
    ")"
  )
}

function geneSearchUrl(querytext) {
  return `${basePath}cgi/bycon/services/genespans.py?geneSymbol=${querytext}`
}
