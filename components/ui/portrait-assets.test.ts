import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/**
 * Verifies the two committed portrait derivatives against the plan's asset-prep contract
 * (acceptance criteria 39-41): exact pixel dimensions, sRGB, no EXIF, and the size budget.
 * Guards against a future re-export silently drifting off spec.
 */

const IMG_DIR = path.resolve(__dirname, '../../public/img')

describe('public/img portrait derivatives', () => {
  it.each([
    { file: 'portrait-256.webp', size: 256, budgetBytes: 18 * 1024 },
    { file: 'portrait-640.webp', size: 640, budgetBytes: 55 * 1024 },
  ])('$file is exactly $size x $size, under budget, sRGB, EXIF-free', async ({ file, size, budgetBytes }) => {
    const filePath = path.join(IMG_DIR, file)
    const buffer = readFileSync(filePath)

    expect(buffer.byteLength).toBeLessThanOrEqual(budgetBytes)
    expect(buffer.includes(Buffer.from('Exif\0\0', 'binary'))).toBe(false)

    const metadata = await sharp(buffer).metadata()
    expect(metadata.width).toBe(size)
    expect(metadata.height).toBe(size)
    expect(metadata.format).toBe('webp')
    // sRGB source images from a plain phone camera should carry no non-sRGB ICC profile.
    expect(metadata.icc).toBeUndefined()
  })
})
