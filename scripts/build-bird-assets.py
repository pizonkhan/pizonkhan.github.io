#!/usr/bin/env python3
"""
Generates the committed assets the bird capstone page's visualisations run on.

Two pipelines live in this file, and they share one VGG16 model instance but write disjoint
output:

1. The featured American robin's single-photo path: a 448x448 source photo, its 28x28
   luminance matrix, five per-block VGG16 activation sprite sheets, and the real top-8
   softmax from a stock ImageNet VGG16 forward pass. Unchanged in shape from the first
   version of this script.
2. The eight-species gallery: for every bird in SPECIES, a 96x96 thumbnail, a 320x320
   photograph and its real top-16 softmax, plus a generated content/data/bird-gallery.ts
   carrying attribution read live from the Wikimedia Commons API. No activation sprites and
   no luminance matrix are written for gallery species; that stays the robin's alone, per the
   plan's assumption 10.

Run manually, once, by Pizon. Never wired into `npm run build` or any CI workflow, exactly
like scripts/build-nyc-price-surface.mjs. Requires Python 3 with tensorflow, Pillow and
numpy, and downloads two kinds of things on first use: nine source photographs (a few MB
each, from Wikimedia Commons) and the ImageNet-pretrained VGG16 weights (~528 MB, cached by
Keras at ~/.keras/models/ after the first run).

Why stock ImageNet weights and not Pizon's own checkpoint: his fine-tuned weights are not in
the public capstone repo (Capstone 3/Notebooks/saved_model.pb is an EfficientNetB0 graph with
no variables/ directory, the weights were stripped before it was committed). Stock VGG16
blocks 1-3 are literally the frozen layers of his model, so the activations this script
produces are the real early layers of the real architecture his page describes.

This machine's system Python has no working tensorflow wheel. Run this against an isolated
environment on an older interpreter instead of fighting the system one, for example:

    uv venv --python 3.11 .venv-bird-assets
    source .venv-bird-assets/bin/activate
    uv pip install tensorflow pillow numpy
    python3 scripts/build-bird-assets.py
    deactivate && rm -rf .venv-bird-assets

Attribution for every species, including the robin, is read from the Commons API at run
time (action=query, prop=imageinfo, iiprop=url|extmetadata) rather than typed in by hand: the
script strips HTML out of the Artist, Credit and LicenseShortName fields and refuses to write
anything for a file whose LicenseShortName does not read "public domain" or "CC0". Requests
to Commons are throttled to one every three seconds with a descriptive User-Agent, because the
API answers a faster script with a plain-text "too many requests" body instead of JSON.

Each species also has to pass the network's own judgement before it ships: after the forward
pass, rank 1 of the top-16 softmax must be that species' expected ImageNet label at 20% or
higher, or the script raises rather than writing a crop nobody would call correct. Fix a
failing species by supplying a crop_box in SPECIES and rerunning, or by substituting one of
the two approved species named at the bottom of that table. Never relabel a species to match
whatever the model returned.
"""

from __future__ import annotations

import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html import unescape
from pathlib import Path

import numpy as np
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "public" / "projects" / "bird-species-cnn"
ACTIVATIONS_DIR = OUT_DIR / "activations"
GALLERY_DIR = OUT_DIR / "gallery"
GALLERY_MODULE_PATH = REPO_ROOT / "content" / "data" / "bird-gallery.ts"

USER_AGENT = "pizonkhan.github.io asset build (contact via github.com/pizonkhan)"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
# Wikimedia answers a script that goes faster than this with a plain-text "too many
# requests" body instead of JSON, so every network call in this file, image download or
# API query alike, is spaced at least this far from the last one.
MIN_REQUEST_INTERVAL_SECONDS = 3.0
# Raw Commons responses land here on first fetch and are reused on every rerun in the same
# working copy, the same pattern scripts/build-nyc-sales-2025.mjs uses for its CSV: a source
# photograph does not change between two runs made minutes apart, and re-requesting nine
# already-downloaded files is exactly the kind of traffic Wikimedia's rate limiter exists to
# stop. Never committed: `.gitignore` already excludes `/.data`. Delete it once every asset
# below is committed.
CACHE_DIR = REPO_ROOT / ".data" / "bird-assets-cache"
# Requested through the Commons API's own iiurlwidth, not the full-resolution original.
# Wikimedia's rate limiter treats repeated multi-megabyte original-file requests far more
# strictly than its thumbnail pipeline (confirmed this run: an original download that kept
# 429ing succeeded immediately as a thumbnail request), and 1600px is already more resolution
# than either committed output needs: the source crop is 448px, the gallery photo is 320px.
DOWNLOAD_WIDTH = 1600

