import json
import math
from pathlib import Path


def varint(data, pos):
    value = 0
    shift = 0
    while True:
        byte = data[pos]
        pos += 1
        value |= (byte & 0x7F) << shift
        if byte < 128:
            return value, pos
        shift += 7


def fields(data):
    pos = 0
    while pos < len(data):
        tag, pos = varint(data, pos)
        field, wire = tag >> 3, tag & 7
        if wire == 0:
            value, pos = varint(data, pos)
        elif wire == 1:
            value, pos = data[pos:pos + 8], pos + 8
        elif wire == 2:
            length, pos = varint(data, pos)
            value, pos = data[pos:pos + length], pos + length
        elif wire == 5:
            value, pos = data[pos:pos + 4], pos + 4
        else:
            raise ValueError((field, wire, pos))
        yield field, wire, value


def unpack_varints(data):
    pos = 0
    while pos < len(data):
        value, pos = varint(data, pos)
        yield value


def zigzag(value):
    return (value >> 1) ^ -(value & 1)


def value_message(data):
    result = None
    for field, _wire, value in fields(data):
        if field == 1:
            result = value.decode('utf-8', errors='replace')
        elif field == 4:
            result = value
        elif field == 5:
            result = value
        elif field == 6:
            result = zigzag(value)
        elif field == 7:
            result = bool(value)
    return result


def parse_layer(tile):
    raw_layers = [value for field, _wire, value in fields(tile) if field == 3]
    if not raw_layers:
        raise ValueError('No vector-tile layer found')
    raw_layer = raw_layers[0]
    name = ''
    keys = []
    values = []
    raw_features = []
    extent = 4096
    for field, _wire, value in fields(raw_layer):
        if field == 1:
            name = value.decode('utf-8', errors='replace')
        elif field == 2:
            raw_features.append(value)
        elif field == 3:
            keys.append(value.decode('utf-8', errors='replace'))
        elif field == 4:
            values.append(value_message(value))
        elif field == 5:
            extent = value
    features = []
    for raw_feature in raw_features:
        feature_id = None
        tags = []
        kind = None
        geometry = []
        for field, _wire, value in fields(raw_feature):
            if field == 1:
                feature_id = value
            elif field == 2:
                tags = list(unpack_varints(value))
            elif field == 3:
                kind = value
            elif field == 4:
                geometry = list(unpack_varints(value))
        props = {}
        for i in range(0, len(tags), 2):
            props[keys[tags[i]]] = values[tags[i + 1]]
        features.append((feature_id, kind, props, geometry))
    return name, extent, features


def decode_rings(commands):
    x = y = 0
    rings = []
    current = []
    pos = 0
    while pos < len(commands):
        command = commands[pos]
        pos += 1
        command_id = command & 7
        count = command >> 3
        if command_id in (1, 2):
            for _ in range(count):
                dx = zigzag(commands[pos])
                dy = zigzag(commands[pos + 1])
                pos += 2
                x += dx
                y += dy
                point = [x, y]
                if command_id == 1:
                    if current:
                        rings.append(current)
                    current = [point]
                else:
                    current.append(point)
        elif command_id == 7:
            if current and current[0] != current[-1]:
                current.append(current[0])
        else:
            raise ValueError(f'Unsupported MVT command {command_id}')
    if current:
        if current[0] != current[-1]:
            current.append(current[0])
        rings.append(current)
    return rings


def ring_area(ring):
    return sum(ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1] for i in range(len(ring) - 1)) / 2


def point_in_ring(point, ring):
    x, y = point
    inside = False
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def rings_to_multipolygon(rings, extent):
    rings = [ring for ring in rings if len(ring) >= 4 and abs(ring_area(ring)) > 0.01]
    if not rings:
        return None
    # MVT exterior rings and holes use opposite winding.  Use the largest
    # ring as the exterior orientation for this feature, then attach holes.
    outer_sign = 1 if ring_area(max(rings, key=lambda ring: abs(ring_area(ring)))) > 0 else -1
    polygons = []
    for ring in rings:
        if (1 if ring_area(ring) > 0 else -1) == outer_sign:
            polygons.append([ring])
        elif polygons:
            target = None
            for polygon in polygons:
                if point_in_ring(ring[0], polygon[0]):
                    target = polygon
                    break
            (target or polygons[-1]).append(ring)
        else:
            polygons.append([ring])

    def project(point):
        px, py = point
        lon = px / extent * 360 - 180
        mercator_y = 1 - 2 * py / extent
        lat = math.degrees(math.atan(math.sinh(math.pi * mercator_y)))
        return [round(lon, 6), round(lat, 6)]

    return [[[project(point) for point in ring] for ring in polygon] for polygon in polygons]


def decode_features(path):
    name, extent, raw_features = parse_layer(Path(path).read_bytes())
    decoded = []
    for feature_id, kind, props, commands in raw_features:
        geometry = rings_to_multipolygon(decode_rings(commands), extent) if kind == 3 else None
        if geometry:
            decoded.append({'type': 'Feature', 'geometry': {'type': 'MultiPolygon', 'coordinates': geometry}, 'properties': props})
    return name, decoded


