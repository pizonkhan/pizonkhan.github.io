#!/usr/bin/env python3
"""
Generates the committed assets the bird capstone page's visualisations run on: a source
photo, its 28x28 luminance matrix, five per-block VGG16 activation sprite sheets, and the
real top-8 softmax probabilities from a stock ImageNet VGG16 forward pass.

Run manually, once, by Pizon. Never wired into `npm run build` or any CI workflow, exactly
like scripts/build-nyc-price-surface.mjs. Requires Python 3 with tensorflow, Pillow and
numpy, and downloads two things on first use: the source photograph (a few MB, from
Wikimedia Commons) and the ImageNet-pretrained VGG16 weights (~528 MB, cached by Keras at
~/.keras/models/ after the first run).

Why stock ImageNet weights and not Pizon's own checkpoint: his fine-tuned weights are not in
the public capstone repo (Capstone 3/Notebooks/saved_model.pb is an EfficientNetB0 graph with
no variables/ directory, the weights were stripped before it was committed). Stock VGG16
blocks 1-3 are literally the frozen layers of his model, so the activations this script
produces are the real early layers of the real architecture his page describes.

This machine's system Python (3.14) has no tensorflow wheel available yet. Run this against
an isolated environment on an older interpreter instead of fighting the system one, for
example:

    uv venv --python 3.11 .venv-bird-assets
    source .venv-bird-assets/bin/activate
    uv pip install tensorflow pillow numpy
    python3 scripts/build-bird-assets.py
    deactivate && rm -rf .venv-bird-assets

Source photograph: "American robin (49781211678).jpg", Courtney Celley / U.S. Fish and
Wildlife Service, Midwest Region. Public domain (U.S. federal government work), from the
USFWS Midwest Region Flickr stream via Wikimedia Commons:
https://commons.wikimedia.org/wiki/File:American_robin_(49781211678).jpg
That attribution is written into the committed activations.json under "sourceImage" rather
than into content/projects/bird-species-cnn.ts, because that file's status flip and its
prose are Task 6's job, not this one's. Task 6 must surface this credit somewhere on the
rendered page before the bird route ships.
"""

from __future__ import annotations

import io
import json
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "public" / "projects" / "bird-species-cnn"
ACTIVATIONS_DIR = OUT_DIR / "activations"

SOURCE_IMAGE_URL = (
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/American_robin_%2849781211678%29.jpg"
)
# left, top, right, bottom in the original 2800x1869 photo. A 1400x1400 square centred on
# the bird, worm and all, with enough lawn around it to read as a real photograph rather
# than a crop.
CROP_BOX = (805, 105, 2205, 1505)
SOURCE_SIZE = 448
LUMINANCE_SIZE = 28
CHANNELS_PER_BLOCK = 6
SPRITE_TILE = 96

SOURCE_IMAGE_CREDIT = {
    "subject": "American robin (Turdus migratorius)",
    "photographer": "Courtney Celley / U.S. Fish and Wildlife Service, Midwest Region",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:American_robin_(49781211678).jpg",
    "license": "Public domain (U.S. federal government work)",
}

BLOCK_LAYERS = [
    "block1_conv1",
    "block2_conv1",
    "block3_conv1",
    "block4_conv1",
    "block5_conv1",
]

BLOCK_CAPTIONS = {
    "block1_conv1": "The earliest filters: edges and colour-contrast boundaries, still at "
    "full photo resolution.",
    "block2_conv1": "Edges start combining into short strokes and simple textures.",
    "block3_conv1": "Textures and local shapes: feathers, fur, foliage read as patterns here.",
    "block4_conv1": "Parts of objects: the layer this project's fine-tuning starts from.",
    "block5_conv1": "Whole-object structure, at the coarsest spatial resolution before the "
    "classifier head.",
}


def fetch_source_image() -> Image.Image:
    """Downloads the public-domain source photo and returns it as a full-resolution RGB image."""
    print(f"Downloading source photo from {SOURCE_IMAGE_URL}")
    request = urllib.request.Request(SOURCE_IMAGE_URL, headers={"User-Agent": "pizonkhan.github.io asset build (contact via github.com/pizonkhan)"})
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
    image = Image.open(io.BytesIO(raw))
    image = image.convert("RGB")
    print(f"Downloaded {len(raw) / 1024:.0f} KB, {image.size[0]}x{image.size[1]}")
    return image


def save_webp_under_budget(image: Image.Image, path: Path, budget_bytes: int, start_quality: int = 82) -> None:
    """Saves `image` as WebP at the highest quality that clears the byte budget."""
    quality = start_quality
    while quality > 30:
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=quality, method=6)
        size = buffer.tell()
        if size <= budget_bytes:
            path.write_bytes(buffer.getvalue())
            print(f"  {path.relative_to(REPO_ROOT)}: {size / 1024:.1f} KB (quality {quality})")
            return
        quality -= 6
    # Ran out of quality headroom; write the last attempt anyway so the failure is visible
    # in the printed size rather than silently producing nothing.
    path.write_bytes(buffer.getvalue())
    print(f"  WARNING: {path.relative_to(REPO_ROOT)} is {size / 1024:.1f} KB, over the {budget_bytes / 1024:.0f} KB budget")