SOURCE_SIZE = 448
LUMINANCE_SIZE = 28
CHANNELS_PER_BLOCK = 6
SPRITE_TILE = 96
GALLERY_PHOTO_SIZE = 320
GALLERY_THUMB_SIZE = 96
# A crop that does not clear this on its expected label is not shipped.
MIN_TOP1_PROBABILITY = 0.20

# Unchanged from the first version of this script: activations.json's own sourceImage credit
# is not re-derived from the live Commons query, so this run's output stays byte-identical to
# what is already committed. content/data/bird-gallery.ts is the one place attribution now
# comes from the API instead of a hand-typed constant like this.
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


@dataclass(frozen=True)
class Species:
    id: str
    common: str
    scientific: str
    # The ImageNet-1k class the forward pass is expected to return as rank 1, spaces not
    # underscores, matching decode_predictions' label after the same replace this script
    # already does for the robin.
    expected_label: str
    commons_file: str
    # left, top, right, bottom in the source photo's own pixel coordinates. None means the
    # default rule applies: the largest centred square, deterministic, no eye required.
    crop_box: tuple[int, int, int, int] | None = None


# The eight-species gallery. Every licence was confirmed Public domain against the live
# Commons API during planning, and this script confirms it again at run time. The robin's
# crop_box is the one this file has shipped with since the first version; every other species
# uses the default centred-square crop, which a probe run against the real photographs (all
# seven) verified clears MIN_TOP1_PROBABILITY by a wide margin, so no override was needed for
# any of them.
#
# Two approved substitutes exist if a species above ever stops verifying: American flamingo
# ("Flamingo walking (38733359000).jpg", USFWS Pacific Southwest, ImageNet label "flamingo")
# and wood duck ("Wood duck (53068651259).jpg", USFWS Midwest, ImageNet label "drake"). Record
# a substitution in this table, and only here; content/data/bird-gallery.ts is generated from
# whatever is written below, not the reverse.
SPECIES: list[Species] = [
    Species(
        id="american-robin",
        common="American robin",
        scientific="Turdus migratorius",
        expected_label="robin",
        commons_file="American robin (49781211678).jpg",
        crop_box=(805, 105, 2205, 1505),
    ),
    Species(
        id="bald-eagle",
        common="Bald eagle",
        scientific="Haliaeetus leucocephalus",
        expected_label="bald eagle",
        commons_file="Haliaeetus leucocephalus-tree-USFWS.jpg",
    ),
    Species(
        id="american-goldfinch",
        common="American goldfinch",
        scientific="Spinus tristis",
        expected_label="goldfinch",
        commons_file="American goldfinch (49882388693).jpg",
    ),
    Species(
        id="great-gray-owl",
        common="Great gray owl",
        scientific="Strix nebulosa",
        expected_label="great grey owl",
        commons_file="Great gray owl (53298384180).jpg",
    ),
    Species(
        id="american-white-pelican",
        common="American white pelican",
        scientific="Pelecanus erythrorhynchos",
        expected_label="pelican",
        commons_file="American White Pelican Bear River MBR (51847214774).jpg",
    ),
    Species(
        id="laysan-albatross",
        common="Laysan albatross",
        scientific="Phoebastria immutabilis",
        expected_label="albatross",
        commons_file="Laysan albatross, Credit USFWS Chris Swenson (5182342300).jpg",
    ),
    Species(
        id="great-egret",
        common="Great egret",
        scientific="Ardea alba",
        expected_label="American egret",
        commons_file="USFWS great egret (23853294125).jpg",
    ),
    Species(
        id="ruby-throated-hummingbird",
        common="Ruby-throated hummingbird",
        scientific="Archilochus colubris",
        expected_label="hummingbird",
        commons_file="Ruby-throated hummingbird (50038506407).jpg",
    ),
]

