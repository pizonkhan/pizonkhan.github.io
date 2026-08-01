/**
 * VGG16 layer table, hand-transcribed from the capstone's written report (its printed
 * model.summary() for the fine-tuned network). The spatial progression (224 -> 112 -> 56 ->
 * 28 -> 14 -> 7), the channel counts per block and the two totals below (VGG16_BACKBONE_TOTAL_PARAMS
 * and the 315-way head's 1,290,555) are the report's own numbers.
 *
 * Per-block and per-layer parameter counts are not separately printed in the report, so they
 * are computed here from VGG16's public architecture using the standard Conv2D and Dense
 * parameter formulas (kernel_h * kernel_w * in_channels * out_channels + out_channels). They
 * are not a guess: summed, they reproduce both of the report's totals exactly.
 *   - Five conv blocks (38,720 + 221,440 + 1,475,328 + 5,899,776 + 7,079,424) + fc1
 *     (102,764,544) + fc2 (16,781,312) = 134,260,544, the report's stated backbone total
 *     after removing the 1,000-way ImageNet head.
 *   - 4,096 * 315 + 315 = 1,290,555, the report's stated size for the replacement head.
 */

export interface Vgg16Block {
  block: number
  /** e.g. "Conv2D 3x3x64 x2, MaxPool" */
  layers: string
  spatialIn: number
  spatialOut: number
  channels: number
  params: number
  /** Blocks 1-3 stayed exactly as ImageNet trained them. Blocks 4-5 were fine-tuned on birds. */
  frozen: boolean
}

export const VGG16_BLOCKS: readonly Vgg16Block[] = [
  { block: 1, layers: 'Conv2D 3x3x64 x2, MaxPool', spatialIn: 224, spatialOut: 112, channels: 64, params: 38_720, frozen: true },
  { block: 2, layers: 'Conv2D 3x3x128 x2, MaxPool', spatialIn: 112, spatialOut: 56, channels: 128, params: 221_440, frozen: true },
  { block: 3, layers: 'Conv2D 3x3x256 x3, MaxPool', spatialIn: 56, spatialOut: 28, channels: 256, params: 1_475_328, frozen: true },
  { block: 4, layers: 'Conv2D 3x3x512 x3, MaxPool', spatialIn: 28, spatialOut: 14, channels: 512, params: 5_899_776, frozen: false },
  { block: 5, layers: 'Conv2D 3x3x512 x3, MaxPool', spatialIn: 14, spatialOut: 7, channels: 512, params: 7_079_424, frozen: false },
]

export interface Vgg16HeadLayer {
  name: string
  units: number
  params: number
  note?: string
}

export const VGG16_HEAD: readonly Vgg16HeadLayer[] = [
  { name: 'Flatten', units: 25_088, params: 0 },
  { name: 'fc1 (dense)', units: 4_096, params: 102_764_544 },
  { name: 'fc2 (dense)', units: 4_096, params: 16_781_312 },
  {
    name: 'Original ImageNet head (removed)',
    units: 1_000,
    params: 4_097_000,
    note: 'Discarded. Not part of any total below.',
  },
  {
    name: '315-way head (this project)',
    units: 315,
    params: 1_290_555,
    note: 'Replaces the ImageNet head.',
  },
]

/** Sum of all five conv blocks above. */
export const VGG16_CONV_PARAMS_TOTAL = 14_714_688

/** Conv blocks + fc1 + fc2, the report's own figure. Excludes both classification heads. */
export const VGG16_BACKBONE_TOTAL_PARAMS = 134_260_544
