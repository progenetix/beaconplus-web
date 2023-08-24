import React from "react"
import { useRouter } from "next/router"
import ActiveLink from "./ActiveLink"
import Link from "next/link"
import { SITE_DEFAULTS } from "../hooks/api"

export default function BeaconPlusNav({ beaconName }) {
  const router = useRouter()
  return (
    <header className="section Nav__header">
      <nav
        className="BeaconPlus__container Nav__wrapper"
        role="navigation"
        aria-label="main navigation"
      >
        <Link href={router}>
          <a className="Nav__logo">
            {beaconName} Beacon<sup className="Nav__plus">+</sup>
          </a>
        </Link>        

        <div className="Nav__links">
{/*
          <ActiveLink label="Aggregator" href="/beaconAggregator/" />
*/}
          <ActiveLink label="Progenetix" href="/" />
          <a href={SITE_DEFAULTS.MASTERDOCLINK} className="navbar-item">
            Help
          </a>
        </div>
      </nav>
    </header>
  )
}
