/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DEL PAGO DEL SEGURO · Torneo Regional 29/11 · FAT
   Editá SOLO este archivo para cambiar el alias y los datos de pago.
   - Dejá "" en lo que no quieras mostrar (se oculta solo).
   - Después de editar, subí el número de ?v= en index.html (config.js?v=N)
     para que los celulares no vean la versión vieja.
   - Por seguridad, estos datos NO se pueden cambiar desde el link (?alias=…):
     solo se leen de este archivo del repo.
   ───────────────────────────────────────────────────────────── */
window.FAT_SEGURO = Object.freeze({
  alias: "MSORIA251.NX.ARS",        // ej: "fat.seguro.regional"
  titular: "María del Tránsito Soria",      // ej: "Nombre y apellido de quien recibe"
  banco: "Naranja X",        // ej: "Mercado Pago" / "Banco Macro"
  cbu: "4530000800018996974519",          // CBU o CVU (22 números). Opcional
  monto: "$18.850",        // ej: "$5.000" — si está vacío no se muestra

  // Cierre del pago: martes 24/11/2026 a las 23:59 (hora de Argentina)
  cierre: "2026-11-24T23:59:59-03:00",

  // Datos de contacto de Caruso Seguros (opcionales)
  caruso: Object.freeze({
    telefono: "",   // solo números con código de país, ej: "5493810000000" (abre WhatsApp)
    instagram: ""   // solo el usuario, sin @, ej: "caruso.seguros"
  })
});
