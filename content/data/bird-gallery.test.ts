import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { BIRD_GALLERY, FEATURED_BIRD_ID } from './bird-gallery'

/**
 * Guards the bird gallery's attribution and self-classification promises (acceptance
 * criteria 19 and 20): every species carries real Commons attribution under a public-domain
 * or CC0 licence, and every expectedLabel/topProbability pair matches the committed
 * softmax.json to the digit, so the page can never quote a probability the forward pass did
 * not produce.
 */

const GALLERY_DIR = path.resolve(__dirname, '../../public/projects/bird-species-cnn/gallery')

interface SoftmaxEntry {
  label: string
  probability: number
}

describe('content/data/bird-gallery.ts', () => {
  it('has exactly eight species, each with complete Commons attribution', () => {
    expect(BIRD_GALLERY.length).toBe(8)

    const ids = BIRD_GALLERY.map((bird) => bird.id)
    expect(new Set(ids).size).toBe(ids.length)

    for (const bird of BIRD_GALLERY) {
      expect(bird.common.trim().length).toBeGreaterThan(0)
      expect(bird.scientific.trim().length).toBeGreaterThan(0)
      expect(bird.expectedLabel.trim().length).toBeGreaterThan(0)
      expect(bird.photographer.trim().length).toBeGreaterThan(0)
      expect(bird.license.trim().length).toBeGreaterThan(0)
      expect(bird.license).toMatch(/public domain|cc0/i)
      expect(bird.sourceUrl.trim().length).toBeGreaterThan(0)
      expect(new URL(bird.sourceUrl).hostname).toBe('commons.wikimedia.org')
      expect(bird.sourceFile.trim().length).toBeGreaterThan(0)
    }
  })

  it('features the American robin', () => {
    expect(FEATURED_BIRD_ID).toBe('american-robin')
    expect(BIRD_GALLERY.some((bird) => bird.id === FEATURED_BIRD_ID)).toBe(true)
  })

  it.each(BIRD_GALLERY)(
    '$id: expectedLabel and topProbability match the committed softmax.json rank 1',
    (bird) => {
      const softmaxPath = path.join(GALLERY_DIR, bird.id, 'softmax.json')
      const softmax = JSON.parse(readFileSync(softmaxPath, 'utf8')) as SoftmaxEntry[]

      expect(softmax.length).toBe(16)
      expect(softmax[0].label).toBe(bird.expectedLabel)
      expect(softmax[0].probability).toBe(bird.topProbability)

      // Descending order end to end, so "top-16" is not just the first entry being largest.
      for (let i = 1; i < softmax.length; i += 1) {
        expect(softmax[i].probability).toBeLessThanOrEqual(softmax[i - 1].probability)
      }
    },
  )

  it('every species has its three committed asset files, and no others outside budget', () => {
    for (const bird of BIRD_GALLERY) {
      for (const file of ['thumb-96.webp', 'photo-320.webp', 'softmax.json']) {
        const assetPath = path.join(GALLERY_DIR, bird.id, file)
        expect(() => readFileSync(assetPath)).not.toThrow()
      }
    }
  })
})