FEATURED_SPECIES_ID = "american-robin"

_TAG_RE = re.compile(r"<[^>]+>")
_last_request_time = 0.0


def _throttle() -> None:
    """Blocks until at least MIN_REQUEST_INTERVAL_SECONDS has passed since the last network
    call this process made, Commons API query or image download alike."""
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    if elapsed < MIN_REQUEST_INTERVAL_SECONDS:
        time.sleep(MIN_REQUEST_INTERVAL_SECONDS - elapsed)
    _last_request_time = time.monotonic()


def fetch_url(url: str, cache_key: str | None = None, retries: int = 10) -> bytes:
    """GETs `url` with a descriptive User-Agent, throttled and retried on Wikimedia's 429.
    When `cache_key` is given, a hit under CACHE_DIR is served with no network call at all."""
    if cache_key is not None:
        cache_path = CACHE_DIR / cache_key
        if cache_path.exists():
            return cache_path.read_bytes()

    for attempt in range(retries):
        _throttle()
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
            if cache_key is not None:
                CACHE_DIR.mkdir(parents=True, exist_ok=True)
                (CACHE_DIR / cache_key).write_bytes(raw)
            return raw
        except urllib.error.HTTPError as error:
            if error.code == 429 and attempt < retries - 1:
                wait = min(MIN_REQUEST_INTERVAL_SECONDS * (2 ** (attempt + 1)), 90.0)
                print(f"  429 from Wikimedia, waiting {wait:.0f}s and retrying")
                time.sleep(wait)
                continue
            raise
    raise RuntimeError(f"Gave up fetching {url} after {retries} attempts")


def strip_html(value: str) -> str:
    """Removes HTML tags and decodes entities from a Commons extmetadata string."""
    return unescape(_TAG_RE.sub("", value)).strip()


def resolve_commons_image(commons_file: str, cache_key: str) -> dict[str, str]:
    """Queries the Commons API for one file's direct image URL and licensing metadata. Raises
    rather than returning anything if the file is missing or its licence does not read
    public domain or CC0."""
    title = f"File:{commons_file}"
    query = urllib.parse.urlencode(
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata",
            "iiurlwidth": DOWNLOAD_WIDTH,
            "format": "json",
        }
    )
    raw = fetch_url(f"{COMMONS_API}?{query}", cache_key=f"{cache_key}.meta.json")
    data = json.loads(raw)
    page = next(iter(data["query"]["pages"].values()))
    if "missing" in page:
        raise RuntimeError(f"Commons file not found: {commons_file}")

    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})

    def meta_text(key: str) -> str:
        return strip_html(meta.get(key, {}).get("value", ""))

    license_short = meta_text("LicenseShortName")
    if not re.search(r"public domain|cc0", license_short, re.IGNORECASE):
        raise RuntimeError(
            f"{commons_file}: LicenseShortName reads '{license_short}', not public domain or "
            "CC0. Refusing to write attribution for a file whose licence was not confirmed."
        )

    return {
        # The full-resolution original. Only the featured robin's single-photo path downloads
        # this: it is what CROP_BOX was measured against, and it is what criterion 58's
        # byte-identical regeneration depends on.
        "original_url": info["url"],
        # A Commons-generated rendition at DOWNLOAD_WIDTH, falling back to the original on the
        # rare file the API declines to resize. Every gallery species downloads this instead:
        # Wikimedia's rate limiter treats repeated multi-megabyte original-file requests far
        # more strictly than its thumbnail pipeline (confirmed this run: an original download
        # that kept 429ing succeeded immediately as a thumbnail request), and DOWNLOAD_WIDTH is
        # already more resolution than a 320px gallery photo needs.
        "thumb_url": info.get("thumburl") or info["url"],
        "source_url": info["descriptionurl"],
        "artist": meta_text("Artist"),
        "license": license_short,
    }


