window.MexicoRenderer = {
  render: function (state) {
    const t = (key) => window.I18nHelper.get(state.labelLang, key);

    // Calculate seals if the user has enabled automatic calculation OR if we want to show them based on data
    let seals = state.seals || {};
    if (state.autoCalculateSeals) {
      // Data normalized to 100g/ml
      const dataTo100 = this._normalizeTo100(state);
      seals = window.MexicoCalc.calculateSeals(dataTo100);
    }

    const showSeals = state.orientation !== "nom-no-seals";
    const sealsHtml = showSeals
      ? this._renderSeals(seals, t, state.smallPackage)
      : "";
    const tableHtml = this._renderTable(state, t);

    return `
            <div class="nom-container">
                <div class="nom-seals-header">
                    ${sealsHtml}
                </div>
                <div class="nom-table-wrapper">
                    ${tableHtml}
                </div>
            </div>
        `;
  },

  _normalizeTo100: function (state) {
    // Simple normalization if data is per serving
    // state assumed to be per serving if not specified,
    // but NOM-051 expects inputs in 100g for seals
    // We might need to adjust UI to ask for 100g data or calculate it.
    // For now, let's assume we have a "per 100g" state or
    // calculate it from serving size.

    let factor = 1;
    if (state.servingSizeWeight > 0) {
      factor = 100 / state.servingSizeWeight;
    }

    return {
      unit: state.servingSizeUnit || "g",
      calories: state.calories * factor,
      totalFat: state.totalFat * factor,
      satFat: state.satFat * factor,
      transFat: state.transFat * factor,
      totalSugars: state.totalSugars * factor,
      addedSugars: state.addedSugars * factor,
      sodium: state.sodium * factor,
      hasCaffeine: state.cautionCaffeine,
      hasSweeteners: state.cautionSweeteners,
    };
  },

  _renderSeals: function (seals, t, isSmall = false) {
    const order = ["calories", "sugars", "satFat", "transFat", "sodium"];
    let activeSeals = order.filter((s) => seals[s]);

    // Cautions (Caffeine/Sweeteners)
    let cautions = [];
    if (seals.caffeine) cautions.push(t("lbl.nom.cau.caf"));
    if (seals.sweeteners) cautions.push(t("lbl.nom.cau.sw"));

    if (activeSeals.length === 0 && cautions.length === 0) return "";

    let sealsHtml = "";

    if (isSmall && activeSeals.length > 0) {
      // Numerical seal for small packages (< 40cm2)
      sealsHtml = `
                <div class="nom-seal-block small-numerical">
                    <div class="nom-octagon">
                        <div class="octagon-content">
                            <span class="numero" style="font-size: 24px; display: block;">${activeSeals.length}</span>
                            <span class="nutriente" style="font-size: 9px; line-height: 1;">SELLO${activeSeals.length > 1 ? "S" : ""}</span>
                        </div>
                    </div>
                </div>
            `;
    } else {
      sealsHtml = activeSeals
        .map((s) => {
          const text = {
            calories: "CALORÍAS",
            sugars: "AZÚCARES",
            satFat: "GRASAS<br>SATURADAS",
            transFat: "GRASAS<br>TRANS",
            sodium: "SODIO",
          }[s];

          return `
                <div class="nom-seal-block">
                    <div class="nom-octagon">
                        <div class="octagon-content">
                            <span class="exceso">EXCESO</span>
                            <span class="nutriente">${text}</span>
                        </div>
                    </div>
                    <div class="nom-seal-label">SECRETARÍA DE SALUD</div>
                </div>
            `;
        })
        .join("");
    }

    let captionsHtml = cautions
      .map(
        (c) => `
            <div class="nom-caution-block">
                <div class="nom-caution-inner">
                    ${c}
                </div>
            </div>
        `,
      )
      .join("");

    return `
            <div class="nom-front-labels ${isSmall ? "small-pack" : ""}">
                <div class="nom-octagons-container">
                    ${sealsHtml}
                </div>
                <div class="nom-cautions-container">
                    ${captionsHtml}
                </div>
            </div>
        `;
  },

  _renderTable: function (state, t) {
    const isLiquid = state.servingSizeUnit === "ml";
    const per100Label = isLiquid ? "Por 100 ml" : "Por 100 g";

    const factor =
      state.servingSizeWeight > 0 ? 100 / state.servingSizeWeight : 1;

    const row = (
      label,
      valServing,
      unit = "g",
      isSub = false,
      isBold = false,
    ) => {
      if (valServing === "" || valServing === undefined || isNaN(valServing))
        return "";
      const val100 = (valServing * factor).toFixed(1).replace(".0", "");

      return `
                <tr class="${isSub ? "nom-row-sub" : ""} ${isBold ? "nom-row-bold" : ""}">
                    <td class="nom-col-label">${label}</td>
                    <td class="nom-col-val">${val100} ${unit}</td>
                </tr>
            `;
    };

    const energyRows = () => {
      const kcalS = Number(state.calories) || 0;
      const servings = Number(state.servingsPerContainer) || 0;

      const kcal100 = (kcalS * factor).toFixed(0);
      const kj100 = (kcal100 * 4.184).toFixed(0);

      const totalKcal = (kcalS * servings).toFixed(0);
      const totalKj = (totalKcal * 4.184).toFixed(0);

      let html = `
                <tr class="nom-row-bold nom-row-energy">
                    <td class="nom-col-label">Contenido energético</td>
                    <td class="nom-col-val">
                        <div>${kcal100} kcal</div>
                        <div class="nom-kj">(${kj100} kJ)</div>
                    </td>
                </tr>
             `;

      if (servings > 0) {
        html += `
                <tr class="nom-row-bold nom-row-energy">
                    <td class="nom-col-label">Contenido energético por envase</td>
                    <td class="nom-col-val">
                        <div>${totalKcal} kcal</div>
                        <div class="nom-kj">(${totalKj} kJ)</div>
                    </td>
                </tr>
          `;
      }
      return html;
    };

    return `
            <div class="nom-table-container">
                <div class="nom-table-header">
                    <div class="nom-table-title">Declaración nutrimental</div>
                    <div class="nom-table-header-unit">${per100Label}</div>
                </div>
                <div class="nom-table-black-bar"></div>
                <table class="nom-official-table">
                    <tbody>
                        ${energyRows()}
                        ${row("Proteína", state.protein)}
                        ${row("Grasas totales", state.totalFat, "g", false, true)}
                        ${row("Grasas saturadas", state.satFat, "g", true, true)}
                        ${row("Grasas trans", state.transFat, "mg", true, true)}
                        ${row("Hidratos de carbono disponibles", state.totalCarbs)}
                        ${row("Azúcares", state.totalSugars, "g", true, true)}
                        ${row("Azúcares añadidos", state.addedSugars, "g", true, true)}
                        ${row("Fibra dietética", state.dietaryFiber)}
                        ${row("Sodio", state.sodium, "mg", false, true)}
                        
                        <!-- Vitaminas opcionales -->
                        ${this._renderVitamins(state, factor, t)}
                    </tbody>
                </table>
                <div class="nom-table-footer">
                    ${state.ingredients ? `<div class="nom-ingredients"><strong>${t("ui.ingredients")}:</strong> ${state.ingredients}</div>` : ""}
                    ${state.allergens ? `<div class="nom-allergens">${state.allergens}</div>` : ""}
                </div>
            </div>
        `;
  },

  _renderVitamins: function (state, factor, t) {
    // NOM-051 allows optional nutrients if they are present in > 5% of VNR
    const vits = [
      { key: "vitD", unit: "mcg", label: t("ui.vitD") },
      { key: "calcium", unit: "mg", label: t("ui.calcium") },
      { key: "iron", unit: "mg", label: t("ui.iron") },
      // ... add more if needed
    ];

    return vits
      .map((v) => {
        const val = state[v.key];
        if (!val || val == 0) return "";
        const val100 = (val * factor).toFixed(1).replace(".0", "");
        return `
                <tr class="nom-row-vit">
                    <td class="nom-col-label">${v.label}</td>
                    <td class="nom-col-100">${val100} ${v.unit}</td>
                    <td class="nom-col-serving">${val} ${v.unit}</td>
                </tr>
            `;
      })
      .join("");
  },
};
