#!/usr/bin/env python3
"""Generate the complete drama-to-playable intro with the local AI infra client."""

import argparse
import json
import os
from pathlib import Path
import shutil
import sys
import time
from types import SimpleNamespace
import uuid


DEFAULT_INFRA = Path('/Users/jinxi/Documents/NOVVY/novvy_code/Drama-Agent/in_house_ai_infra_testing')
ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--infra', type=Path, default=DEFAULT_INFRA)
    parser.add_argument('--resume', type=Path)
    parser.add_argument(
        '--reference-base-url',
        help='Temporary HTTPS base serving generation-input (skips configured GCS upload)',
    )
    args = parser.parse_args()

    sys.path.insert(0, str(args.infra.resolve()))
    import testing_client as client

    client.load_env(args.infra / '.env')
    base = os.getenv('AI_STUDIO_BASE_URL', client.BASE).rstrip('/')
    key = os.getenv('AI_STUDIO_API_KEY', '')
    if not key:
        raise ValueError('Missing AI_STUDIO_API_KEY in the configured infra environment')

    input_folder = ROOT / 'ad-assets/generation-input/ref2va_dragon_bottle'
    if args.resume:
        run_dir = args.resume.resolve()
    else:
        run_dir = args.infra / 'runs' / (time.strftime('%Y%m%d-%H%M%S') + '-dragon-bottle-' + uuid.uuid4().hex[:8])
        run_dir.mkdir(parents=True)
        request_args = SimpleNamespace(
            duration=8,
            mode='realtime',
            resolution='768P',
            ratio='9:16',
        )
        if args.reference_base_url:
            base_url = args.reference_base_url.rstrip('/')
            urls = {
                f'{input_folder.name}/{image.name}': f'{base_url}/{input_folder.name}/{image.name}'
                for image in sorted(input_folder.glob('image*.png'))
            }
        else:
            urls = client.upload_images([input_folder], run_dir)
        payload = client.case_spec(input_folder, urls, request_args)
        target = run_dir / input_folder.name
        client.save(
            target / 'state.json',
            {
                'base_url': base,
                'created_at': time.time(),
                'idempotency_key': str(uuid.uuid4()),
                'payload': payload,
            },
        )
        print(f'Prepared new 8-second 9:16 Ref2VA run: {run_dir}', flush=True)

    run_args = SimpleNamespace(wait_seconds=3600, download=True)
    state_paths = list(run_dir.glob('*/state.json'))
    if len(state_paths) != 1:
        raise ValueError('Expected exactly one saved generation state')
    client.run_case(state_paths[0].parent, base, key, run_args)

    source = state_paths[0].parent / 'video.mp4'
    destination = ROOT / 'ad-assets/generated/minimax-drama-to-playable.mp4'
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)
    metadata = {
        'run_directory': str(run_dir),
        'source_video': str(source),
        'final_video': str(destination),
    }
    (destination.parent / 'generation.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(f'Copied generated video to {destination}', flush=True)


if __name__ == '__main__':
    main()
