import React from "react"
import { ErrorBoundary } from "react-error-boundary"
import Head from "next/head"
import BeaconPlusNav from "./BeaconPlusNav"
import {ErrorFallback} from "./MenuHelpers"
import { SITE_DEFAULTS, THISYEAR } from "../hooks/api"

export function EntityLayout({ title, headline, children }) {
  return (
    <div className="Layout__app">
      <Head>
        <title>{title || ""}</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <BeaconPlusNav beaconName="" />
      <main className="Layout__main">
        <div className="Layout__lead">
          {headline && <h1 className="title is-4">{headline}</h1>}
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onReset={() => {
                // reset the state of your app so the error doesn't happen again
              }}
            >
              {children}
            </ErrorBoundary>
        </div>
      </main>
      <footer className="footer">
        <div className="content container has-text-centered">
          © 2000 - {THISYEAR} Progenetix Cancer Genomics Information Resource by
          the{" "}
          <a href={SITE_DEFAULTS.ORGSITELINK}>
            Computational Oncogenomics Group
          </a>{" "}
          at the{" "}
          <a href="https://www.mls.uzh.ch/en/research/baudis/">
            University of Zurich
          </a>{" "}
          and the{" "}
          <a href="http://sib.swiss/baudis-michael/">
            Swiss Institute of Bioinformatics{" "}
            <span className="span-red">SIB</span>
          </a>{" "}
          is licensed under CC BY 4.0
          <a rel="license" href="https://creativecommons.org/licenses/by/4.0">
            <img className="Layout__cc__icons" src="/img/cc-cc.svg" />
            <img className="Layout__cc__icons" src="/img/cc-by.svg" />
          </a>
          <br />
          No responsibility is taken for the correctness of the data presented
          nor the results achieved with the Progenetix tools.
        </div>
      </footer>
    </div>
  )
}