def build_source_and_luminance(source_photo: Image.Image) -> Image.Image:
    """Crops, squares and downsizes the source photo; writes bird-source.webp and luminance-28.json."""
    cropped = source_photo.crop(CROP_BOX).resize((SOURCE_SIZE, SOURCE_SIZE), Image.LANCZOS)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    save_webp_under_budget(cropped, OUT_DIR / "bird-source.webp", budget_bytes=60 * 1024)

    # Box-downsampled greyscale: PIL's default resample for a shrink IS a box filter when the
    # target is much smaller than the source, but Image.BOX makes the averaging explicit and
    # deterministic rather than relying on a resample-mode default.
    greyscale = cropped.convert("L")
    luminance = greyscale.resize((LUMINANCE_SIZE, LUMINANCE_SIZE), Image.BOX)
    values = np.asarray(luminance, dtype=np.uint8).reshape(-1).tolist()  # row-major, len 784

    luminance_path = OUT_DIR / "luminance-28.json"
    luminance_path.write_text(json.dumps(values, separators=(",", ":")))
    size_kb = luminance_path.stat().st_size / 1024
    print(f"  {luminance_path.relative_to(REPO_ROOT)}: {size_kb:.1f} KB ({len(values)} row-major values, 0-255)")

    return cropped


def normalize_channel_to_image(channel: np.ndarray) -> Image.Image:
    """Min-max normalises one HxW activation channel to an 8-bit greyscale image."""
    lo, hi = float(channel.min()), float(channel.max())
    if hi - lo < 1e-6:
        scaled = np.zeros_like(channel, dtype=np.uint8)
    else:
        scaled = ((channel - lo) / (hi - lo) * 255.0).astype(np.uint8)
    return Image.fromarray(scaled, mode="L")


def select_channels(activation: np.ndarray, count: int) -> list[int]:
    """Picks the `count` channels with the highest spatial variance: the ones with visible
    structure rather than a flat, uninformative map. Deterministic given fixed weights and
    a fixed input image."""
    # activation: (H, W, C)
    variance_per_channel = activation.reshape(-1, activation.shape[-1]).var(axis=0)
    ranked = np.argsort(-variance_per_channel)
    return sorted(int(i) for i in ranked[:count])


def build_activations_and_softmax(cropped_source: Image.Image) -> None:
    """Runs the real VGG16(weights='imagenet') forward pass and writes the five sprite sheets,
    activations.json and softmax-top8.json."""
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input, decode_predictions

    print("Loading stock ImageNet VGG16 weights (downloads ~528 MB on first run)...")
    model = VGG16(weights="imagenet", include_top=True)

    resized = cropped_source.resize((224, 224), Image.LANCZOS)
    array = keras.utils.img_to_array(resized)
    batch = preprocess_input(np.expand_dims(array, axis=0))

    outputs = [model.get_layer(name).output for name in BLOCK_LAYERS] + [model.output]
    probe_model = keras.Model(inputs=model.input, outputs=outputs)
    *block_activations, softmax = probe_model.predict(batch, verbose=0)

    # --- Activation sprite sheets + activations.json -----------------------------------
    ACTIVATIONS_DIR.mkdir(parents=True, exist_ok=True)
    block_records = []
    for layer_name, activation in zip(BLOCK_LAYERS, block_activations):
        block_number = int(layer_name[5])  # "block3_conv1" -> 3
        feature_map = activation[0]  # (H, W, C)
        height, width, channel_count = feature_map.shape
        channel_indices = select_channels(feature_map, CHANNELS_PER_BLOCK)

        tiles = []
        for channel_index in channel_indices:
            tile = normalize_channel_to_image(feature_map[:, :, channel_index])
            tile = tile.resize((SPRITE_TILE, SPRITE_TILE), Image.LANCZOS)
            tiles.append(tile)

        sheet = Image.new("L", (SPRITE_TILE * CHANNELS_PER_BLOCK, SPRITE_TILE))
        for i, tile in enumerate(tiles):
            sheet.paste(tile, (i * SPRITE_TILE, 0))

        sprite_path = ACTIVATIONS_DIR / f"block{block_number}.webp"
        save_webp_under_budget(sheet.convert("RGB"), sprite_path, budget_bytes=25 * 1024)

        block_records.append({
            "block": block_number,
            "layer": layer_name,
            "outputShape": [int(height), int(width), int(channel_count)],
            "channels": channel_indices,
            "caption": BLOCK_CAPTIONS[layer_name],
        })

    activations_payload = {
        "sourceImage": SOURCE_IMAGE_CREDIT,
        "blocks": block_records,
    }
    activations_path = OUT_DIR / "activations.json"
    activations_path.write_text(json.dumps(activations_payload, separators=(",", ":")))
    print(f"  {activations_path.relative_to(REPO_ROOT)}: {activations_path.stat().st_size / 1024:.2f} KB")

    # --- softmax-top8.json ----------------------------------------------------------------
    top8 = decode_predictions(softmax, top=8)[0]  # [(class_id, label, probability), ...]
    top8_payload = [
        {"label": label.replace("_", " "), "probability": round(float(probability), 6)}
        for (_class_id, label, probability) in top8
    ]
    softmax_path = OUT_DIR / "softmax-top8.json"
    softmax_path.write_text(json.dumps(top8_payload, separators=(",", ":")))
    print(f"  {softmax_path.relative_to(REPO_ROOT)}: {softmax_path.stat().st_size / 1024:.2f} KB")
    print("Top-8 softmax predictions:")
    for entry in top8_payload:
        print(f"    {entry['probability']:.4%}  {entry['label']}")


def main() -> None:
    source_photo = fetch_source_image()
    cropped = build_source_and_luminance(source_photo)
    build_activations_and_softmax(cropped)
    print("Done.")


if __name__ == "__main__":
    main()
