import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('nastac_importer', ROOT / 'scripts' / 'import-nastac-cshapes-europe.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
payload = json.loads((ROOT / 'data' / 'euro-modern-2020-2026.geojson').read_text(encoding='utf-8'))
features = module.modern_features(payload['features'])
out = ROOT / 'euro-cshapes-modern-2020-2026.js'
out.write_text(
    'window.EURO_CSHAPES_MODERN_FEATURES=' + json.dumps(features, ensure_ascii=True, separators=(',', ':')) + ';\n',
    encoding='utf-8',
)
print(f'imported {len(features)} modern GeoJSON features to {out}')