def fetch_image(url: str, label: str, cache_key: str) -> Image.Image:
    """Downloads one photo through the shared rate limiter and returns it as full-resolution
    RGB."""
    print(f"Downloading {label} from {url}")
    raw = fetch_url(url, cache_key=f"{cache_key}.img")
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    print(f"  {len(raw) / 1024:.0f} KB, {image.size[0]}x{image.size[1]}")
    return image


def default_crop_box(size: tuple[int, int]) -> tuple[int, int, int, int]:
    """The largest centred square of an image of `size`. Deterministic, needs no eye."""
    width, height = size
    edge = min(width, height)
    left = (width - edge) // 2
    top = (height - edge) // 2
    return (left, top, left + edge, top + edge)


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


def build_source_and_luminance(source_photo: Image.Image, crop_box: tuple[int, int, int, int]) -> Image.Image:
    """Crops, squares and downsizes the featured robin's source photo; writes
    bird-source.webp and luminance-28.json."""
    cropped = source_photo.crop(crop_box).resize((SOURCE_SIZE, SOURCE_SIZE), Image.LANCZOS)

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


def build_activations(model, probe_model, cropped_source: Image.Image) -> None:
    """Runs the real VGG16(weights='imagenet') forward pass over the featured robin's crop
    and writes the five sprite sheets and activations.json."""
    from tensorflow import keras
    from tensorflow.keras.applications.vgg16 import preprocess_input

    resized = cropped_source.resize((224, 224), Image.LANCZOS)
    array = keras.utils.img_to_array(resized)
    batch = preprocess_input(np.expand_dims(array, axis=0))

    *block_activations, _ = probe_model.predict(batch, verbose=0)

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


def build_gallery_species(species: Species, model, prefetched: tuple[Image.Image, dict] | None = None) -> dict:
    """Downloads, crops, classifies and writes one gallery species' three assets. Raises if
    the crop does not verify against the model's own judgement. Returns the attribution
    record content/data/bird-gallery.ts is generated from.

    `prefetched`, when given, is the photo and attribution the featured species' single-photo
    path already fetched: reused here so the same Commons file is never requested twice in the
    same run, which is both wasteful and the surer way to trip Wikimedia's rate limiter."""
    from tensorflow import keras
    from tensorflow.keras.applications.vgg16 import preprocess_input, decode_predictions

    print(f"\n{species.common} ({species.scientific})")
    if prefetched is not None:
        photo, attribution = prefetched
        print(f"  Reusing the {species.common} photo already downloaded for the source figure.")
    else:
        attribution = resolve_commons_image(species.commons_file, cache_key=species.id)
        photo = fetch_image(attribution["thumb_url"], species.common, cache_key=species.id)

    crop_box = species.crop_box or default_crop_box(photo.size)
    square = photo.crop(crop_box)

    classify_input = square.resize((224, 224), Image.LANCZOS)
    array = keras.utils.img_to_array(classify_input)
    batch = preprocess_input(np.expand_dims(array, axis=0))
    softmax = model.predict(batch, verbose=0)

    top16 = decode_predictions(softmax, top=16)[0]
    payload = [
        {"label": label.replace("_", " "), "probability": round(float(probability), 6)}
        for (_class_id, label, probability) in top16
    ]

    if payload[0]["label"] != species.expected_label or payload[0]["probability"] < MIN_TOP1_PROBABILITY:
        raise RuntimeError(
            f"{species.id}: the crop did not verify. Rank 1 was '{payload[0]['label']}' at "
            f"{payload[0]['probability']:.4%}, expected '{species.expected_label}' at or "
            f"above {MIN_TOP1_PROBABILITY:.0%}. Top 3: {payload[:3]}. Supply a crop_box for "
            "this species in SPECIES and rerun, or substitute one of the two approved species."
        )

    species_dir = GALLERY_DIR / species.id
    species_dir.mkdir(parents=True, exist_ok=True)

    photo_320 = square.resize((GALLERY_PHOTO_SIZE, GALLERY_PHOTO_SIZE), Image.LANCZOS)
    save_webp_under_budget(photo_320, species_dir / "photo-320.webp", budget_bytes=30 * 1024)

    thumb_96 = square.resize((GALLERY_THUMB_SIZE, GALLERY_THUMB_SIZE), Image.LANCZOS)
    save_webp_under_budget(thumb_96, species_dir / "thumb-96.webp", budget_bytes=6 * 1024)

    softmax_path = species_dir / "softmax.json"
    softmax_path.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"  {softmax_path.relative_to(REPO_ROOT)}: {softmax_path.stat().st_size / 1024:.2f} KB")
    print(f"  Verified: rank 1 is '{payload[0]['label']}' at {payload[0]['probability']:.4%}")

    return {
        "id": species.id,
        "common": species.common,
        "scientific": species.scientific,
        "expectedLabel": species.expected_label,
        "topProbability": payload[0]["probability"],
        "photographer": attribution["artist"],
        "license": attribution["license"],
        "sourceUrl": attribution["source_url"],
        "sourceFile": species.commons_file,
    }


