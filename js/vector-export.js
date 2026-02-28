/*
  Este script genera un SVG procesando el DOM de forma que Illustrator lo reconozca.
  A diferencia de html-to-image, este exportador dibuja cada elemento manualmente
  usando primitivas de SVG (<rect>, <line>, <path>) para máxima compatibilidad.
*/

window.VectorExporter = {
  fonts: {},
  // URLs de fuentes para trazado manual (necesario cuando expandFonts = true)
  fontUrls: {
    Inter:
      "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyMZhrib2Bg-4.ttf",
    "Inter-Bold":
      "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5m5xb_FqxRzlrp6-fpg.ttf",
    Oswald: "https://fonts.gstatic.com/s/oswald/v49/TK7iWqv9Hlvg_9-6W60u7w.ttf",
    "Oswald-Bold":
      "https://fonts.gstatic.com/s/oswald/v49/TK7pWqv9Hlvg_9-6W6At7-X86u9K.ttf",
    Roboto: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf",
    "Roboto-Bold":
      "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf",
  },

  /**
   * Mapea el nombre de la fuente CSS a una clave de fuente cargable.
   */
  getFontKey: function (family, weight) {
    const isBold = weight === "bold" || parseInt(weight) >= 700;
    const cleanFamily = family.replace(/['"]/g, "").toLowerCase();

    if (cleanFamily.includes("oswald"))
      return isBold ? "Oswald-Bold" : "Oswald";
    if (cleanFamily.includes("roboto"))
      return isBold ? "Roboto-Bold" : "Roboto";
    // Por defecto Inter (nuestra Helvetica/Arial de reemplazo para trazado)
    return isBold ? "Inter-Bold" : "Inter";
  },

  /**
   * Función principal de exportación.
   */
  exportToSVG: async function (node, options = {}) {
    const expandFonts = options.expandFonts || false;

    // 1. Clonamos el nodo para no afectar la UI real durante el proceso
    const clone = node.cloneNode(true);
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.transform = "none"; // Eliminamos zoom/escala para medir real
    document.body.appendChild(clone);

    const rootRect = clone.getBoundingClientRect();
    const width = rootRect.width;
    const height = rootRect.height;

    // 2. Si se requiere trazado, precargamos las fuentes necesarias
    if (expandFonts) {
      await this.loadNeededFonts(clone);
    }

    // 3. Generamos el XML del SVG
    let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#ffffff" />`;

    // Procesamos recursivamente
    svg += this.processNode(clone, rootRect, expandFonts);

    svg += "\n</svg>";

    // Limpieza
    document.body.removeChild(clone);

    return svg;
  },

  /**
   * Carga los archivos .ttf necesarios para opentype.js
   */
  loadNeededFonts: async function (node) {
    const fontsToLoad = new Set();
    const walk = (el) => {
      if (el.nodeType === 1) {
        const styles = window.getComputedStyle(el);
        const family = styles.fontFamily.split(",")[0];
        const weight = styles.fontWeight;
        const key = this.getFontKey(family, weight);

        if (this.fontUrls[key] && !this.fonts[key]) {
          fontsToLoad.add(key);
        }
        Array.from(el.children).forEach(walk);
      }
    };
    walk(node);

    const promises = Array.from(fontsToLoad).map((key) => {
      return new Promise((resolve) => {
        opentype.load(this.fontUrls[key], (err, font) => {
          if (err) console.error("Error cargando fuente:", key, err);
          else this.fonts[key] = font;
          resolve();
        });
      });
    });
    await Promise.all(promises);
  },

  /**
   * Procesa cada nodo HTML y lo convierte en SVG
   */
  processNode: function (node, rootRect, expandFonts) {
    if (node.nodeType !== 1) return "";

    const styles = window.getComputedStyle(node);
    if (
      styles.display === "none" ||
      styles.visibility === "hidden" ||
      node.tagName === "SCRIPT"
    ) {
      return "";
    }

    const nodeRect = node.getBoundingClientRect();
    const x = nodeRect.left - rootRect.left;
    const y = nodeRect.top - rootRect.top;
    const w = nodeRect.width;
    const h = nodeRect.height;

    let svg = "";

    // FONDO: Dibujar rect si tiene color de fondo
    const bg = styles.backgroundColor;
    if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      svg += `\n  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${bg}" />`;
    }

    // BORDES: Dibujar líneas para cada borde
    const sides = ["Top", "Bottom", "Left", "Right"];
    sides.forEach((side) => {
      const bW = parseFloat(styles[`border${side}Width`]);
      const bC = styles[`border${side}Color`];
      const bS = styles[`border${side}Style`];
      if (bW > 0 && bS !== "none") {
        let x1, y1, x2, y2;
        if (side === "Top") {
          x1 = x;
          y1 = y + bW / 2;
          x2 = x + w;
          y2 = y + bW / 2;
        } else if (side === "Bottom") {
          x1 = x;
          y1 = y + h - bW / 2;
          x2 = x + w;
          y2 = y + h - bW / 2;
        } else if (side === "Left") {
          x1 = x + bW / 2;
          y1 = y;
          x2 = x + bW / 2;
          y2 = y + h;
        } else if (side === "Right") {
          x1 = x + w - bW / 2;
          y1 = y;
          x2 = x + w - bW / 2;
          y2 = y + h;
        }
        svg += `\n  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${bC}" stroke-width="${bW}" />`;
      }
    });

    // HIJOS: Procesar contenido (texto o más nodos)
    node.childNodes.forEach((child) => {
      if (child.nodeType === 1) {
        svg += this.processNode(child, rootRect, expandFonts);
      } else if (child.nodeType === 3) {
        svg += this.processTextNode(child, node, rootRect, expandFonts);
      }
    });

    return svg;
  },

  /**
   * Convierte nodos de texto en <path> (si expandFonts) o <text>
   */
  processTextNode: function (textNode, parentEl, rootRect, expandFonts) {
    const text = textNode.textContent;
    if (!text.trim()) return "";

    const styles = window.getComputedStyle(parentEl);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;
    const fontFamily = styles.fontFamily.split(",")[0];
    const color = styles.color;

    let svg = "";
    const range = document.createRange();
    const fontKey = expandFonts
      ? this.getFontKey(fontFamily, fontWeight)
      : null;
    const font = fontKey ? this.fonts[fontKey] : null;

    // Procesamos carácter por carácter para posicionamiento perfecto (handles wrapping)
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (!char.trim() && char !== " ") continue;

      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const charRect = range.getBoundingClientRect();

      if (charRect.width === 0) continue;

      const x = charRect.left - rootRect.left;
      const y = charRect.top - rootRect.top + fontSize * 0.82; // Baseline approx

      if (expandFonts && font) {
        // CASO TRAZADO: Convertir carácter a objeto <path>
        const path = font.getPath(char, x, y, fontSize);
        const naturalWidth = font.getAdvanceWidth(char, fontSize);
        let pStr = path.toSVG();

        // Forzar color y manejar escalaX (condensado)
        pStr = pStr.replace(/<path/g, `<path fill="${color}"`);

        if (naturalWidth > 0 && Math.abs(naturalWidth - charRect.width) > 0.1) {
          const sx = charRect.width / naturalWidth;
          const dx = x - x * sx;
          pStr = `<g transform="matrix(${sx},0,0,1,${dx},0)">${pStr}</g>`;
        }
        svg += `\n  ${pStr}`;
      } else {
        // CASO TEXTO: Usar etiqueta <text> estándar con posicionamiento forzado
        const escaped = char.replace(
          /[<>&"']/g,
          (c) =>
            ({
              "<": "&lt;",
              ">": "&gt;",
              "&": "&amp;",
              '"': "&quot;",
              "'": "&apos;",
            })[c],
        );
        svg += `\n  <text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}px" font-weight="${fontWeight}" fill="${color}" textLength="${charRect.width}" lengthAdjust="spacingAndGlyphs">${escaped}</text>`;
      }
    }

    return svg;
  },

  /**
   * Dispara el guardado del archivo
   */
  download: function (filename, svgString) {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
