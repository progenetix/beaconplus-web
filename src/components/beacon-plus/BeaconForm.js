import Field from "../form/Field"
import cn from "classnames"
import {
  INTEGER_RANGE_REGEX,
  useDatasets,
  useFilteringTerms
} from "../../api/bycon"
import React, { useState } from "react"
import { Spinner } from "../Spinner"
import { markdownToReact } from "../../utils/md"
import { useForm } from "react-hook-form"

export function BeaconForm({
  isLoading,
  onValidFormQuery,
  requestTypesConfig
}) {
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setError,
    setValue,
    clearErrors
  } = useForm()
  const { data: datasets, error: datasetsError } = useSelectDatasets()
  const {
    data: filteringTerms,
    error: filteringTermsError
  } = useSelectFilteringTerms()
  const [requestType, setRequestType] = useState(
    Object.entries(requestTypesConfig)[0][0] // auto select first requestType from the file
  )
  const [example, setExample] = useState(null)

  const requestConfig = requestTypesConfig[requestType]
  const parameters = requestConfig?.parameters ?? {}

  function handleRequestTypeClicked(requestTypeId) {
    setExample(null)
    const newParams = Object.fromEntries(
      Object.entries(
        requestTypesConfig[requestTypeId].parameters
      ).map(([k, v]) => [k, v?.value])
    )
    reset(newParams)
    setRequestType(requestTypeId)
  }

  function handleExampleClicked(example) {
    setExample(example)
    Object.entries(example.parameters).forEach(([k, v]) => setValue(k, v.value))
  }

  function onSubmit(formValues) {
    clearErrors()
    // At this stage individual parameters are already validated.
    const errors = validateForm(formValues)
    if (errors.length > 0) {
      errors.forEach(([name, error]) => setError(name, error))
      return
    }
    onValidFormQuery(formValues)
  }

  if (datasetsError || filteringTermsError)
    return (
      <div className="notification is-warning">Could not load form data.</div>
    )
  if (!datasets || !filteringTerms)
    return (
      <div className="notification is-info is-light">
        <div className="has-text-centered subtitle">Loading form data...</div>
        <Spinner centered />
      </div>
    )

  return (
    <>
      <Tabs
        requestTypesConfig={requestTypesConfig}
        requestType={requestType}
        onRequestTypeClicked={handleRequestTypeClicked}
      />
      <RequestDescription
        requestConfig={requestConfig}
        example={example}
        onExampleClicked={handleExampleClicked}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <SelectField
          name="datasetIds"
          label="Dataset"
          parameters={parameters}
          errors={errors}
          register={register({ required: true })}
          multiple
        >
          {datasets.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="assemblyId"
          label="Genome Assembly"
          parameters={parameters}
          errors={errors}
          register={register}
        >
          <option value="GRCh38">GRCh38 / hg38</option>
        </SelectField>
        <SelectField
          name="includeDatasetResonses"
          label="Dataset Responses"
          parameters={parameters}
          errors={errors}
          register={register}
          defaultValue="ALL"
        >
          <option value="HIT">Datasets With Hits</option>
          <option value="ALL">All Selected Datasets</option>
          <option value="MISS">Datasets Without Hits</option>{" "}
        </SelectField>
        <SelectField
          name="requestType"
          label="Variant Request Type"
          parameters={parameters}
          errors={errors}
          register={register}
          defaultValue={parameters.requestType?.value ?? "variantAlleleRequest"}
        >
          <option value="variantAlleleRequest">variantAlleleRequest</option>
          <option value="variantCNVrequest">variantCNVrequest</option>
          <option value="variantRangeRequest">variantRangeRequest</option>
          <option value="variantFusionRequest">variantFusionRequest</option>
        </SelectField>
        <SelectField
          name="referenceName"
          label="Reference name"
          parameters={parameters}
          errors={errors}
          register={register}
          defaultValue="variantCNVrequest"
        >
          {REFERENCE_NAMES.map((rn) => (
            <option key={rn} value={rn}>
              {rn}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="variantType"
          label="(Structural) Variant"
          parameters={parameters}
          errors={errors}
          register={register}
          defaultValue="variantCNVrequest"
        >
          <option value="">Not a structural variant</option>
          <option value="DEL">DEL (Deletion)</option>
          <option value="DUP">DUP (Duplication)</option>
          <option value="BND">BND (Break/Fusion)</option>{" "}
        </SelectField>
        <InputField
          name="start"
          label="Start"
          parameters={parameters}
          errors={errors}
          register={register({
            validate: checkIntegerRange
          })}
        />
        <InputField
          name="end"
          label="End Position"
          parameters={parameters}
          errors={errors}
          register={register({
            validate: checkIntegerRange
          })}
        />
        <InputField
          name="referenceBases"
          label="Ref. Base(s)"
          parameters={parameters}
          errors={errors}
          register={register}
        />
        <InputField
          name="alternateBases"
          label="Alt. Base(s)"
          parameters={parameters}
          errors={errors}
          register={register}
        />
        <SelectField
          name="bioontology"
          label="Bio-ontology"
          parameters={parameters}
          errors={errors}
          register={register}
          multiple
        >
          <option value="">{noSelection}</option>
          {filteringTerms.map((ds) => (
            <option key={ds.id} value={ds.id}>
              {ds.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="materialtype"
          label="Biosample Type"
          parameters={parameters}
          errors={errors}
          register={register}
          defaultValue=""
        >
          <option value="">{noSelection}</option>
          <option value="EFO:0009656">neoplastic sample</option>
          <option value="EFO:0009654">reference sample</option>
        </SelectField>
        <InputField
          name="freeFilters"
          label="Filters"
          parameters={parameters}
          errors={errors}
          register={register}
        />
        <div className="field is-horizontal">
          <div className="field-label" />
          <div className="field-body">
            <div className="field">
              <div className="control">
                <button
                  type="submit"
                  className={cn("button", "is-primary", {
                    "is-loading": isLoading
                  })}
                >
                  Beacon Query
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}

function Tabs({ requestTypesConfig, requestType, onRequestTypeClicked }) {
  return (
    <div className="tabs">
      <ul>
        {Object.entries(requestTypesConfig).map(([id, value]) => (
          <li
            className={cn({ "is-active": id === requestType })}
            key={id}
            onClick={() => onRequestTypeClicked(id)}
          >
            <a>{value.label}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RequestDescription({ requestConfig, onExampleClicked, example }) {
  return (
    <>
      <article className="message">
        <div className="message-body">
          <div className="content">
            {requestConfig.description &&
              markdownToReact(requestConfig?.description)}
            <div className="buttons">
              {Object.entries(requestConfig.examples || []).map(
                ([id, value]) => (
                  <button
                    key={id}
                    className="button is-info is-outlined"
                    onClick={() => onExampleClicked(value)}
                  >
                    {value.label}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </article>

      {example?.description && (
        <article className="message is-info">
          <div className="message-body">
            <div className="content">
              {markdownToReact(example?.description)}
            </div>
          </div>
        </article>
      )}
    </>
  )
}

function InputField({ name, label, parameters, errors, register }) {
  return (
    <Field
      label={label}
      help={errors[name]?.message}
      hidden={parameters[name]?.hide}
    >
      <input
        name={name}
        className={cn("input", {
          "is-danger": errors[name]
        })}
        ref={register}
        type="text"
        placeholder={parameters[name]?.placeholder}
      />
    </Field>
  )
}

function validateForm(formValues) {
  const {
    requestType,
    variantType,
    referenceBases,
    alternateBases,
    start,
    end
  } = formValues

  const errors = []
  const setMissing = (name) =>
    errors.push([name, { type: "manual", message: "Parameter is missing" }])

  if (requestType === "variantAlleleRequest") {
    if (!referenceBases || !alternateBases || !start) {
      !referenceBases && setMissing("referenceBases")
      !alternateBases && setMissing("alternateBases")
      !start && setMissing("start")
    }
  } else if (requestType === "variantCNVrequest") {
    if (!start || !end || !variantType) {
      !start && setMissing("start")
      !end && setMissing("end")
      !variantType && setMissing("variantType")
    }
  } else if (requestType === "variantRangeRequest") {
    if (variantType && (referenceBases || alternateBases)) {
      const error = {
        type: "manual",
        message: "Use either Variant Type or Ref. Base(s) and Alt. Base(s)."
      }
      errors.push(["variantType", error])
      errors.push(["referenceBases", error])
      errors.push(["alternateBases", error])
    }
    if (!variantType && !(referenceBases || alternateBases)) {
      setMissing("variantType")
      setMissing("referenceBases")
      setMissing("alternateBases")
    }
  } else if (requestType === "variantFusionRequest") {
    //
  }
  return errors
}

export const checkIntegerRange = (value) => {
  if (!value) return
  const match = INTEGER_RANGE_REGEX.exec(value)
  if (!match) return "Input should be a range (ex: 1-5) or a single value"
  const [, range0, range1] = match
  if (range1 && range0 > range1)
    return "Incorrect range input, max should be greater than min"
}

function SelectField({
  name,
  label,
  parameters,
  errors,
  register,
  children,
  defaultValue,
  multiple
}) {
  return (
    <Field
      label={label}
      help={errors[name]?.message}
      hidden={parameters[name]?.hide}
    >
      <div
        className={cn("select", "is-fullwidth", {
          "is-danger": errors[name],
          "is-multiple": multiple
        })}
      >
        <select
          defaultValue={defaultValue}
          name={name}
          ref={register}
          multiple={multiple}
        >
          {children}
        </select>
      </div>
    </Field>
  )
}

// Maps datasets hook to data usable by DataFetchSelect
function useSelectDatasets() {
  const { data, error } = useDatasets()
  return {
    data:
      data &&
      data.datasets.map((value) => ({
        id: value.id,
        label: value.name
      })),
    error
  }
}

// Maps FilteringTerms hook to data usable by DataFetchSelect
function useSelectFilteringTerms() {
  const { data, error } = useFilteringTerms("NCIT,icdom")
  return {
    data:
      data &&
      data.filteringTerms.map((value) => ({
        id: value.id,
        label: `${value.id}: ${value.label} (${value.count})`
      })),
    error
  }
}

const noSelection = "(no selection)"

const REFERENCE_NAMES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "X",
  "Y"
]
