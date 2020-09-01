import { useCollationsById, useCollations } from "../../hooks/api"
import { WithData } from "../../components/Loader"
import React, { useMemo, useReducer } from "react"
import { withUrlQuery } from "../../hooks/url-query"
import { Layout } from "../../components/layouts/Layout"
import { sortBy, keyBy, merge } from "lodash"
import { getOrMakeChild, getOrMakeNode } from "./tree"
import biosubsetsConfig from "./config.yaml"
import { SubsetHistogram } from "../../components/Histogram"
import SubsetsTree from "./SubsetsTree"

const makeEntries = (config, queryValue) => {
  let configEntries = Object.entries(config)
  if (queryValue && !configEntries.find(([c]) => c === queryValue)) {
    configEntries = [[queryValue, { label: queryValue }], ...configEntries]
  }
  return configEntries
}

function useConfigSelect(config, key, urlQuery, setUrlQuery) {
  const queryValue = urlQuery[key]
  const configEntries = useMemo(() => makeEntries(config, queryValue), [
    config,
    queryValue
  ])
  const selected =
    configEntries.find(([c]) => c === queryValue)?.[0] ?? configEntries[0][0]
  const setSelected = (newValue) => setUrlQuery({ [key]: newValue })
  const options = configEntries.map(([k, v]) => (
    <option key={k} value={k}>
      {v.label}
    </option>
  ))
  return {
    selected,
    setSelected,
    options
  }
}

export default function BioSubsetsPage() {
  return (
    <Layout title="Subsets" headline="Subsets">
      <BioSubsetsContent />
    </Layout>
  )
}

const BioSubsetsContent = withUrlQuery(({ urlQuery, setUrlQuery }) => {
  const {
    selected: selectedFilters,
    setSelected: setSelectedFilters,
    options: filtersOptions
  } = useConfigSelect(
    biosubsetsConfig.filters,
    "filters",
    urlQuery,
    setUrlQuery
  )
  const {
    selected: selectedDatasetIds,
    setSelected: setSelectedDatasetIds,
    options: datasetIdsOptions
  } = useConfigSelect(
    biosubsetsConfig.datasetIds,
    "datasetIds",
    urlQuery,
    setUrlQuery
  )
  return (
    <>
      <div className="level mb-6">
        <div className="level-left">
          <div className="level-item">
            <p>Filters:</p>
          </div>
          <div className="level-item">
            <span className="select">
              <select
                value={selectedFilters}
                onChange={(e) => setSelectedFilters(e.target.value)}
              >
                {filtersOptions}
              </select>
            </span>
          </div>

          <div className="level-item">
            <p>Dataset:</p>
          </div>
          <div className="level-item">
            <span className="select">
              <select
                value={selectedDatasetIds}
                onChange={(e) => setSelectedDatasetIds(e.target.value)}
              >
                {datasetIdsOptions}
              </select>
            </span>
          </div>
        </div>
      </div>
      <SubsetsLoader
        filters={selectedFilters}
        datasetIds={selectedDatasetIds}
      />
    </>
  )
})

function SubsetsLoader({ filters, datasetIds }) {
  const bioSubsetsHierarchies = useCollations({
    filters,
    datasetIds,
    method: "paths"
  })

  const allBioSubsets = useCollationsById({
    datasetIds
  })
  return (
    <WithData
      dataEffectResult={bioSubsetsHierarchies}
      background
      render={(bioSubsetsHierarchies) => (
        <WithData
          dataEffectResult={allBioSubsets}
          background
          render={(allBioSubsets) => (
            <SubsetsResponse
              bioSubsetsHierarchies={bioSubsetsHierarchies}
              allBioSubsets={allBioSubsets}
              datasetIds={datasetIds}
            />
          )}
        />
      )}
    />
  )
}

