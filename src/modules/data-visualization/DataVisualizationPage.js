import { withUrlQuery } from "../../hooks/url-query"
import { Layout } from "../../components/layouts/Layout"
import React, { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import SelectField from "../../components/form/SelectField"
import InputField from "../../components/form/InputField"
import cn from "classnames"
import {
  replaceWithProxy,
  useDataVisualization,
  useGeneSpans
} from "../../hooks/api"
import { WithData } from "../../components/Loader"
import { useContainerDimensions } from "../../hooks/containerDimensions"
import { useAsyncSelect } from "../../hooks/asyncSelect"

const DataVisualizationPage = withUrlQuery(({ urlQuery }) => {
  const { accessid } = urlQuery
  const componentRef = useRef()
  const { width } = useContainerDimensions(componentRef)
  return (
    <Layout title="Data visualization" headline="Data visualization">
      {!accessid ? (
        <NoResultsHelp />
      ) : (
        <div ref={componentRef}>
          {width > 0 && (
            <DataVisualizationPanel accessid={accessid} width={width} />
          )}
        </div>
      )}
    </Layout>
  )
})
export default DataVisualizationPage

function NoResultsHelp() {
  return (
    <div className="notification is-size-5">
      This page will only show content if called with a specific <i>accessid</i>
      . Please start over from the Search Samples page.
    </div>
  )
}

function DataVisualizationPanel({ accessid, width }) {
  const [formValues, setFormValues] = useState({})
  const dataResult = useDataVisualization({
    accessid,
    "-size_plotimage_w_px": width,
    ...formValues
  })
  const onSubmit = (values) => {
    setFormValues(values)
    dataResult.mutate(null)
  }
  return (
    <div>
      <div className="columns">
        <div className="mb-6 column is-half-desktop">
          <DataVisualizationForm isQuerying={false} onSubmit={onSubmit} />
        </div>
      </div>
      <WithData
        background
        dataEffectResult={dataResult}
        render={(data) => <ResultPanel response={data} />}
      />
    </div>
  )
}

function DataVisualizationForm({ isQuerying, onSubmit }) {
  const defaultValues = { group_by: "", "-markers": "" }
  const { register, handleSubmit, errors, control } = useForm({ defaultValues })
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputField
        name="-chr2plot"
        label="Chromosomes"
        errors={errors}
        register={register}
        defaultValue="1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,X"
      />
      <InputField
        name="-randno"
        label="Random Samples (no.)"
        errors={errors}
        register={register}
      />
      <div className="columns">
        <div className="column">
          <SelectField
            name="group_by"
            register={register}
            label="Plot Grouping"
            options={groupByOptions}
            control={control}
            errors={errors}
          />
        </div>
        <div className="column">
          <InputField
            name="-min_group_no"
            label="Min. Samples per Group"
            errors={errors}
            register={register}
            defaultValue="2"
          />
        </div>
      </div>
      <GeneSpanSelector errors={errors} register={register} control={control} />
      <div className="field mt-5">
        <div className="control">
          <button
            type="submit"
            className={cn("button", "is-primary", {
              "is-loading": isQuerying
            })}
          >
            Plot Data
          </button>
        </div>
      </div>
    </form>
  )
}

function ResultPanel({ response }) {
  const histogramUrl = response.data?.plots?.histogram?.svg_link_tmp
  const multistripUrl = response.data?.plots?.multistrip?.svg_link_tmp
  return (
    <div>
      <img src={replaceWithProxy(histogramUrl)} />
      <img src={replaceWithProxy(multistripUrl)} />
    </div>
  )
}

const groupByOptions = [
  { value: "biocharacteristics::NCIT", label: "NCIT code" },
  { value: "biocharacteristics::icdom", label: "ICD-O Morphology code" },
  { value: "biocharacteristics::icdot", label: "ICD Topography code" },
  { value: "external_references::PMID", label: "Publication (PubMed code)" },
  { value: "external_references::geogse-GSE", label: "GEO Series ID" },
  {
    value: "external_references::cellosaurus",
    label: "Cellosaurus Cellline ID"
  }
]

function GeneSpanSelector({ control, errors, register }) {
  const { inputValue, onInputChange } = useAsyncSelect()
  let { options, isLoading } = useGenSpanSelect(inputValue)
  return (
    <SelectField
      name="-markers"
      label="Gene selection"
      isLoading={isLoading && !!inputValue}
      options={options}
      onInputChange={onInputChange}
      control={control}
      errors={errors}
      register={register}
      isMulti
    />
  )
}

function useGenSpanSelect(inputValue) {
  const { data, isLoading } = useGeneSpans(inputValue)
  let options = []
  if (data) {
    options = data.genes.map(
      ({ reference_name, cds_start_min, cds_end_max, gene_symbol }) => ({
        value: `${reference_name}:${cds_start_min}-${cds_end_max}:${gene_symbol}`,
        label: `${gene_symbol} (${reference_name}:${cds_start_min}-${cds_end_max})`
      })
    )
  }
  return { isLoading, options }
}
