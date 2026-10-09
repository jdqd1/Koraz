import json, pathlib, sys, zipfile
path = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(path) as archive:
    for name in archive.namelist():
        if not name.endswith('.network'):
            continue
        for line in archive.read(name).decode('utf-8').splitlines():
            event = json.loads(line)
            item = event.get('snapshot', {})
            request, response = item.get('request', {}), item.get('response', {})
            url = request.get('url', '')
            if '/api/' not in url:
                continue
            print(json.dumps({'method': request.get('method'), 'url': url, 'status': response.get('status'),
                'failure': item.get('_failureText'), 'mime': response.get('content', {}).get('mimeType')}, ensure_ascii=False))
