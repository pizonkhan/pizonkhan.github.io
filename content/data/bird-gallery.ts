/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-bird-assets.py against Wikimedia Commons. Every photographer,
 * licence and source URL below was read from the Commons API's imageinfo and extmetadata at
 * build time, not typed in by hand, and every expectedLabel/topProbability pair was verified
 * against a real VGG16(weights='imagenet') forward pass over that species' own cropped
 * photograph. The confirm-prefixed fields describe a second, different photograph of the same
 * species, verified against the same expected label by its own forward pass and carrying its
 * own attribution, never the first photo's.
 */

export interface GalleryBird {
  /** Kebab-case id, also the asset directory name. */
  id: string
  /** Common name as rendered in the picker. */
  common: string
  /** Binomial, rendered in the caption. */
  scientific: string
  /** The ImageNet-1k class the forward pass is expected to return as rank 1. */
  expectedLabel: string
  /** The probability it actually returned for that label, from the same pass. */
  topProbability: number
  photographer: string
  license: string
  sourceUrl: string
  /** Source file on Wikimedia Commons, for reproducibility. */
  sourceFile: string
  /** The confirmation photo's own probability for expectedLabel, from its own forward pass. */
  confirmTopProbability: number
  confirmPhotographer: string
  confirmLicense: string
  confirmSourceUrl: string
  /** The confirmation photo's source file on Wikimedia Commons, for reproducibility. */
  confirmSourceFile: string
}

export const BIRD_GALLERY: readonly GalleryBird[] = [
  { id: "american-robin", common: "American robin", scientific: "Turdus migratorius", expectedLabel: "robin", topProbability: 0.995791, photographer: "U.S. Fish and Wildlife Service - Midwest Region", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:American_robin_(49781211678).jpg", sourceFile: "American robin (49781211678).jpg", confirmTopProbability: 0.999806, confirmPhotographer: "U.S. Fish and Wildlife Service - Midwest Region", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:American_robin_(46946243164).jpg", confirmSourceFile: "American robin (46946243164).jpg" },
  { id: "bald-eagle", common: "Bald eagle", scientific: "Haliaeetus leucocephalus", expectedLabel: "bald eagle", topProbability: 0.999651, photographer: "Hillebrand, Steve", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Haliaeetus_leucocephalus-tree-USFWS.jpg", sourceFile: "Haliaeetus leucocephalus-tree-USFWS.jpg", confirmTopProbability: 0.997896, confirmPhotographer: "USFWS - Pacific Region", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:USFWS_bald_eagle_(23770875811).jpg", confirmSourceFile: "USFWS bald eagle (23770875811).jpg" },
  { id: "american-goldfinch", common: "American goldfinch", scientific: "Spinus tristis", expectedLabel: "goldfinch", topProbability: 0.98409, photographer: "U.S. Fish and Wildlife Service - Midwest Region", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:American_goldfinch_(49882388693).jpg", sourceFile: "American goldfinch (49882388693).jpg", confirmTopProbability: 0.999945, confirmPhotographer: "USFWS - Pacific Region", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:USFWS_american_goldfinch_(23226564663).jpg", confirmSourceFile: "USFWS american goldfinch (23226564663).jpg" },
  { id: "great-gray-owl", common: "Great gray owl", scientific: "Strix nebulosa", expectedLabel: "great grey owl", topProbability: 0.987493, photographer: "USFWSAlaska", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Great_gray_owl_(53298384180).jpg", sourceFile: "Great gray owl (53298384180).jpg", confirmTopProbability: 0.999917, confirmPhotographer: "YellowstoneNPS", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:A_Great_Gray_Owl_perched_in_a_lodgepole_pine_tree_(53482537206).jpg", confirmSourceFile: "A Great Gray Owl perched in a lodgepole pine tree (53482537206).jpg" },
  { id: "american-white-pelican", common: "American white pelican", scientific: "Pelecanus erythrorhynchos", expectedLabel: "pelican", topProbability: 0.990135, photographer: "USFWS Mountain Prairie", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:American_White_Pelican_Bear_River_MBR_(51847214774).jpg", sourceFile: "American White Pelican Bear River MBR (51847214774).jpg", confirmTopProbability: 0.930744, confirmPhotographer: "USFWS Mountain Prairie", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:American_White_Pelican_Bear_River_MBR_(51846956603).jpg", confirmSourceFile: "American White Pelican Bear River MBR (51846956603).jpg" },
  { id: "laysan-albatross", common: "Laysan albatross", scientific: "Phoebastria immutabilis", expectedLabel: "albatross", topProbability: 0.999317, photographer: "U.S. Fish and Wildlife Service Headquarters", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Laysan_albatross,_Credit_USFWS_Chris_Swenson_(5182342300).jpg", sourceFile: "Laysan albatross, Credit USFWS Chris Swenson (5182342300).jpg", confirmTopProbability: 0.99872, confirmPhotographer: "U.S. Fish and Wildlife Service Headquarters", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:Laysan_albatross,_Credit_USFWS_Chris_Swenson_(5182342580).jpg", confirmSourceFile: "Laysan albatross, Credit USFWS Chris Swenson (5182342580).jpg" },
  { id: "great-egret", common: "Great egret", scientific: "Ardea alba", expectedLabel: "American egret", topProbability: 0.816437, photographer: "USFWS - Pacific Region", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:USFWS_great_egret_(23853294125).jpg", sourceFile: "USFWS great egret (23853294125).jpg", confirmTopProbability: 0.847785, confirmPhotographer: "U.S. Fish and Wildlife Service - Midwest Region", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:Great_egret_(53828514975).jpg", confirmSourceFile: "Great egret (53828514975).jpg" },
  { id: "ruby-throated-hummingbird", common: "Ruby-throated hummingbird", scientific: "Archilochus colubris", expectedLabel: "hummingbird", topProbability: 0.999936, photographer: "U.S. Fish and Wildlife Service - Midwest Region", license: "Public domain", sourceUrl: "https://commons.wikimedia.org/wiki/File:Ruby-throated_hummingbird_(50038506407).jpg", sourceFile: "Ruby-throated hummingbird (50038506407).jpg", confirmTopProbability: 0.999982, confirmPhotographer: "U.S. Fish and Wildlife Service - Midwest Region", confirmLicense: "Public domain", confirmSourceUrl: "https://commons.wikimedia.org/wiki/File:Ruby-throated_hummingbird_(50036621428).jpg", confirmSourceFile: "Ruby-throated hummingbird (50036621428).jpg" }
]

export const FEATURED_BIRD_ID = 'american-robin'
