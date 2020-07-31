import React from "react"
import { SubsetHistogram } from "../../components/Histogram"
import { usePublicationCount } from "../../hooks/api"
import { useGlobalLoading } from "../../hooks/globalLoading"

export const ExampleHistogram = () => (
  <SubsetHistogram
    datasetIds="progenetix"
    id="icdom-92603"
    filter="filter"
    scope="biosubsets"
    chr2plot="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22"
  />
)

export const PublicationCount = () => {
  const { data } = useGlobalLoading(usePublicationCount, "publicationCount")
  return data ?? null
}