function SubsetsResponse({ bioSubsetsHierarchies, allBioSubsets, datasetIds }) {
  const isDetailPage = bioSubsetsHierarchies.length === 1

  // We merge both subsets from hierarchies and subsets from allSubsets.
  // This is because some children in the bioSubsetsHierarchies don't have labels or sample count information.
  const subsetById = useMemo(
    () => merge(keyBy(bioSubsetsHierarchies, "id"), allBioSubsets),
    [allBioSubsets, bioSubsetsHierarchies]
  )

  const tree = useMemo(
    () =>
      isDetailPage
        ? buildTreeForDetails(bioSubsetsHierarchies, subsetById)
        : buildTree(bioSubsetsHierarchies, subsetById),
    [bioSubsetsHierarchies, subsetById, isDetailPage]
  )
  const [state, dispatch] = useReducer(reducer, initialState)
  const checkIsCollapsed = useMemo(
    () =>
      mkIsCollapsedByPath({
        defaultState: state.defaultState,
        defaultExpandedLevel: state.defaultExpandedLevel
      }),
    [state.defaultState, state.defaultExpandedLevel]
  )
  const checkedSubsets = useMemo(
    () =>
      Object.entries(state.checked).map(([id]) => {
        return subsetById[id]
      }),
    [state.checked, subsetById]
  )
  const hasCheckedSubsets = checkedSubsets.length > 0
  const selectSamplesHref =
    hasCheckedSubsets &&
    sampleSelectUrl({ subsets: checkedSubsets, datasetIds })
  let histogram
  if (isDetailPage) {
    histogram = (
      <div className="mb-6">
        <SubsetHistogram
          id={bioSubsetsHierarchies[0].id}
          datasetIds={datasetIds}
          loaderProps={{
            background: true,
            colored: true
          }}
        />
      </div>
    )
  }
  return (
    <div>
      {histogram}
      <div className="BioSubsets__sample-selection">
        <a
          className="button is-info mb-3"
          disabled={!hasCheckedSubsets}
          href={selectSamplesHref || null}
        >
          Select Samples from checked Subsets
        </a>
        <ul className="tags">
          {checkedSubsets.map((subset) => (
            <li className="tag" key={subset.id}>
              {subset.label} ({subset.child_terms?.length + 1})
            </li>
          ))}
        </ul>
      </div>
      <div className="BioSubsets__tree">
        <SubsetsTree
          tree={tree}
          datasetIds={datasetIds}
          checkIsCollapsed={checkIsCollapsed}
          collapsedOverrides={state.overrides}
          defaultExpandedLevel={state.defaultExpandedLevel}
          dispatch={dispatch}
        />
      </div>
    </div>
  )
}

const initialState = {
  overrides: {},
  defaultState: "expanded",
  defaultExpandedLevel: 1,
  checked: {}
}

function reducer(state, { type, payload }) {
  switch (type) {
    case "expand":
      return {
        ...state,
        overrides: { ...state.overrides, [payload]: "expanded" }
      }
    case "collapse":
      return {
        ...state,
        overrides: { ...state.overrides, [payload]: "collapsed" }
      }
    case "collapseAll":
      return {
        ...state,
        overrides: initialState.overrides,
        defaultState: "collapsed"
      }
    case "expandAll":
      return {
        ...state,
        overrides: initialState.overrides,
        defaultState: "expanded"
      }
    case "setLevel":
      return {
        ...state,
        overrides: {},
        defaultState: "expanded",
        defaultExpandedLevel: payload
      }
    case "checkboxClicked":
      if (payload.checked) {
        return {
          ...state,
          checked: { ...state.checked, [payload.id]: true }
        }
      } else {
        const { [payload.id]: omit, ...otherChecked } = state.checked
        return {
          ...state,
          checked: otherChecked
        }
      }
    default:
      throw new Error()
  }
}

const mkIsCollapsedByPath = ({ defaultState, defaultExpandedLevel }) => (
  override,
  depth
) => {
  if (override != null) return override === "collapsed"
  if (defaultState === "expanded") {
    // const depth = path.length - 2 // 2 because 1 is the tree fake "root"
    return depth > defaultExpandedLevel
  } else {
    return true
  }
}

export function buildTree(response, subsetById) {
  const hierarchyPaths = response.flatMap((subset) => subset.hierarchy_paths)
  const sortedHierarchyPaths = sortBy(hierarchyPaths, [
    function (p) {
      return p.order
    }
  ])

  // add an arbitrary root
  const tree = { name: "root", children: [], path: ["root"] }
  for (const hierarchy of sortedHierarchyPaths) {
    if (hierarchy.path) {
      const path = hierarchy.path.filter((p) => !!p)
      const fullPath = ["root", ...path]
      const node = getOrMakeNode(tree, fullPath)
      node.subset = subsetById[node.name]
    }
  }
  return tree
}

export function buildTreeForDetails(response, subsetById) {
  const rootSubset = response[0]
  const tree = { name: "root", children: [], path: ["root"] }
  const rootNode = getOrMakeChild(tree, rootSubset.id)
  rootNode.subset = rootSubset
  const child_terms = rootSubset.child_terms
  child_terms.forEach((c) => {
    // some subsets have themself in the children list
    if (rootSubset.id !== c) {
      const node = getOrMakeChild(rootNode, c)
      node.subset = subsetById[node.name]
    }
  })
  return tree
}

function sampleSelectUrl({ subsets, datasetIds }) {
  const samples = subsets
    .flatMap((subset) => [subset.id, ...(subset?.child_terms ?? [])])
    .join(",")

  return `/samples/search?bioontology=${samples}&datasetIds=${datasetIds}&filterLogic=OR&executeSearch=true`
}
