import type { ProjectRecord } from './types'

export const birdSpeciesCnn: ProjectRecord = {
  slug: 'bird-species-cnn',
  status: 'live',
  title: 'Teaching a network to tell 315 birds apart',
  tagline:
    'From a network that has never seen an edge to a fine-tuned VGG16 backbone at 97.651% '
    + 'top-1 accuracy, on a single 8 GB GPU.',
  summary:
    'A photo classification capstone: 315 bird species, a convolutional network built from '
    + 'scratch, then transfer learning from ImageNet backbones. The dense-only baseline '
    + 'landed exactly at chance across 315 classes. The final model, VGG16 fine-tuned from '
    + 'its fourth convolutional block, reached 97.651% top-1 on the held-out test set.',
  year: '2021',
  demonstration:
    'Eight real checkpoints grow left to right below, from a network that has never seen '
    + 'an edge to a VGG16 backbone fine-tuned four blocks deep. The distance between the '
    + 'first bar and the last is the entire argument for convolution.',
  glyph: 'kernel',
  stack: [
    'Python',
    'TensorFlow / Keras',
    'VGG16 transfer learning',
    'EfficientNetB0',
    'Keras Tuner (RandomSearch, Hyperband, Bayesian)',
  ],
  dataset: {
    name: 'Kaggle 100+ bird species photo set, extended to 315 species',
    scale: '45,980 train / 1,575 test / 1,575 validation images, 224×224×3, across 315 species',
    provenance:
      'Public Kaggle bird-species photo dataset (gpiosenka/100-bird-species). Every figure '
      + 'and example on this page comes from a notebook’s own printed cell output or a '
      + 'forward pass through the same public dataset.',
    // TODO(pizon): the original Kaggle listing (gpiosenka/100-bird-species) has been removed
    // and 404s. The page ships a text-only citation for it, with no link. Add a reachable
    // URL to `links` if you find one you are willing to stand behind.
  },
  headlineFigures: [
    {
      label: 'Top-1 accuracy, VGG16 fine-tuned',
      value: '97.651%',
      source: 'Capstone 3 notebook 02 (Preprocessing_Modeling.ipynb), cell 75',
    },
    {
      label: 'Species classified',
      value: '315',
      source: 'Capstone 3 notebook 01, cells 17, 29-31',
    },
    {
      label: 'Training images',
      value: '45,980',
      source: 'Capstone 3 notebook 01, cell 17',
    },
  ],
  sections: [
    {
      id: 'pixels',
      heading: 'An image is a matrix of numbers',
      hasVisual: true,
      body: [
        'Every one of the 45,980 training images starts as a 224×224×3 grid of integers, '
          + 'one value per pixel per colour channel, drawn from 315 species with 5 held-out '
          + 'test and 5 held-out validation images each. House Finch has the most training '
          + 'photos at 249, Black Swan the fewest at 119, and the mean across all 315 '
          + 'species is 145.97. None of that is mystical. It is a matrix, and everything '
          + 'downstream is arithmetic on that matrix.',
        'The convolutional network built from scratch for this project trains on a 56×56 '
          + 'downscale of that same matrix, not the full 224×224. A single 8 GB GPU sets '
          + 'that ceiling: three convolutional blocks at full resolution would not fit in '
          + 'memory alongside a training batch and its gradients.',
      ],
    },
    {
      id: 'convolution',
      heading: 'A filter is nine numbers, and edges fall out of it',
      hasVisual: true,
      body: [
        'A 3×3 convolution kernel is nine numbers. Slide it over the image, multiply and '
          + 'sum at every position, and the output is a new grid the same shape as the '
          + 'input, minus the border the kernel cannot centre on. A kernel that is 1 at one '
          + 'edge and -1 at the opposite edge responds strongly wherever the image changes '
          + 'fast in that direction, and produces almost nothing where it does not. That is '
          + 'an edge detector, and none of it was learned: it is nine fixed numbers doing '
          + 'arithmetic.',
        'A trained convolutional network starts from kernels like that and learns better '
          + 'ones. The sweep below runs a real kernel over a real 28×28 patch of image '
          + 'data, and every number in its readout is the arithmetic actually happening, '
          + 'not an illustration of it.',
      ],
    },
    {
      id: 'depth',
      heading: 'Space shrinks, meaning accumulates',
      hasVisual: true,
      body: [
        'The custom network built for this project has three convolutional blocks, 32 '
          + 'filters then 64 then 128, each followed by a max-pool that halves the spatial '
          + 'size. By the third block the image has gone from 56×56 down to 4×4, and from '
          + '3 colour channels to 128 learned ones. Space keeps shrinking; what the network '
          + 'can say about what is left keeps growing. That architecture runs to 9,131,387 '
          + 'parameters end to end.',
        'VGG16 runs the same idea much deeper: five blocks of 3×3 convolutions, 224×224 '
          + 'down to 7×7, 3 channels up to 512, 134,260,544 parameters in the backbone '
          + 'alone. It was trained once, on more than a million ImageNet photos, long '
          + 'before this project ever saw a bird.',
      ],
    },
    {
      id: 'decision',
      heading: '4,096 numbers become one bird',
      hasVisual: true,
      body: [
        'Whatever the backbone, the pattern at the top is the same: flatten the last '
          + 'feature map into one long vector, run it through one or two dense layers, '
          + 'then a softmax layer that turns raw scores into 315 probabilities that sum to '
          + 'one. In VGG16 that vector is 25,088 numbers wide, compressed to 4,096, then '
          + '4,096 again, before the final 315-way layer picks a winner. It is matrix '
          + 'multiplication all the way down; the softmax is what forces the network to '
          + 'commit to exactly one bird.',
      ],
    },
    {
      id: 'transfer',
      heading: 'What was frozen, what was retrained, what that bought',
      hasVisual: true,
      body: [
        'Blocks 1 through 3 of the VGG16 backbone stayed exactly as ImageNet trained them: '
          + 'frozen, no gradient ever touches those weights again. Blocks 4 and 5 were '
          + 'unfrozen and fine-tuned on bird photos, starting from block4_conv1. The '
          + '1,000-way ImageNet head was removed and replaced with a 315-way one built for '
          + 'this dataset.',
        'Freezing the early blocks and fine-tuning the later ones is the reason the '
          + 'accuracy curve looks the way it does. A frozen backbone with only a new head '
          + 'bolted on already reached 94.984%. Unfreezing and fine-tuning the last two '
          + 'blocks bought the final climb to 97.651%, because the earliest layers already '
          + 'recognise edges and textures. What needed to change for a bird was later, '
          + 'closer to the decision, not at the pixel level.',
      ],
    },
    {
      id: 'next-time',
      heading: 'What I’d do differently',
      body: [
        'The 8 GB GPU that trained the custom CNN forced choices a better machine would '
          + 'not have: images downsampled to 56×56 instead of the full 224×224, one of the '
          + 'reasons the from-scratch network topped out at 73.206% while a pretrained '
          + 'backbone reached the mid-90s. Given the choice again, I would train it at full '
          + 'resolution and see how much of that gap survives.',
        'One experiment along the way tried the same architecture on grayscale images, on '
          + 'the theory that colour was noise for a shape-based task. It was not: the '
          + 'grayscale run peaked near 30% during training and settled at 21.778% on '
          + 'validation, a loss of roughly 39 points against the equivalent colour run. '
          + 'Whatever colour was carrying, birds need it.',
        'Tuning the custom CNN’s dense layers with three different search strategies '
          + 'produced three different answers: RandomSearch 0.730, Hyperband 0.690, a '
          + 'Bayesian search 0.712. None of it closed the gap to transfer learning. The '
          + 'lesson was not which tuner to prefer; it was that no amount of head-tuning '
          + 'substitutes for a backbone that has already seen a million photos.',
      ],
    },
  ],
  links: [
    {
      label: 'Capstone repository',
      href: 'https://github.com/pizonkhan/Springboard-Data-Science/tree/master/Capstone%203',
      kind: 'repo',
    },
    {
      label: 'Written report (PDF)',
      href: 'https://github.com/pizonkhan/Springboard-Data-Science/blob/master/Capstone%203/Classification_of_Birds_Report.pdf',
      kind: 'report',
    },
    // TODO(pizon): the Kaggle dataset link (gpiosenka/100-bird-species) 404s, the listing
    // was removed. Restore this entry once a reachable citation is chosen.
  ],
  dataStatement:
    'Public Kaggle 100+ bird species photo set, 315 species. Model figures are printed '
    + 'notebook outputs; example activations come from a stock ImageNet VGG16 forward pass.',
}
