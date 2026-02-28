window.Exporter = {
  init: function () {
    this.svgExpandFonts = document.getElementById("svg-expand-fonts");
    this.jpgScale = document.getElementById("jpg-scale");
    this.jpgScaleVal = document.getElementById("jpg-scale-val");

    if (this.jpgScale) {
      this.jpgScale.addEventListener("input", (e) => {
        let val = e.target.value;
        let text =
          val +
          "x " +
          (val > 2 ? "Ultra HD" : val > 1 ? "Alta Resolución" : "Normal");
        this.jpgScaleVal.textContent = text;
      });
    }

    document.getElementById("export-jpg").addEventListener("click", () => {
      this.downloadJPG(document.getElementById("nutrition-label"));
    });

    document.getElementById("export-svg").addEventListener("click", () => {
      this.downloadSVG(document.getElementById("nutrition-label"));
    });
  },

  downloadJPG: function (node) {
    if (!node) return;
    let scale = parseInt(this.jpgScale.value) || 2;

    // Disable transitions temporarily and ensure white background (labels should be white)
    node.style.transition = "none";
    node.style.transform = "none";

    let width = node.offsetWidth;
    let height = node.offsetHeight;

    htmlToImage
      .toJpeg(node, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: width + "px",
          height: height + "px",
        },
      })
      .then(function (dataUrl) {
        let link = document.createElement("a");
        link.download = `etiqueta-nutricional-${new Date().getTime()}.jpg`;
        link.href = dataUrl;
        link.click();

        // Restore styles
        node.style.transition = "";
        setTimeout(() => {
          window.UI.updateZoom(); // Refresh scale
        }, 50);
      })
      .catch(function (error) {
        console.error("Error exportando a JPG!", error);
        alert("Hubo un error al generar la imagen. Intenta nuevamente.");
        node.style.transition = "";
      });
  },

  downloadSVG: function (node) {
    if (!node) return;

    let expandFonts = this.svgExpandFonts ? this.svgExpandFonts.checked : false;

    // We use our custom VectorExporter instead of html-to-image
    // as it creates Illustrator-compatible SVG primitives.
    (async () => {
      try {
        const svgString = await window.VectorExporter.exportToSVG(node, {
          expandFonts: expandFonts,
        });

        const filename = `etiqueta-nutricional-${expandFonts ? "trazada-" : ""}${new Date().getTime()}.svg`;
        window.VectorExporter.download(filename, svgString);
      } catch (err) {
        console.error("Error with Vector Export", err);

        // Fallback to htmlToImage if our manual one fails
        htmlToImage
          .toSvg(node, {
            backgroundColor: "#ffffff",
          })
          .then(function (dataUrl) {
            let link = document.createElement("a");
            link.download = `etiqueta-nutricional-compat-${new Date().getTime()}.svg`;
            link.href = dataUrl;
            link.click();
          });
      }

      setTimeout(() => {
        window.UI.updateZoom();
      }, 50);
    })();
  },
};
