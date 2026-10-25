# FAT WEB — Escudo y jugadora en 3D real

Incluye escudo FAT extruido y texturizado (`escudo-fat-3d.glb`) y modelo conceptual de jugadora IA con camiseta FAT (`jugadora-fat-3d.glb`). El escudo responde al desplazamiento de la página; la jugadora puede girar 360° o mostrarse de frente y espalda. El resto de la web conserva video de cancha amateur, siete sponsors, certificado, autoridades y crédito a Enzo Valenzuela Massa.

## Tecnología
Three.js + GLTFLoader importados desde CDN; el navegador necesita conexión a Internet para cargar la librería. El sitio funciona como HTML estático en GitHub Pages. Si WebGL no está disponible, aparecen imágenes de respaldo. Se respeta movimiento reducido.

## Alcance
Los modelos son geometría 3D real y están animados mediante rotación, **no son personajes esqueletizados ni animaciones de caminar/correr**. El rostro y uniforme se reconstruyeron de forma aproximada a partir de referencias: no son copias fotográficas exactas. El modelo no representa una jugadora real.

## Publicar
Extraer todos los archivos del ZIP a la raíz del repositorio `TeFaltaUno/FAT-WEB`, rama `main`. No subir el ZIP sin extraer. Para probar antes de reemplazar la web pública, abrir un servidor local (`python -m http.server 8000`) y navegar a http://localhost:8000.
