from pathlib import Path
from io import BytesIO
import hashlib
import json
import shutil
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor

ROOT = Path(r'D:\Jose (Datos)\Medicina\CEDIAH\Web')
SOURCE = Path(r'D:\Jose (Datos)\1000 Empresas\Módulo 1\Actividades')
OUT = ROOT / 'output/pdf'
DELIVERY = SOURCE / 'Completados - Koraz'
WORK = ROOT / 'tmp/pdfs/1000-empresas'
for folder in (OUT, DELIVERY, WORK):
    folder.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont('Calibri', r'C:\Windows\Fonts\calibri.ttf'))
pdfmetrics.registerFont(TTFont('Calibri-Bold', r'C:\Windows\Fonts\calibrib.ttf'))
pdfmetrics.registerFontFamily('Calibri', normal='Calibri', bold='Calibri-Bold')
INK = HexColor('#16354c')
MUTED = HexColor('#536674')
CHECKS = []

def para(c, text, x, top, width, height, size=11.2, leading=14.2, color=INK):
    style = ParagraphStyle('body', fontName='Calibri', fontSize=size,
                           leading=leading, textColor=color, spaceAfter=0)
    p = Paragraph(text, style)
    w, h = p.wrap(width, height)
    if h > height + 0.01:
        raise ValueError(f'Overflow {h:.1f}>{height:.1f}: {text}')
    p.drawOn(c, x, 792-top-h)
    CHECKS.append({'top':top, 'x':x, 'height':h, 'allowed_height':height,
                   'font_size':size, 'text':text})

def identity(c):
    para(c, 'José', 62, 210, 300, 18, size=12, leading=15)
    para(c, '29/10/2026', 381, 210, 170, 18, size=12, leading=15)

def overlay(source_name, output_name, painters):
    original = SOURCE / source_name
    digest = hashlib.sha256(original.read_bytes()).hexdigest()
    reader = PdfReader(original)
    writer = PdfWriter()
    assert len(reader.pages) == len(painters)
    for page, paint in zip(reader.pages, painters):
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=(612,792))
        paint(c)
        c.save()
        buf.seek(0)
        page.merge_page(PdfReader(buf).pages[0])
        writer.add_page(page)
    writer.add_metadata({'/Title':output_name.removesuffix('.pdf').replace('_',' '),
                         '/Subject':'Actividad completada a partir del proyecto Koraz; hipótesis identificadas.',
                         '/Author':'José', '/Creator':'Koraz - actividades personales'})
    destination = OUT / output_name
    with destination.open('wb') as f:
        writer.write(f)
    shutil.copy2(destination, DELIVERY / output_name)
    assert hashlib.sha256(original.read_bytes()).hexdigest() == digest
    return {'source':str(original),'source_sha256':digest,
            'output':str(destination),'delivery':str(DELIVERY/output_name),
            'pages':len(reader.pages)}

empresa = {
    'problema': 'Quiero resolver la dificultad de convertir mucha información médica dispersa en aprendizaje organizado y duradero. Me interesa que el estudiante sepa qué estudiar, cómo practicar y qué necesita reforzar, en lugar de depender solo de leer o memorizar para un examen.',
    'publico': 'Quiero empezar por estudiantes de medicina hispanohablantes, especialmente quienes necesitan una guía clara para las materias básicas y su conexión con la clínica. Mi punto de partida es el entorno venezolano, con la aspiración de llegar después a otros países de habla hispana.',
    'ventaja': 'Mi trabajo con material de estudio médico y la construcción de CEDIAH/Koraz me dan una base concreta: ya he desarrollado guías, rutas por objetivos, actividades, evaluaciones y repaso. Combino interés por la medicina, criterio para trabajar con fuentes y constancia para convertir una idea en un producto que pueda mejorar con sus usuarios.',
    'vision': 'En cinco años quiero que Koraz sea una empresa sostenible de educación médica en español, con un equipo académico y tecnológico, contenido revisado y una experiencia sencilla en móvil y computadora. Aspiro a sostenerla con suscripciones accesibles y explorar alianzas educativas, comprobando su utilidad con estudiantes reales.',
    'declaracion': 'Quiero construir Koraz, una empresa de educación médica en español que ayude a los estudiantes a estudiar con claridad, comprender lo que aprenden y conservarlo en el tiempo. El problema que quiero resolver es la distancia entre tener acceso a mucha información y saber convertirla en una ruta de aprendizaje útil.<br/><br/>Quiero empezar por estudiantes de medicina de mi entorno y crecer hacia otros públicos hispanohablantes. La propuesta es conectar guías con fuentes identificables, objetivos claros, actividades, evaluaciones y repaso, para que cada persona pueda reconocer qué le falta y cuál es su siguiente paso.<br/><br/>Mi punto de partida es el trabajo que ya he realizado con contenidos médicos y con CEDIAH/Koraz. He dedicado esfuerzo a construir tanto el material como la plataforma, y quiero seguir mejorándolos a partir del uso real. Me mueve hacer que estudiar medicina sea más comprensible y menos desordenado, y convertir ese trabajo en una empresa con continuidad.<br/><br/>En cinco años imagino un equipo académico y tecnológico que mantenga la calidad del contenido y un modelo de suscripción accesible que permita sostenerlo. Mi compromiso es comprobar los problemas con estudiantes, escuchar sus dificultades y medir si Koraz les resulta útil antes de prometer resultados.'
}

