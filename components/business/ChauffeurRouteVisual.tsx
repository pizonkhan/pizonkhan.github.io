'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import clsx from 'clsx'
import { DURATION, STAGGER, usePrefersReducedMotion } from '@/lib/motion'
import {
  ACCENT_STROKE,
  ACCENT_WIDTH,
  CONTEXT_FILL,
  CONTEXT_STROKE,
  DOT_RADIUS,
  HERO_ROUTE,
  HERO_VIEWBOX,
  SEDAN_MINI,
  STRUCTURE_STROKE,
  STRUCTURE_WIDTH,
} from './business-geometry'

export interface ChauffeurRouteVisualProps {
  className?: string
}

/**
 * Six beats, timed against DURATION and STAGGER from lib/motion.ts: the street grid settles,
 * the two endpoints settle, the route draws, the road draws, the car arrives and its cabin
 * draws. Total run about 2.58s, once, never resets.
 */
const GRID_STEP_MS = STAGGER * 1000
const GRID_DURATION_MS = DURATION.slow * 1000

const ENDPOINTS_START_MS = 520
const ENDPOINTS_DURATION_MS = DURATION.base * 1000
const DROPOFF_DELAY_MS = 80

const ROUTE_START_MS = 880
const ROUTE_DURATION_MS = DURATION.draw * 1000

const ROAD_START_MS = 1780
const ROAD_DURATION_MS = DURATION.slow * 1000

const CAR_START_MS = 2100
const CAR_DURATION_MS = DURATION.slow * 1000

const CABIN_START_MS = 2340
const CABIN_DURATION_MS = DURATION.base * 1000

function gridStyle(index: number, playing: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1 }
  return {
    opacity: playing ? 1 : 0,
    transition: `opacity ${GRID_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${index * GRID_STEP_MS}ms`,
  }
}

function endpointStyle(delayOffsetMs: number, playing: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: playing ? 1 : 0,
    transform: playing ? 'none' : 'translateY(4px)',
    transition: `opacity ${ENDPOINTS_DURATION_MS}ms var(--ease-out), transform ${ENDPOINTS_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${ENDPOINTS_START_MS + delayOffsetMs}ms`,
  }
}

function routeStyle(playing: boolean, reduced: boolean): CSSProperties {
  const length = HERO_ROUTE.route.length
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${ROUTE_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${ROUTE_START_MS}ms`,
  }
}

function roadStyle(playing: boolean, reduced: boolean): CSSProperties {
  const length = HERO_ROUTE.road.length
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${ROAD_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${ROAD_START_MS}ms`,
  }
}

function carStyle(playing: boolean, reduced: boolean): CSSProperties {
  if (reduced) return { opacity: 1, transform: 'none' }
  return {
    opacity: playing ? 1 : 0,
    transform: playing ? 'none' : 'translateX(-10px)',
    transition: `opacity ${CAR_DURATION_MS}ms var(--ease-out), transform ${CAR_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${CAR_START_MS}ms`,
  }
}

function cabinStyle(playing: boolean, reduced: boolean): CSSProperties {
  const length = SEDAN_MINI.cabin.length
  if (reduced) return { strokeDasharray: length, strokeDashoffset: 0 }
  return {
    strokeDasharray: length,
    strokeDashoffset: playing ? 0 : length,
    transition: `stroke-dashoffset ${CABIN_DURATION_MS}ms var(--ease-out)`,
    transitionDelay: `${CABIN_START_MS}ms`,
  }
}

/**
 * The page-header visual. Decorative and aria-hidden: the header's h1 and lead carry the
 * accessible meaning, the same contract HeroNeighborFill and HeroForestSplit document.
 */
export function ChauffeurRouteVisual({ className }: ChauffeurRouteVisualProps) {
  const reduced = usePrefersReducedMotion()
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    // One-shot: flips once after mount so the CSS transitions above animate from their
    // unrevealed state to their final one, then stays true. Never resets, never loops.
    const id = window.requestAnimationFrame(() => setPlaying(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const scale = HERO_ROUTE.car.scale
  const [translateX, translateY] = HERO_ROUTE.car.translate

  return (
    <div
      aria-hidden
      className={clsx('aspect-[5/4] w-full', className)}
      style={
        reduced
          ? { opacity: playing ? 1 : 0, transition: `opacity ${DURATION.fast * 1000}ms var(--ease-out)` }
          : undefined
      }
    >
      <svg viewBox={HERO_VIEWBOX} className="h-full w-full" strokeLinecap="round" strokeLinejoin="round">
        {HERO_ROUTE.grid.map((d, index) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={CONTEXT_STROKE}
            strokeWidth={HERO_ROUTE.gridWidth}
            style={gridStyle(index, playing, reduced)}
          />
        ))}

        <g style={endpointStyle(0, playing, reduced)}>
          <circle cx={HERO_ROUTE.pickup.cx} cy={HERO_ROUTE.pickup.cy} r={DOT_RADIUS} fill={CONTEXT_FILL} />
          <circle
            cx={HERO_ROUTE.pickup.cx}
            cy={HERO_ROUTE.pickup.cy}
            r={HERO_ROUTE.pickup.r}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
          />
        </g>
        <g style={endpointStyle(DROPOFF_DELAY_MS, playing, reduced)}>
          <circle cx={HERO_ROUTE.dropoff.cx} cy={HERO_ROUTE.dropoff.cy} r={DOT_RADIUS} fill={CONTEXT_FILL} />
          <circle
            cx={HERO_ROUTE.dropoff.cx}
            cy={HERO_ROUTE.dropoff.cy}
            r={HERO_ROUTE.dropoff.r}
            fill="none"
            stroke={STRUCTURE_STROKE}
            strokeWidth={STRUCTURE_WIDTH}
          />
        </g>

        <path
          d={HERO_ROUTE.route.d}
          fill="none"
          stroke={ACCENT_STROKE}
          strokeWidth={ACCENT_WIDTH}
          style={routeStyle(playing, reduced)}
        />

        <path
          d={HERO_ROUTE.road.d}
          fill="none"
          stroke={STRUCTURE_STROKE}
          strokeWidth={STRUCTURE_WIDTH}
          style={roadStyle(playing, reduced)}
        />

        <g transform={`translate(${translateX} ${translateY}) scale(${scale})`}>
          <g style={carStyle(playing, reduced)}>
            <path
              d={SEDAN_MINI.body.d}
              fill="none"
              stroke={STRUCTURE_STROKE}
              strokeWidth={STRUCTURE_WIDTH / scale}
            />
            {SEDAN_MINI.wheels.map((wheel) => (
              <circle
                key={`${wheel.cx}-${wheel.cy}`}
                cx={wheel.cx}
                cy={wheel.cy}
                r={wheel.r}
                fill="none"
                stroke={STRUCTURE_STROKE}
                strokeWidth={STRUCTURE_WIDTH / scale}
              />
            ))}
            <path
              d={SEDAN_MINI.cabin.d}
              fill="none"
              stroke={ACCENT_STROKE}
              strokeWidth={ACCENT_WIDTH / scale}
              style={cabinStyle(playing, reduced)}
            />
          </g>
        </g>
      </svg>
    </div>
  )
}
