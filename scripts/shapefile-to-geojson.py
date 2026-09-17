"""Convert the polygon and DBF parts of a simple ESRI Shapefile to GeoJSON.

This deliberately uses only the Python standard library so the CShapes archive
can be imported on a clean workstation without GDAL/Fiona.
"""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path


def dbf_fields(path: Path):
    data = path.read_bytes()
    header_length = struct.unpack_from("<H", data, 8)[0]
    record_length = struct.unpack_from("<H", data, 10)[0]
    fields = []
    offset = 32
    while offset + 32 <= header_length and data[offset] != 0x0D:
        raw_name = data[offset : offset + 11].split(b"\0", 1)[0]
        fields.append((raw_name.decode("latin-1", "replace").strip(), data[offset + 16], data[offset + 17]))
        offset += 32
    return data, header_length, record_length, fields


def dbf_records(path: Path):
    data, header_length, record_length, fields = dbf_fields(path)
    count = struct.unpack_from("<I", data, 4)[0]
    for index in range(count):
        start = header_length + index * record_length
        record = data[start : start + record_length]
        if not record or record[0] == 0x2A:
            yield {}
            continue
        values = {}
        cursor = 1
        for name, width, _decimals in fields:
            raw = record[cursor : cursor + width]
            cursor += width
            values[name] = raw.decode("latin-1", "replace").strip()
        yield values


def shp_records(path: Path):
    data = path.read_bytes()
    shape_type = struct.unpack_from("<i", data, 32)[0]
    if shape_type != 5:
        raise ValueError(f"Only Polygon shapefiles are supported; got shape type {shape_type}")
    cursor = 100
    while cursor + 8 <= len(data):
        content_length = struct.unpack_from(">i", data, cursor + 4)[0] * 2
        content = data[cursor + 8 : cursor + 8 + content_length]
        cursor += 8 + content_length
        if len(content) < 44:
            yield None, None
            continue
        record_type = struct.unpack_from("<i", content, 0)[0]
        if record_type == 0:
            yield None, None
            continue
        if record_type != 5:
            raise ValueError(f"Unexpected record shape type {record_type}")
        min_x, min_y, max_x, max_y = struct.unpack_from("<4d", content, 4)
        part_count, point_count = struct.unpack_from("<2i", content, 36)
        part_offsets = [struct.unpack_from("<i", content, 44 + 4 * part)[0] for part in range(part_count)]
        points_start = 44 + part_count * 4
        points = [struct.unpack_from("<2d", content, points_start + point * 16) for point in range(point_count)]
        parts = []
        for part, start in enumerate(part_offsets):
            end = part_offsets[part + 1] if part + 1 < len(part_offsets) else point_count
            ring = [[round(x, 7), round(y, 7)] for x, y in points[start:end]]
            if len(ring) >= 3:
                parts.append(ring)
        yield (min_x, min_y, max_x, max_y), parts


def intersects(box, target):
    min_x, min_y, max_x, max_y = box
    t_min_x, t_min_y, t_max_x, t_max_y = target
    return not (max_x < t_min_x or min_x > t_max_x or max_y < t_min_y or min_y > t_max_y)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("base", type=Path, help="Shapefile path without extension or path to .shp")
    parser.add_argument("output", type=Path, nargs="?", default=Path("cshapes-europe.geojson"))
    parser.add_argument("--info", action="store_true", help="Print DBF fields and a sample record")
    parser.add_argument("--bbox", nargs=4, type=float, metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"), default=(-25, 34, 65, 72))
    args = parser.parse_args()
    base = args.base.with_suffix("") if args.base.suffix.lower() == ".shp" else args.base
    dbf_path = Path(f"{base}.dbf")
    shp_path = Path(f"{base}.shp")
    if not dbf_path.exists() or not shp_path.exists():
        raise FileNotFoundError(f"Expected {shp_path} and {dbf_path}")
    dbf_data, _header, _record, fields = dbf_fields(dbf_path)
    records = list(dbf_records(dbf_path))
    if args.info:
        print("fields:", ", ".join(name for name, _width, _decimals in fields))
        print("sample:", json.dumps(records[0] if records else {}, ensure_ascii=False))
        return
    features = []
    for properties, (box, parts) in zip(records, shp_records(shp_path)):
        if not box or not parts or not intersects(box, args.bbox):
            continue
        features.append({
            "type": "Feature",
            "properties": properties,
            "geometry": {"type": "Polygon", "coordinates": parts},
        })
    args.output.write_text(json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {len(features)} European-intersecting features to {args.output}")


if __name__ == "__main__":
    main()