def empresa_1(c):
    identity(c)
    para(c, empresa['problema'], 66, 376, 491, 55)
    para(c, empresa['publico'], 66, 481, 491, 55)
    para(c, empresa['ventaja'], 66, 587, 491, 63)
    para(c, 'Borrador personal propuesto a partir del trabajo en Koraz. La visión expresa una aspiración.',
         55, 677, 510, 15, size=8.7, leading=11, color=MUTED)

def empresa_2(c):
    para(c, empresa['vision'], 66, 118, 491, 64)
    para(c, empresa['declaracion'], 66, 278, 491, 271, size=11.2, leading=14.1)

# Table A contains candidate problems suggested by product work, not interviews.
A = [
    ('Reunir material médico disperso y decidir qué fuente usar.',
     'Estudiantes de medicina.',
     'Buscan en libros, PDF y grupos; comparan y ordenan archivos. Costo: tiempo y posible duplicación de compras; sin medir.',
     'Sí: reunir y ordenar.'),
    ('No tener claro qué estudiar después ni cómo organizar cada tema.',
     'Estudiantes que estudian por su cuenta.',
     'Arman listas y horarios con el temario o preguntan a compañeros. Costo: planificación y desorden; sin medir.',
     'Sí: una ruta clara.'),
    ('Olvidar contenidos después de leerlos o preparar un examen.',
     'Estudiantes con temarios extensos.',
     'Releen apuntes y crean tarjetas o cuestionarios aparte. Costo: tiempo de preparación y repaso; sin medir.',
     'Sí: práctica y repaso.'),
    ('No saber qué objetivos se han aprendido y cuáles requieren refuerzo.',
     'Estudiantes al preparar evaluaciones.',
     'Usan notas, preguntas sueltas y sensación de confianza. Costo: repetir temas o dejar vacíos; sin medir.',
     'Sí: orientar refuerzo.'),
    ('Dificultad para vincular explicaciones y preguntas con sus fuentes.',
     'Estudiantes que contrastan material.',
     'Buscan referencias y cotejan libros o artículos por separado. Costo: tiempo de verificación y acceso; sin medir.',
     'Quizás: valor por validar.'),
]

# Only Koraz is a known project. The other rows are explicit company-type scenarios.
B = [
    ('Koraz: convertir guías en rutas completas exige trabajo editorial.',
     'Fundador, autores y revisores.',
     'Ya hay editor e importación; revisar contenido y fuentes sigue exigiendo trabajo. Costo por ruta: por medir.',
     'Sí: agilizar autoría.'),
    ('Academia médica: coordinar recursos y seguimiento de un curso.',
     'Docentes, coordinación y alumnos.',
     'Hipótesis: combinan carpetas, mensajería y hojas de cálculo. Costo: horas de coordinación; por medir.',
     'Quizás: validar demanda.'),
    ('Editorial médica: mantener coherencia entre guías y preguntas.',
     'Autores y equipo editorial.',
     'Hipótesis: cotejan documentos y bibliografía a mano. Costo: horas de revisión y correcciones; por medir.',
     'Quizás: servicio editorial.'),
    ('Tutoría médica: personalizar el refuerzo entre sesiones.',
     'Tutores y estudiantes.',
     'Hipótesis: envían tareas y registran dificultades en notas. Costo: tiempo de preparación y seguimiento; por medir.',
     'Quizás: apoyo al tutor.'),
    ('Proveedor de cursos médicos: conocer qué retienen sus alumnos.',
     'Coordinadores, docentes y alumnos.',
     'Hipótesis: usan asistencia y pruebas finales, sin seguimiento posterior. Costo: tiempo docente; por medir.',
     'Quizás: evaluación diferida.'),
]

