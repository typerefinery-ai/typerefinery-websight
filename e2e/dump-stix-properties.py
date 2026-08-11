"""
docs/issues/0144 step 1 — dump every STIX class's accepted property names to JSON.

The sweep that compares authored form fields against the data model needs the property list to come
from **the same `stixorm` the algorithms import**, or it will report false mismatches. So this runs
under the bundled interpreter with the same package path the generated algorithms use:

    APP_SERVICE_PACKAGES_PATH=<repo>/typerefinery/services/fastapi/__packages__/Python311/site-packages \
      typerefinery/services/_python/win32/python/python.exe \
      typerefinery-websight/e2e/dump-stix-properties.py > e2e/stix-properties.json

Walks every module under `stixorm.module.definitions.*` and records each class that carries both
`_type` and `_properties` — that pair is what `stix2.base` validates against, and an
`ExtraPropertiesError` is raised for anything outside it.

Embedded types (ContactNumber, StateChangeObject, …) are dumped too: docs/issues/0142 and
docs/issues/0093 both came from a field named after the EMBEDDED TYPE instead of the property that
holds it, so the sweep needs to recognise those names to explain a mismatch rather than just flag it.
"""
import importlib
import inspect
import json
import os
import pkgutil
import sys

sys.path.insert(0, os.environ["APP_SERVICE_PACKAGES_PATH"])

import stixorm  # noqa: E402
from stixorm.module import definitions as defs  # noqa: E402

out = {"types": {}, "embedded": {}, "errors": []}
seen = set()


def record(cls):
    name = cls.__name__
    props = getattr(cls, "_properties", None)
    if not props:
        return
    stix_type = getattr(cls, "_type", None)
    entry = {"class": name, "properties": sorted(props.keys())}
    if stix_type:
        # Several classes can share a _type (e.g. sub-typed extensions); keep the richest.
        prev = out["types"].get(stix_type)
        if prev is None or len(entry["properties"]) > len(prev["properties"]):
            out["types"][stix_type] = entry
    else:
        out["embedded"][name] = entry["properties"]


for mod in pkgutil.walk_packages(defs.__path__, defs.__name__ + "."):
    try:
        m = importlib.import_module(mod.name)
    except Exception as exc:  # a definitions module that cannot import is worth reporting, not fatal
        out["errors"].append(f"{mod.name}: {type(exc).__name__}: {exc}")
        continue
    for _, obj in inspect.getmembers(m, inspect.isclass):
        if obj in seen:
            continue
        seen.add(obj)
        try:
            record(obj)
        except Exception as exc:
            out["errors"].append(f"{obj.__name__}: {type(exc).__name__}: {exc}")

out["meta"] = {"stixorm": getattr(stixorm, "__file__", "?"), "types": len(out["types"]), "embedded": len(out["embedded"])}
print(json.dumps(out, indent=1))
