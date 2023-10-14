import React from "react"
import parametersConfig from "../config/searchParameters.yaml"
import requestTypeConfig from "../config/beaconplus_searchParameters.yaml"
import requestTypeExamples from "../config/beaconplus_searchExamples.yaml"
import BiosamplesSearchPanel from "../components/searchForm/BiosamplesSearchPanel"
import BeaconPlusNav from "../components/BeaconPlusNav"
import Panel from "../components/Panel"

export default function BeaconPlusPage({cytoBands}) {
  return (
    <>
      <BeaconPlusNav />
      <div className="section">
        <div className="BeaconPlus__container">
          <Panel className="content">
            <div>
                This forward looking Beacon interface proposes additional,
                planned features beyond the <a href="http://docs.genomebeacons.org/">current Beacon v2 specifications</a>. The Beacon<sup>+</sup> genome variation service tests experimental features and proposed extensions to the <a href="http://beacon-project.io">Beacon</a> protocol. The
                service is implemented using the <a href="https://github.com/progenetix/bycon">bycon</a> backend
                and allows access to the various datasets represented through the <a href="http://progenetix.org">Progenetix</a> cancer genomics resource.
                Further information about the Beacon project can be found through
                the <a href="http://beacon-project.io/">ELIXIR Beacon website</a>.
            </div>
          </Panel>  
          <BiosamplesSearchPanel
            cytoBands={cytoBands}
            parametersConfig={parametersConfig}
            requestTypeConfig={requestTypeConfig}
            requestTypeExamples={requestTypeExamples}
            collapsed={false}
          />
        </div>
      </div>
    </>
  )
}
























// import Page from "../modules/beaconplus-instances/beaconPlus_dataPage"
// import { getCytoBands } from "../utils/genome"
// export default Page

// // This function gets called at build time on server-side.
// export const getStaticProps = async () => ({
//   props: {
//     cytoBands: await getCytoBands()
//   }
// })