def row(c, values, top, bottom, tag):
    # The template dedicates a wide first column to the number; use its spare
    # space to make the evidence status visible without altering the template.
    para(c, tag, 63, top+27, 79, bottom-top-30, size=8.3, leading=9.2, color=MUTED)
    for text,x,w in zip(values[:3], (158,292,380), (121,74,126)):
        para(c, escape(text), x, top+4, w, bottom-top-8, size=8.6, leading=9.5)
    para(c, escape(values[3]), 518, top+4, 40, bottom-top-8, size=8.2, leading=9.2)

def problemas_1(c):
    identity(c)
    for values,top,bottom in zip(A[:4], (456.75,513,570,627), (513,570,627,683.25)):
        row(c,values,top,bottom,'Hipótesis<br/>por validar')
    para(c, 'A: hipótesis basadas en el trabajo de Koraz; no son resultados de entrevistas ni costos medidos.',
         55,691,510,12,size=8.1,leading=10,color=MUTED)

def problemas_2(c):
    row(c,A[4],87,144,'Hipótesis<br/>por validar')
    for i,(values,top,bottom) in enumerate(zip(B,(270,327,383.25,440.25,497.25),(327,383.25,440.25,497.25,553.5))):
        row(c,values,top,bottom,'Proyecto<br/>conocido' if i==0 else 'Empresa tipo<br/>por validar')
    para(c, '<b>Base del ejercicio.</b> Koraz es el proyecto conocido. B2-B5 son escenarios de empresas del sector, no empresas identificadas ni entrevistadas. Los costos y la disposición a pagar están pendientes de comprobar.',
         55,610,510,40,size=9.5,leading=12,color=MUTED)
    para(c, '<b>Foco inicial propuesto.</b> Validar primero A2 y A4 con estudiantes de medicina: qué estudian hoy, qué usan para decidir su siguiente paso y qué tiempo o dinero destinan a resolverlo.',
         55,657,510,36,size=9.5,leading=12,color=MUTED)

manifest = [
    overlay('¿Qué empresa quiero construir y por qué_.pdf',
            'Que_empresa_quiero_construir_y_por_que_Koraz_completado.pdf',[empresa_1,empresa_2]),
    overlay('Cazador de problemas.pdf',
            'Cazador_de_problemas_Koraz_completado.pdf',[problemas_1,problemas_2]),
]
(WORK/'verificacion.json').write_text(json.dumps({'outputs':manifest,'layout':CHECKS},ensure_ascii=False,indent=2),encoding='utf-8')

text = ['# Actividades del Módulo 1 - Koraz','',
        'Nombre disponible: José. Fecha: 29/10/2026.',
        'Borrador personal basado en el contexto compartido y los archivos del proyecto. No presupone un título profesional, ventas, clientes, entrevistas ni eficacia educativa demostrada. La visión y la motivación están redactadas como propuestas personales.',
        '', '# ¿Qué empresa quiero construir y por qué?','']
for label,key in [('¿Qué problema quieres resolver?','problema'),('¿Para quién?','publico'),('¿Por qué tú?','ventaja'),('Visión en cinco años','vision'),('Tu declaración','declaracion')]:
    text += ['## '+label,'',empresa[key].replace('<br/><br/>','\n\n'),'']
text += ['# Cazador de problemas','', 'A: hipótesis; no hay entrevistas ni costos medidos. B1: proyecto conocido. B2-B5: empresas tipo por validar, no empresas identificadas.','']
for label,rows in [('A. Mundo cotidiano',A),('B. Empresas',B)]:
    text += ['## '+label,'']
    for i,values in enumerate(rows,1):
        text += [f'### {i}. {values[0]}','',f'- Quién lo sufre: {values[1]}',f'- Cómo lo resuelven hoy y cuánto cuesta: {values[2]}',f'- ¿Puede ser negocio?: {values[3]}','']
text += ['## Base consultada','',
         '- Las dos plantillas originales del usuario.',
         '- Contexto previo sobre Koraz y CEDIAH.',
         '- README.md del proyecto.',
         '- apps/web/src/components/landing-screen.tsx: propuesta de estudio y modelo de planes; no acredita suscriptores ni facturación.',
         '- docs/aprendizaje-guiado/v2/manuales/alumno.md: objetivos, actividades, evaluación, refuerzo y repaso.',
         '- docs/aprendizaje-guiado/v2/manuales/administracion.md: fuentes, edición y revisión del contenido.','']
(DELIVERY/'Respuestas_Koraz_editables.md').write_text('\n'.join(text),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False,indent=2))