def _format_gallery_entry(record: dict) -> str:
    fields = ", ".join(
        f"{key}: {json.dumps(value)}" if isinstance(value, str) else f"{key}: {value}"
        for key, value in record.items()
    )
    return f"  {{ {fields} }}"


def write_gallery_module(records: list[dict]) -> None:
    """Writes content/data/bird-gallery.ts from the verified per-species records."""
    entries = ",\n".join(_format_gallery_entry(record) for record in records)
    module = f"""/**
 * GENERATED. Do not hand-edit.
 *
 * Produced by scripts/build-bird-assets.py against Wikimedia Commons. Every photographer,
 * licence and source URL below was read from the Commons API's imageinfo and extmetadata at
 * build time, not typed in by hand, and every expectedLabel/topProbability pair was verified
 * against a real VGG16(weights='imagenet') forward pass over that species' own cropped
 * photograph.
 */

export interface GalleryBird {{
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
}}

export const BIRD_GALLERY: readonly GalleryBird[] = [
{entries}
]

export const FEATURED_BIRD_ID = '{FEATURED_SPECIES_ID}'
"""
    GALLERY_MODULE_PATH.parent.mkdir(parents=True, exist_ok=True)
    GALLERY_MODULE_PATH.write_text(module)
    print(f"\n{GALLERY_MODULE_PATH.relative_to(REPO_ROOT)}: {len(records)} species")


def main() -> None:
    from tensorflow import keras
    from tensorflow.keras.applications.vgg16 import VGG16

    featured = next(species for species in SPECIES if species.id == FEATURED_SPECIES_ID)

    print("--- Featured photograph: the robin's single-photo path ---")
    robin_attribution = resolve_commons_image(featured.commons_file, cache_key=featured.id)
    # The single-photo path needs the true original, not a resized rendition: CROP_BOX was
    # measured against it, and criterion 58 requires this run's output to be byte-identical to
    # what is already committed.
    robin_photo = fetch_image(robin_attribution["original_url"], featured.common, cache_key=featured.id)
    cropped = build_source_and_luminance(robin_photo, featured.crop_box)

    print("\nLoading stock ImageNet VGG16 weights (downloads ~528 MB on first run)...")
    model = VGG16(weights="imagenet", include_top=True)
    outputs = [model.get_layer(name).output for name in BLOCK_LAYERS] + [model.output]
    probe_model = keras.Model(inputs=model.input, outputs=outputs)

    build_activations(model, probe_model, cropped)

    print("\n--- Eight-species gallery ---")
    records = [
        build_gallery_species(
            species,
            model,
            prefetched=(robin_photo, robin_attribution) if species.id == FEATURED_SPECIES_ID else None,
        )
        for species in SPECIES
    ]
    write_gallery_module(records)

    print("\nDone.")


if __name__ == "__main__":
    main()
