import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('nastac_importer', ROOT / 'scripts' / 'import-nastac-cshapes-europe.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

_, tile_features = module.decode_features(ROOT / '.nastac-tile-0.pbf')
modern = []
for feature in tile_features:
    props = feature['properties']
    name = props.get('Name') or ''
    from_year = int(props.get('From') or 1816)
    to_year = int(props.get('To') or 2026)
    if name in module.NAME_TO_ID and from_year <= 2020 <= to_year:
        modern.append(feature)

# Armenia is present in the official CShapes 2.0 GeoJSON through 2019, while
# the NASTAC Europe tile does not carry an Armenia feature. Reuse that official
# polygon as the 2020--2026 modern reference geometry.
official = json.loads((ROOT / '.cshapes-import' / 'CShapes-2.0.geojson').read_text(encoding='utf-8'))
for feature in official['features']:
    props = feature.get('properties') or {}
    if props.get('cntry_name') != 'Armenia':
        continue
    modern.append({
        'type': 'Feature',
        'geometry': feature.get('geometry'),
        'properties': {
            'Name': 'Armenia',
            'From': 1991,
            'To': 2026,
            'id': props.get('gwcode'),
            'Status': 'independent',
            'Capital': 'Yerevan',
            'source': 'CShapes 2.0 official GeoJSON geometry extended as 2020--2026 reference',
        },
    })

out = ROOT / 'data' / 'euro-modern-2020-2026.geojson'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({'type': 'FeatureCollection', 'features': modern}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'wrote {len(modern)} modern GeoJSON features to {out}')
