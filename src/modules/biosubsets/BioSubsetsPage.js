import { useBioSubsets } from "../../hooks/api"
import { Loader } from "../../components/Loader"
import React, { useCallback, useMemo, useReducer, useState } from "react"
import { withQuery } from "../../hooks/query"
import { Layout } from "../../components/layouts/Layout"
import { sortBy } from "lodash"
import { getOrMakeNode } from "./tree"
import cn from "classnames"
import { FaAngleDown, FaAngleRight } from "react-icons/fa"
import PropTypes from "prop-types"
import biosubsetsConfig from "./config.yaml"
import { SubsetHistogram } from "../../components/Histogram"

function useConfigSelect(config, initialValue) {
  let configEntries = Object.entries(config)
  if (initialValue && !configEntries.find(([c]) => c === initialValue)) {
    configEntries = [[initialValue, { label: initialValue }], ...configEntries]
  }
  const defaultSelected = initialValue || configEntries[0][0]
  const [selected, setSelected] = useState(defaultSelected)
  const options = configEntries.map(([k, v]) => (
    <option key={k}>{v.label}</option>
  ))
  return {
    selected,
    setSelected,
    options
  }
}

const BioSubsetsPage = withQuery(({ urlQuery }) => {
  const {
    selected: selectedFilters,
    setSelected: setSelectedFilters,
    options: filtersOptions
  } = useConfigSelect(biosubsetsConfig.filters, urlQuery.filters)
  const {
    selected: selectedDatasetIds,
    setSelected: setSelectedDatasetIds,
    options: datasetIdsOptions
  } = useConfigSelect(biosubsetsConfig.datasetIds, urlQuery.datasetIds)
  return (
    <Layout title="Subsets" headline="Subsets">
      <div className="level">
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
    </Layout>
  )
})

export default BioSubsetsPage

function SubsetsLoader({ filters, datasetIds }) {
  const { data, error, isLoading } = useBioSubsets({
    filters,
    datasetIds
  })
  return (
    <Loader isLoading={isLoading} hasError={error} background>
      {data && <SubsetsResponse response={data} datasetIds={datasetIds} />}
    </Loader>
  )
}

function SubsetsResponse({ response, datasetIds }) {
  // memoize response computing
  const tree = useMemo(() => buildTree(response), [response])
  let histogram
  if (response.length === 1) {
    histogram = <SubsetHistogram id={response[0].id} datasetsIds={datasetIds} />
  }

  return (
    <div>
      {histogram}
      <SubsetsTree tree={tree} datasetIds={datasetIds} />
    </div>
  )
}

const initialState = {
  overrides: {},
  defaultState: "expanded",
  defaultExpandedLevel: 3
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
    default:
      throw new Error()
  }
}

const mkIsCollapsedByPath = (state) => (path) => {
  const override = state.overrides[path.join(".")]
  if (override != null) return override === "collapsed"
  if (state.defaultState === "expanded") {
    const depth = path.length - 2 // 2 because 1 is the tree fake "root"
    return depth > state.defaultExpandedLevel
  } else {
    return true
  }
}

function SubsetsTree({ tree, datasetIds }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const isCollapsedByPath = useCallback(mkIsCollapsedByPath(state), [state])
  let headers = (
    <tr>
      <th />
      <th>Subsets</th>
      <th>Samples</th>
    </tr>
  )
  return (
    <>
      <div className="BioSubsets__controls">
        <div
          className="button is-small"
          onClick={() => dispatch({ type: "collapseAll" })}
        >
          Collapse all
        </div>
        <div
          className="button is-small"
          onClick={() => dispatch({ type: "expandAll" })}
        >
          Expand
        </div>
        <span className="select is-small">
          <select
            value={state.defaultExpandedLevel}
            onChange={(event) =>
              dispatch({ type: "setLevel", payload: event.target.value })
            }
          >
            <option value={1}>1 level</option>
            <option value={2}>2 levels</option>
            <option value={3}>3 levels</option>
            <option value={4}>4 levels</option>
            <option value={5}>5 levels</option>
            <option value={99}>All</option>
          </select>
        </span>
      </div>
      <div className="table-container">
        <table className="table is-striped is-fullwidth">
          <thead>{headers}</thead>
          <tbody>
            <NodeChildren
              isCollapsedByPath={isCollapsedByPath}
              nodeChildren={tree.children}
              dispatch={dispatch}
              datasetIds={datasetIds}
            />
          </tbody>
        </table>
      </div>
    </>
  )
}

function NodeChildren({
  isCollapsedByPath,
  nodeChildren,
  datasetIds,
  dispatch
}) {
  return nodeChildren.map((node, idx) => {
    const depth = node.path.length - 2 // 2 because 1 is the tree fake "root"
    const groupCollapsed = isCollapsedByPath(node.path)
    return (
      <SubsetNode
        key={idx}
        node={node}
        groupCollapsed={groupCollapsed}
        dispatch={dispatch}
        depth={depth}
        datasetIds={datasetIds}
        isCollapsedByPath={isCollapsedByPath}
      />
    )
  })
}

const SubsetNode = ({
  node,
  dispatch,
  groupCollapsed,
  depth,
  datasetIds,
  isCollapsedByPath
}) => {
  return (
    <>
      <MemoizedRow
        node={node}
        dispatch={dispatch}
        collapsed={groupCollapsed}
        depth={depth}
        datasetIds={datasetIds}
      />
      {!groupCollapsed && node.children && (
        <NodeChildren
          isCollapsedByPath={isCollapsedByPath}
          nodeChildren={node.children}
          dispatch={dispatch}
          datasetIds={datasetIds}
        />
      )}
    </>
  )
}

SubsetNode.propTypes = {
  node: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  groupCollapsed: PropTypes.bool.isRequired,
  depth: PropTypes.number.isRequired
}

const MemoizedRow = React.memo(Row)
function Row({ node, dispatch, collapsed, depth, datasetIds }) {
  const { name, subset, children } = node
  const key = node.path.join(".")
  const marginLeft = `${depth * 20}px`
  return (
    <tr>
      <td style={{ width: 20 }}>
        <input type="checkbox" />
      </td>
      <td>
        <span style={{ marginLeft }} className="Subset__info">
          <span className={cn(!children && "is-invisible")}>
            <Expander collapsed={collapsed} dispatch={dispatch} nodeKey={key} />
          </span>
          <span>
            {name}
            {subset?.label && <span>: {subset.label}</span>}
          </span>
        </span>
      </td>
      <td style={{ whiteSpace: "nowrap" }}>
        <span>
          {subset?.count}{" "}
          <a href={`/biosubsets?filters=${name}&datasetIds=${datasetIds}`}>
            {"{↗}"}
          </a>
        </span>
      </td>
    </tr>
  )
}

function Expander({ collapsed, dispatch, nodeKey }) {
  return !collapsed ? (
    <span onClick={() => dispatch({ type: "collapse", payload: nodeKey })}>
      <span className="icon has-text-grey-dark is-clickable mr-2">
        <FaAngleDown size={18} />
      </span>
    </span>
  ) : (
    <span onClick={() => dispatch({ type: "expand", payload: nodeKey })}>
      <span className="icon has-text-grey-dark is-info is-clickable mr-2">
        <FaAngleRight size={18} />
      </span>
    </span>
  )
}

export function buildTree(response) {
  const subsetById = Object.fromEntries(
    response.map((subset) => [subset.id, subset])
  )
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