NAME_TO_ID = {
    'Albania': 'albania', 'Andorra': 'andorra', 'Anhalt': 'anhalt',
    'Anhalt-Bernberg': 'anhaltBernberg', 'Anhalt-Dessau': 'anhaltDessau',
    'Austria': 'austria', 'Austria-Hungary': 'austriaHungary',
    'Baden': 'baden', 'Bavaria': 'bavaria', 'Belgium': 'belgium',
    'Bosnia': 'bosnia', 'Bosnia-Herzegovina': 'bosniaHerzegovina',
    'Bulgaria': 'bulgaria', 'Cracow': 'cracow', 'Croatia': 'croatia',
    'Czech Republic': 'czechia', 'Czechoslovakia': 'czechoslovakia',
    'Denmark': 'denmark', 'Estonia': 'estonia', 'Finland': 'finland',
    'France': 'france', 'Frankfurt': 'frankfurt', 'Georgia': 'georgia',
    'German Democratic Republic': 'eastGermany', 'German Federal Republic': 'westGermany',
    'Greece': 'greece', 'Hanover': 'hanover', 'Hesse-Darmstadt (Ducal': 'hesseDarmstadt',
    'Hesse-Homburg': 'hesseHomburg', 'Hesse-Kassel (Electoral)': 'hesseKassel',
    'Hohengeroldseck': 'hohengeroldseck', 'Hohenzollern-Hechingen': 'hohenzollernHechingen',
    'Hohenzollern-Sigmaringen': 'hohenzollernSigmaringen', 'Hungary': 'hungary',
    'Iceland': 'iceland', 'Ireland': 'ireland', 'Italy': 'italy', 'Italy/Sardinia': 'italy',
    'Kingdom of Naples': 'naples', 'Latvia': 'latvia', 'Liechtenstein': 'liechtenstein',
    'Lithuania': 'lithuania', 'Lucca': 'lucca', 'Luxembourg': 'luxembourg',
    'Macedonia (FYROM/North Macedonia)': 'macedonia-fyrom-north-macedonia',
    'Malta': 'malta', 'Massa': 'massa', 'Mecklenburg-Schwerin': 'mecklenburgSchwerin',
    'Mecklenburg-Strelitz': 'mecklenburgStrelitz', 'Modena': 'modena', 'Moldova': 'moldova',
    'Montenegro': 'montenegro', 'Netherlands': 'netherlands', 'Norway': 'norway',
    'Oldenburg': 'oldenburg', 'Ottoman Empire': 'ottoman', 'Papal States': 'papal',
    'Parma': 'parma', 'Piedmont': 'piedmont', 'Poland': 'poland', 'Portugal': 'portugal',
    'Reuss': 'reuss', 'Romania': 'romania', 'Rumania': 'romania', 'Russia': 'russia',
    'Russia (Soviet Union)': 'russia', 'San Marino': 'sanMarino', 'Saxe-Altenburg': 'saxeAltenburg',
    'Saxe-Coburg-Gotha': 'saxeCoburgGotha', 'Saxe-Coburg-Saalfeld': 'saxeCoburgSaalfeld',
    'Saxe-Gotha-Altenberg': 'saxeGothaAltenberg', 'Saxe-Hildburgchausen': 'saxeHildburghausen',
    'Saxe-Meiningen': 'saxeMeiningen', 'Saxe-Weimar': 'saxeWeimar', 'Saxony': 'saxony',
    'Schaumburg Lippe': 'schaumburgLippe', 'Serbia': 'serbia', 'Slovakia': 'slovakia',
    'Slovenia': 'slovenia', 'Spain': 'spain', 'Sweden': 'sweden', 'Switzerland': 'switzerland',
    'Turkey (Ottoman Empire)': 'ottoman', 'Ukraine': 'ukraine', 'United Kingdom': 'uk',
    'Württemberg': 'wurttemberg', 'W\xffrttemberg': 'wurttemberg', 'Yugoslavia': 'yugoslavia',
}

