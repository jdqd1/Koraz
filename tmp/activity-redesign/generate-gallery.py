from pathlib import Path
from html import escape
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
labels = {
    'study': 'Lectura', 'worked-example': 'Ejemplo resuelto', 'partial-example': 'Ejemplo con apoyo',
    'single_choice': 'Selección de respuesta', 'short_answer': 'Respuesta breve',
    'constructed_response': 'Explicación escrita', 'comparison': 'Comparar con el modelo',
    'feedback': 'Resultado de la respuesta', 'match': 'Relacionar elementos',
    'comparison_table': 'Tabla de comparación', 'causal_map': 'Mapa de relaciones',
    'sequence': 'Ordenar pasos', 'image_target': 'Señalar una imagen', 'labeling': 'Etiquetar una imagen',
    'case': 'Caso progresivo', 'case-wrapper': 'Caso pendiente de recuperar',
    'connection-error': 'Recuperación de conexión', 'quiz': 'Cuestionario anterior',
    'flashcards': 'Tarjetas de memoria', 'guide': 'Guía por secciones', 'review': 'Repaso de preguntas',
    'review-card': 'Repaso de tarjetas', 'video': 'Video', 'external-video': 'Video externo',
}
captures = []
for path in sorted((root / 'final').rglob('*.png')):
    if path.stem not in labels:
        continue
    device = next((value for value in ['mobile', 'compact', 'desktop'] if path.parent.name.endswith('-' + value)), '')
    captures.append((path, device, labels[path.stem]))

cards = '\n'.join(f'<figure data-device="{device}"><figcaption>{escape(label)}<small>{ {"mobile": "Móvil · 390 px", "compact": "Móvil · 320 px", "desktop": "Escritorio · 1440 px"}[device] }</small></figcaption><a href="{escape(path.relative_to(root).as_posix())}"><img loading="lazy" src="{escape(path.relative_to(root).as_posix())}" alt="{escape(label)}"></a></figure>' for path, device, label in captures)
html = '''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Actividades de aprendizaje · Koraz</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#17233b;font:16px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}header{max-width:1280px;margin:auto;padding:48px 24px 20px}h1{font-size:36px;letter-spacing:-.04em;margin:0 0 12px}p{color:#63708a;line-height:1.6}nav{display:flex;gap:8px;flex-wrap:wrap;padding:12px 0}button{min-height:44px;padding:10px 18px;border:1px solid #dce3ef;border-radius:12px;background:white;font:inherit;color:#435a85;cursor:pointer}button[aria-pressed=true]{background:#2458ee;color:white;border-color:#2458ee}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;max-width:1280px;margin:auto;padding:12px 24px 48px}figure{margin:0;padding:18px;background:white;border:1px solid #dce3ef;border-radius:20px;align-self:start;overflow:hidden}figcaption{font-weight:600;margin-bottom:16px}small{display:block;color:#63708a;font-size:12px;font-weight:400;margin-top:5px}img{width:100%;height:auto;display:block;border-radius:12px}figure[data-device=desktop]{grid-column:1/-1}figure[hidden]{display:none}@media(max-width:540px){header{padding-top:28px}h1{font-size:28px}main{padding-inline:16px}}</style>
<header><h1>Actividades de aprendizaje</h1><p>Capturas de la implementación local, con contenido de prueba. 12 de octubre de 2026.</p><nav aria-label="Tamaño de pantalla"><button data-filter="mobile" aria-pressed="true">Móvil</button><button data-filter="compact" aria-pressed="false">320 px</button><button data-filter="desktop" aria-pressed="false">Escritorio</button></nav></header><main>''' + cards + '''</main><script>const buttons=[...document.querySelectorAll('button')];function filter(device){document.querySelectorAll('figure').forEach(item=>item.hidden=item.dataset.device!==device);buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===device)))}buttons.forEach(button=>button.addEventListener('click',()=>filter(button.dataset.filter)));filter('mobile');</script></html>'''
(root / 'gallery.html').write_text(html, encoding='utf-8')

selected = [next((path for path, device, label in captures if device == 'mobile' and path.stem == name), None) for name in ['short_answer', 'feedback', 'sequence']]
if all(selected):
    width, gap, top = 390, 24, 75
    images = [Image.open(path).convert('RGB') for path in selected]
    canvas = Image.new('RGB', (width * 3 + gap * 4, top + max(image.height for image in images) + gap), '#edf2fa')
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 22)
    except OSError:
        font = ImageFont.load_default()
    for index, (path, image) in enumerate(zip(selected, images)):
        x = gap + index * (width + gap)
        draw.text((x, 26), labels[path.stem], font=font, fill='#17233b')
        canvas.paste(image, (x, top))
    canvas.save(root / 'mobile-preview.png')
print(f'{len(captures)} capturas; galería guardada en {root / "gallery.html"}')
