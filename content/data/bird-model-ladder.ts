/**
 * Hand-transcribed from the capstone notebooks' printed cell outputs, not generated:
 * "Capstone 3/Notebooks/01_*.ipynb" and "02_Preprocessing_Modeling.ipynb"
 * (https://github.com/pizonkhan/Springboard-Data-Science). Every accuracy figure below
 * matches a notebook's own evaluation cell's printed digits, `model.evaluate(...)` output,
 * not a training-log val_accuracy.
 *
 * The dense-only MLP is exact chance across 315 classes (1 / 315 = 0.31746...%, printed as
 * 0.317%).
 *
 * Two things worth knowing before "correcting" a figure here:
 *
 * Notebook 02's evaluation cells (26, 33, 60, 75) print the label "Valid Accuracy", but the
 * call above that print is `model.evaluate(test_generator, ...)`. The printed label is wrong;
 * the figures themselves are test-set figures. Do not renumber these rows or relabel them
 * "validation" on the strength of the printed string.
 *
 * Notebook 01's runs fit with `validation_data=(X_test, y_test)` and then evaluate on that
 * same held-out split, so its "Test Accuracy" figures come from the split that was also used
 * for early stopping. That caveat belongs here, in the data module; it does not belong on the
 * page itself.
 */

export interface BirdModelResult {
  name: string
  /** Top-1 accuracy as a fraction (0..1). */
  accuracy: number
  /** Notebook and cell this figure is printed in. */
  source: string
  note?: string
}

export const BIRD_MODEL_LADDER: readonly BirdModelResult[] = [
  {
    name: 'Dense-only MLP, no convolution',
    accuracy: 0.00317,
    source: 'nb01 cell 90',
    note: 'Exactly chance across 315 classes.',
  },
  {
    name: 'Grayscale CNN, 100 epochs',
    accuracy: 0.21778,
    source: 'nb01 cell 102',
    note: 'Peaked at 31.4% during training, then 21.778% at evaluation.',
  },
  {
    name: 'Baseline CNN, 2 conv blocks, 10 epochs',
    accuracy: 0.60762,
    source: 'nb01 cell 95',
  },
  {
    name: 'Tuned custom CNN, 3 conv blocks, 9,131,387 params',
    accuracy: 0.73206,
    source: 'nb01 cell 133',
  },
  {
    name: 'EfficientNetB0, frozen backbone',
    accuracy: 0.49778,
    source: 'nb02 cell 26',
  },
  {
    name: 'EfficientNetB0, low-LR fine-tuning pass',
    accuracy: 0.70095,
    source: 'nb02 cell 33',
  },
  {
    name: 'VGG16, frozen backbone + new 315-way head',
    accuracy: 0.94984,
    source: 'nb02 cell 60',
  },
  {
    name: 'VGG16, fine-tuned from block4_conv1',
    accuracy: 0.97651,
    source: 'nb02 cell 75',
    note: 'The final model. The written report rounds this to 97.5%.',
  },
]