DISPLAY_NAMES = {
    'anhalt': '\u5b89\u54c8\u5c14\u7279', 'anhaltBernberg': '\u5b89\u54c8\u5c14\u7279-\u8d1d\u6069\u5821', 'anhaltDessau': '\u5b89\u54c8\u5c14\u7279-\u5fb7\u7ecd',
    'baden': '\u5df4\u767b', 'bavaria': '\u5df4\u4f10\u5229\u4e9a', 'cracow': '\u514b\u62c9\u79d1\u592b\u81ea\u7531\u5e02', 'frankfurt': '\u6cd5\u5170\u514b\u798f\u7279\u81ea\u7531\u5e02',
    'hanover': '\u6c49\u8bfa\u5a01', 'hesseDarmstadt': '\u9ed1\u68ee-\u8fbe\u59c6\u65af\u65bd\u5854\u7279', 'hesseHomburg': '\u9ed1\u68ee-\u6d2a\u5821',
    'hesseKassel': '\u9ed1\u68ee-\u5361\u585e\u5c14', 'hohengeroldseck': '\u970d\u4ea8\u683c\u7f57\u5c14\u5fb7\u585e\u514b',
    'hohenzollernHechingen': '\u970d\u4ea8\u7d22\u4f26-\u9ed1\u94a6\u6839', 'hohenzollernSigmaringen': '\u970d\u4ea8\u7d22\u4f26-\u9521\u683c\u9a6c\u6797\u6839',
    'liechtenstein': '\u5217\u652f\u6566\u58eb\u767b', 'lucca': '\u5362\u5361', 'massa': '\u9a6c\u8428', 'mecklenburgSchwerin': '\u6885\u514b\u4f26\u5821-\u4ec0\u672a\u6797',
    'mecklenburgStrelitz': '\u6885\u514b\u4f26\u5821-\u65bd\u7279\u96f7\u5229\u8328', 'modena': '\u6469\u5fb7\u7eb3', 'naples': '\u90a3\u4e0d\u52d2\u65af\u738b\u56fd',
    'oldenburg': '\u5965\u5c14\u767b\u5821', 'parma': '\u5e15\u5c14\u9a6c', 'reuss': '\u7f57\u4f0a\u65af', 'sanMarino': '\u5723\u9a6c\u529b\u8bfa',
    'saxeAltenburg': '\u8428\u514b\u68ee-\u963f\u5c14\u6ede\u5821', 'saxeCoburgGotha': '\u8428\u514b\u68ee-\u79d1\u5821-\u54e5\u8fbe',
    'saxeCoburgSaalfeld': '\u8428\u514b\u68ee-\u79d1\u5821-\u8428\u5c14\u8d39\u5c14\u5fb7', 'saxeGothaAltenberg': '\u8428\u514b\u68ee-\u54e5\u8fbe-\u963f\u5c14\u6ede\u5821',
    'saxeHildburghausen': '\u8428\u514b\u68ee-\u5e0c\u5c14\u5fb7\u5e03\u683c\u8c6a\u68c0', 'saxeMeiningen': '\u8428\u514b\u68ee-\u8fc8\u5b81\u6839',
    'saxeWeimar': '\u8428\u514b\u68ee-\u9b4f\u739b', 'saxony': '\u8428\u514b\u68ee\u738b\u56fd', 'schaumburgLippe': '\u7ecd\u59c6\u5821-\u5229\u73c0',
    'wurttemberg': '\u7b26\u817e\u5821',
}


def feature_path(feature):
    def project(point):
        lon, lat = point
        return (lon + 25) * 12, (72 - lat) * (650 / 38)

    chunks = []
    for polygon in feature['geometry']['coordinates']:
        for ring in polygon:
            if len(ring) < 4:
                continue
            points = [project(point) for point in ring]
            chunks.append('M' + ' '.join(f'{x:.1f},{y:.1f}' if i == 0 else f'L{x:.1f},{y:.1f}' for i, (x, y) in enumerate(points)) + 'Z')
    return ''.join(chunks)


def early_features(features):
    result = []
    for feature in features:
        props = feature['properties']
        source_name = props.get('Name', '').replace('\ufffd', 'ü')
        if source_name.startswith('W') and 'rttemberg' in source_name:
            source_name = 'Württemberg'
        feature_id = NAME_TO_ID.get(source_name)
        if not feature_id:
            continue
        from_year = max(1816, int(props.get('From', 1816)))
        to_year = min(1885, int(props.get('To', 1885)))
        if from_year > to_year:
            continue
        result.append({
            'id': feature_id,
            'name': DISPLAY_NAMES.get(feature_id, source_name),
            'statename': DISPLAY_NAMES.get(feature_id, source_name),
            'from': from_year,
            'to': to_year,
            'startdate': f'{from_year}-01-01',
            'enddate': f'{to_year}-12-31',
            'capital': props.get('Capital') or '',
            'status': 1 if props.get('Status') == 'independent' else 0,
            'gwcode': str(props.get('id') or ''),
            'source': 'CShapes-Europe · NASTAC vector-tile import',
            'path': feature_path(feature),
        })
    return result


if __name__ == '__main__':
    layer, features = decode_features('.nastac-tile-0.pbf')
    early = early_features(features)
    Path('euro-cshapes-europe-1816-1885.js').write_text(
        'window.EURO_CSHAPES_EARLY_FEATURES=' + json.dumps(early, ensure_ascii=True, separators=(',', ':')) + ';\n',
        encoding='utf-8',
    )
    Path('.nastac-cshapesEurope.decoded.geojson').write_text(
        json.dumps({'type': 'FeatureCollection', 'features': features}, ensure_ascii=False),
        encoding='utf-8',
    )
    print('layer', layer, 'decoded', len(features), 'early imported', len(early), 'output-bytes', Path('euro-cshapes-europe-1816-1885.js').stat().st_size)
