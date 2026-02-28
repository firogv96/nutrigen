window.Renderer = {
  render: function (state, containerEl) {
    if (!containerEl) return;

    containerEl.innerHTML = "";
    containerEl.className = "label-wrapper";

    switch (state.standard) {
      case "fda":
        containerEl.classList.add("fda-standard", state.orientation);
        containerEl.innerHTML = this._buildFda(state);
        break;
      default:
        containerEl.innerHTML = "";
        containerEl.classList.add("hidden");
        break;
    }
  },

  _t: function (state, key) {
    return window.I18nHelper.get(state.labelLang, key);
  },

  _formatServings: function (state) {
    let prefix = "";
    if (state.rounding === "varied")
      prefix = this._t(state, "lbl.fda.rounding.varied") + " ";
    if (state.rounding === "usually")
      prefix = this._t(state, "lbl.fda.rounding.usually") + " ";

    if (state.rounding === "varied" && state.servingsPerContainer) {
      return `${prefix}(${state.servingsPerContainer}) ${this._t(state, "lbl.fda.servings")}`;
    }

    return `${prefix}${state.servingsPerContainer} ${this._t(state, "lbl.fda.servings")}`;
  },

  _formatServingSize: function (state) {
    if (
      state.useFreeServingSize &&
      state.servingSize &&
      state.servingSize.trim() !== ""
    ) {
      return state.servingSize;
    }

    let quantity = state.servingSizeQuantity || "";
    let units = state.servingSizeQuantityUnits || "";
    let weight = state.servingSizeWeight || "";
    let unit = state.servingSizeUnit || "g";

    let text = `${quantity} ${units}`.trim();
    if (weight) {
      text += ` (${weight}${unit})`;
    }
    return text;
  },

  _getVitaminList: function () {
    return [
      { key: "vitD", unit: "mcg", labelKey: "ui.vitD" },
      { key: "calcium", unit: "mg", labelKey: "ui.calcium" },
      { key: "iron", unit: "mg", labelKey: "ui.iron" },
      { key: "potassium", unit: "mg", labelKey: "ui.potassium" },
      { key: "vitA", unit: "mcg", labelKey: "ui.vitA" },
      { key: "vitC", unit: "mg", labelKey: "ui.vitC" },
      { key: "vitE", unit: "mg", labelKey: "ui.vitE" },
      { key: "vitK", unit: "mcg", labelKey: "ui.vitK" },
      { key: "thiamin", unit: "mg", labelKey: "ui.thiamin" },
      { key: "riboflavin", unit: "mg", labelKey: "ui.riboflavin" },
      { key: "niacin", unit: "mg", labelKey: "ui.niacin" },
      { key: "vitB6", unit: "mg", labelKey: "ui.vitB6" },
      { key: "folate", unit: "mcg", labelKey: "ui.folate" },
      { key: "folicAcid", unit: "mcg", labelKey: "ui.folicAcid" },
      { key: "vitB12", unit: "mcg", labelKey: "ui.vitB12" },
      { key: "biotin", unit: "mcg", labelKey: "ui.biotin" },
      { key: "pantothenicAcid", unit: "mg", labelKey: "ui.pantothenicAcid" },
      { key: "phosphorus", unit: "mg", labelKey: "ui.phosphorus" },
      { key: "iodine", unit: "mcg", labelKey: "ui.iodine" },
      { key: "magnesium", unit: "mg", labelKey: "ui.magnesium" },
      { key: "zinc", unit: "mg", labelKey: "ui.zinc" },
      { key: "selenium", unit: "mcg", labelKey: "ui.selenium" },
      { key: "copper", unit: "mg", labelKey: "ui.copper" },
      { key: "manganese", unit: "mg", labelKey: "ui.manganese" },
      { key: "chromium", unit: "mcg", labelKey: "ui.chromium" },
      { key: "molybdenum", unit: "mcg", labelKey: "ui.molybdenum" },
      { key: "chloride", unit: "mg", labelKey: "ui.chloride" },
    ];
  },

  _makeVitMinerals: function (state, vKey, label, val, unit, ref) {
    if (state.standard === "fda") {
      // For FDA we always show mandatory (D, Calcium, Iron, Potassium)
      // even if zero? Actually 101.9 says they MUST be declared unless they are zero.
      // If they are zero, certain simplified formats allow omitting.
      const mandatory = ["vitD", "calcium", "iron", "potassium"];
      if (
        !mandatory.includes(vKey) &&
        (val === "" || val === undefined || isNaN(val) || val == 0)
      )
        return "";
      if (
        mandatory.includes(vKey) &&
        (val === "" || val === undefined || isNaN(val))
      )
        val = 0;

      let c = window.Calc;
      let displayLabel = label;
      let factor = 1;

      if (vKey === "vitA") {
        if (state.vitAType === "beta-carotene") {
          displayLabel = `${label} (${this._t(state, "ui.vitABetaCarotene")})`;
          factor = 0.5;
        } else {
          displayLabel = `${label} (${this._t(state, "ui.vitARetinol")})`;
        }
      } else if (vKey === "vitE") {
        if (state.vitEType === "all-rac") {
          displayLabel = `${label} (${this._t(state, "ui.vitEallRac")})`;
          factor = 0.45;
        } else {
          displayLabel = `${label} (${this._t(state, "ui.vitErrr")})`;
        }
      }

      let amt, p;
      if (state.vitDataFormat === "percentage") {
        p = val;
        // Reverse calc amount if needed for display
        amt = ref ? Math.round(((val * ref) / 100) * 10) / 10 : 0;
      } else {
        amt = val;
        let effectiveAmt = val * factor;
        p = ref ? c.percentage(effectiveAmt, ref) : 0;
      }

      return `
                <div class="fda-vit-line">
                    <span class="fda-vit-label">${displayLabel}</span>
                    <span class="fda-vit-amount">${amt}${unit}</span>
                    <span class="fda-vit-dv">${p}%</span>
                </div>
            `;
    }

    // Default logic for other standards
    if (val === "" || val === undefined || isNaN(val) || val == 0) return "";
    let c = window.Calc;
    let p = ref ? c.percentage(val, ref) : 0;
    return `<span>${label} ${val}${unit} ${p}%&nbsp;&nbsp;</span>`;
  },

  _buildFda: function (state) {
    if (state.orientation === "tabular") return this._buildFdaTabular(state);
    if (state.orientation === "linear") return this._buildFdaLinear(state);

    // Standard Vertical
    let dv = window.Config.FDA_DV;
    let c = window.Calc;

    let header = `
            <div class="fda-title">${this._t(state, "lbl.fda.title")}</div>
            <div class="fda-serving-container">
                <div class="fda-servings">${this._formatServings(state)}</div>
                <div class="fda-size">
                    <span>${this._t(state, "lbl.fda.servingSize")}</span>
                    <span>${this._formatServingSize(state)}</span>
                </div>
            </div>
            <div class="fda-calories-container">
                <div>
                    <div class="fw-900" style="font-size: 10pt; line-height: 1.5;">${this._t(state, "lbl.fda.amountPerServing")}</div>
                    <div class="fda-calories-label">${this._t(state, "lbl.fda.calories")}</div>
                </div>
                <div class="fda-calories-amount">${state.applyRounding ? c.roundFda("calories", state.calories) : state.calories}</div>
            </div>
            <div class="fda-dv-header">${this._t(state, "lbl.fda.dv")}</div>
        `;

    let makeLine = (
      id,
      label,
      rawAmt,
      unit,
      ref,
      isSub = false,
      thick = false,
      isBoldAmt = false,
      isDeepSub = false,
    ) => {
      if (rawAmt === "" || rawAmt === undefined || isNaN(rawAmt)) {
        // Check if mandatory
        const mandatory = [
          "totalFat",
          "cholesterol",
          "sodium",
          "totalCarbs",
          "dietaryFiber",
          "totalSugars",
          "addedSugars",
          "protein",
        ];
        if (mandatory.includes(id)) rawAmt = 0;
        else return ""; // Optional
      }

      let amt = c.roundFda(id, rawAmt);
      let p = ref ? c.percentage(rawAmt, ref) : null;

      // Special rules for specific display
      let displayLabel = label;
      let dvText = p !== null ? `<span class="fw-900">${p}%</span>` : "";
      let valText = isBoldAmt
        ? `<span class="fw-900">${amt}${unit}</span>`
        : `${amt}${unit}`;

      // Indentation and Bolding per FDA 2016
      let classes = ["fda-nutrient-line"];
      if (isSub) classes.push("sub");
      if (isDeepSub) classes.push("deep-sub");
      if (thick) classes.push("thick-border");

      let labelClass = isSub || isDeepSub ? "" : "fw-900";
      // "Includes" line is a bit special
      if (isDeepSub && label.includes(this._t(state, "lbl.fda.includes"))) {
        labelClass = "";
        valText = `${amt}${unit}`; // Value is not bold here usually
      }

      return `
                <div class="${classes.join(" ")}">
                    <div><span class="${labelClass}">${displayLabel}</span>${isDeepSub ? "" : " " + valText}</div>
                    <div>${dvText}</div>
                </div>
            `;
    };

    let nutrients = `
            ${makeLine("totalFat", this._t(state, "lbl.fda.totalFat"), state.totalFat, "g", dv.totalFat)}
            ${makeLine("satFat", this._t(state, "lbl.fda.satFat"), state.satFat, "g", dv.satFat, true)}
            ${makeLine("transFat", this._t(state, "lbl.fda.transFat"), state.transFat, "g", null, true)}
            ${state.polyFat > 0 ? makeLine("polyFat", this._t(state, "lbl.fda.polyFat"), state.polyFat, "g", null, true) : ""}
            ${state.monoFat > 0 ? makeLine("monoFat", this._t(state, "lbl.fda.monoFat"), state.monoFat, "g", null, true) : ""}
            ${makeLine("cholesterol", this._t(state, "lbl.fda.cholesterol"), state.cholesterol, "mg", dv.cholesterol)}
            ${makeLine("sodium", this._t(state, "lbl.fda.sodium"), state.sodium, "mg", dv.sodium)}
            ${makeLine("totalCarbs", this._t(state, "lbl.fda.totalCarbs"), state.totalCarbs, "g", dv.totalCarbs)}
            ${makeLine("dietaryFiber", this._t(state, "lbl.fda.dietaryFiber"), state.dietaryFiber, "g", dv.dietaryFiber, true)}
            ${makeLine("totalSugars", this._t(state, "lbl.fda.totalSugars"), state.totalSugars, "g", null, true)}
            ${makeLine("addedSugars", `${this._t(state, "lbl.fda.includes")} ${c.roundFda("addedSugars", state.addedSugars)}g ${this._t(state, "lbl.fda.addedSugars")}`, state.addedSugars, "", dv.addedSugars, false, false, false, true)}
            ${state.sugarAlcohol > 0 ? makeLine("sugarAlcohol", this._t(state, "lbl.fda.sugarAlcohol"), state.sugarAlcohol, "g", null, true) : ""}
            ${makeLine("protein", this._t(state, "lbl.fda.protein"), state.protein, "g", state.showProteinDv ? dv.protein : null, false, true)}
            
            <div class="fda-vits-container">
                ${this._getVitaminList()
                  .map((v) =>
                    this._makeVitMinerals(
                      state,
                      v.key,
                      this._t(state, v.labelKey),
                      state[v.key],
                      v.unit,
                      dv[v.key],
                    ),
                  )
                  .join("")}
            </div>
        `;

    let footer = state.showFdaFooter
      ? `
            <div class="fda-info-text">
                ${this._t(state, "lbl.fda.footer")}
            </div>
        `
      : "";

    return header + nutrients + footer;
  },

  _buildFdaTabular: function (state) {
    let dv = window.Config.FDA_DV;
    let c = window.Calc;

    let makeLine = (
      id,
      label,
      rawAmt,
      unit,
      ref,
      isSub = false,
      isBoldAmt = false,
      isDeepSub = false,
    ) => {
      if (rawAmt === "" || rawAmt === undefined || isNaN(rawAmt)) {
        const mandatory = [
          "totalFat",
          "cholesterol",
          "sodium",
          "totalCarbs",
          "dietaryFiber",
          "totalSugars",
          "addedSugars",
          "protein",
        ];
        if (mandatory.includes(id)) rawAmt = 0;
        else return "";
      }

      let amt = c.roundFda(id, rawAmt);
      let p = ref ? c.percentage(rawAmt, ref) : null;
      let dvText = p !== null ? `<span class="fw-900">${p}%</span>` : "";
      let valText = isBoldAmt
        ? `<span class="fw-900">${amt}${unit}</span>`
        : `${amt}${unit}`;

      let classes = ["fda-nutrient-line-tab"];
      if (isSub) classes.push("sub");
      if (isDeepSub) classes.push("deep-sub");

      let labelClass = isSub || isDeepSub ? "" : "fw-900";
      if (isDeepSub && label.includes(this._t(state, "lbl.fda.includes"))) {
        labelClass = "";
        valText = `${amt}${unit}`;
      }

      return `
                <div class="${classes.join(" ")}">
                    <div class="label-and-amt"><span class="${labelClass}">${label}</span>${isDeepSub ? "" : " " + valText}</div>
                    <div class="dv-val">${dvText}</div>
                </div>
            `;
    };

    const col1 = `
            ${makeLine("totalFat", this._t(state, "lbl.fda.totalFat"), state.totalFat, "g", dv.totalFat)}
            ${makeLine("satFat", this._t(state, "lbl.fda.satFat"), state.satFat, "g", dv.satFat, true)}
            ${makeLine("transFat", this._t(state, "lbl.fda.transFat"), state.transFat, "g", null, true)}
            ${state.polyFat > 0 ? makeLine("polyFat", this._t(state, "lbl.fda.polyFat"), state.polyFat, "g", null, true) : ""}
            ${state.monoFat > 0 ? makeLine("monoFat", this._t(state, "lbl.fda.monoFat"), state.monoFat, "g", null, true) : ""}
            ${makeLine("cholesterol", this._t(state, "lbl.fda.cholesterol"), state.cholesterol, "mg", dv.cholesterol)}
            ${makeLine("sodium", this._t(state, "lbl.fda.sodium"), state.sodium, "mg", dv.sodium)}
        `;

    const col2 = `
            ${makeLine("totalCarbs", this._t(state, "lbl.fda.totalCarbs"), state.totalCarbs, "g", dv.totalCarbs)}
            ${makeLine("dietaryFiber", this._t(state, "lbl.fda.dietaryFiber"), state.dietaryFiber, "g", dv.dietaryFiber, true)}
            ${makeLine("totalSugars", this._t(state, "lbl.fda.totalSugars"), state.totalSugars, "g", null, true)}
            ${makeLine("addedSugars", `${this._t(state, "lbl.fda.includes")} ${c.roundFda("addedSugars", state.addedSugars)}g ${this._t(state, "lbl.fda.addedSugars")}`, state.addedSugars, "", dv.addedSugars, false, false, true)}
            ${state.sugarAlcohol > 0 ? makeLine("sugarAlcohol", this._t(state, "lbl.fda.sugarAlcohol"), state.sugarAlcohol, "g", null, true) : ""}
            ${makeLine("protein", this._t(state, "lbl.fda.protein"), state.protein, "g", state.showProteinDv ? dv.protein : null)}
        `;

    const vitsArr = this._getVitaminList()
      .map((v) => {
        const mandatory = ["vitD", "calcium", "iron", "potassium"];
        let val = state[v.key];
        if (
          !mandatory.includes(v.key) &&
          (val === "" || val === undefined || isNaN(val) || val == 0)
        )
          return null;
        if (
          mandatory.includes(v.key) &&
          (val === "" || val === undefined || isNaN(val))
        )
          val = 0;

        let p = dv[v.key] ? c.percentage(val, dv[v.key]) : 0;
        return `<span>${this._t(state, v.labelKey)} ${val}${v.unit} ${p}%</span>`;
      })
      .filter((x) => x !== null);

    // Group vitamins in rows of 4 for better spacing if many
    let vitsHtml = "";
    for (let i = 0; i < vitsArr.length; i += 4) {
      vitsHtml += `<div class="fda-tab-vits-row">${vitsArr.slice(i, i + 4).join(" &bull; ")}</div>`;
    }

    const baseWidth = state.showFdaFooter ? 800 : 700;
    const marginR = -(baseWidth * 0.2);

    return `
            <div class="fda-tabular-wrapper" style="width: ${baseWidth}px; transform: scaleX(0.8); transform-origin: left; margin-right: ${marginR}px;">
                <div class="fda-tab-main-row">
                    <!-- Column 1: Info (Title, Servings, Calories) -->
                    <div class="fda-tab-left-col">
                        <div class="fda-title">
                            ${this._t(state, "lbl.fda.title")}
                        </div>
                        <div class="fda-servings-container">
                            <div class="fda-servings">
                                ${this._formatServings(state)}
                            </div>
                            <div class="fda-size">
                                ${this._t(state, "lbl.fda.servingSize")}
                                ${this._formatServingSize(state)}
                            </div>
                        </div>
                        <div class="fda-calories-container">
                            <div class="fda-calories-label">
                                <span class="text-14p">
                                ${this._t(state, "lbl.fda.caloriesPerServing")}</span>
                            </div>
                            <div class="fda-calories-amount">
                                ${state.applyRounding ? c.roundFda("calories", state.calories) : state.calories}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Column 2: Nutrients and Vitamins (Middle) -->
                    <div class="fda-tab-middle-col">
                        <!-- Top Row: Nutrient Columns -->
                        <div class="fda-tab-nutrients-top-row">
                            <div class="fda-tab-nutrients-header">
                                <div class="nut-header-col">
                                    <span>${this._t(state, "lbl.fda.amountPerServing")}</span>
                                    <span>${this._t(state, "lbl.fda.dv")}</span>
                                </div>
                                <div class="nut-header-col">
                                    <span>${this._t(state, "lbl.fda.amountPerServing")}</span>
                                    <span>${this._t(state, "lbl.fda.dv")}</span>
                                </div>
                            </div>
                            <div class="fda-tab-nutrients-grid">
                                <div class="fda-tab-sub-col">${col1}</div>
                                <div class="fda-tab-sub-col">${col2}</div>
                            </div>
                        </div>
                        
                        <!-- Bottom Row: Vitamins -->
                        <div class="fda-tab-vits-bottom-row">
                            ${vitsHtml}
                        </div>
                    </div>
                    
                    ${
                      state.showFdaFooter
                        ? `
                    <!-- Column 3: Footnote (Right) -->
                    <div class="fda-tab-right-col">
                        <div class="fda-tab-footnote">${this._t(state, "lbl.fda.footer")}</div>
                    </div>
                    `
                        : ""
                    }
                </div>
            </div>
        `;
  },

  _buildFdaLinear: function (state) {
    let dv = window.Config.FDA_DV;
    let c = window.Calc;

    // Helper to abbreviate labels for linear format to save space and match standard
    const abbreviate = (key) => {
      const abbreviationsEn = {
        "lbl.fda.servings": "Servings",
        "lbl.fda.servingSize": "Serv. size",
        "lbl.fda.totalFat": "Total Fat",
        "lbl.fda.satFat": "Sat. Fat",
        "lbl.fda.cholesterol": "Cholest.",
        "lbl.fda.totalCarbs": "Total Carb.",
        "lbl.fda.dietaryFiber": "Fiber",
        "lbl.fda.potassium": "Potas.",
        "lbl.fda.includes": "Incl.",
        "ui.vitD": "Vit. D",
        "ui.calcium": "Calcium",
        "ui.iron": "Iron",
        "ui.potassium": "Potas.",
      };

      const abbreviationsEs = {
        "lbl.fda.servings": "Porciones",
        "lbl.fda.servingSize": "Tam. porción",
        "lbl.fda.totalFat": "Grasa Tot.",
        "lbl.fda.satFat": "Grasa Sat.",
        "lbl.fda.cholesterol": "Colest.",
        "lbl.fda.totalCarbs": "Carb. Tot.",
        "lbl.fda.dietaryFiber": "Fibra",
        "lbl.fda.potassium": "Potasio",
        "lbl.fda.includes": "Incl.",
        "ui.vitD": "Vit. D",
        "ui.calcium": "Calcio",
        "ui.iron": "Hierro",
        "ui.potassium": "Potasio",
      };

      const map = state.labelLang === "en" ? abbreviationsEn : abbreviationsEs;
      return map[key] || this._t(state, key);
    };

    let fmt = (id, labelKey, rawAmt, unit, ref, isBoldLabel = false) => {
      if (rawAmt === "" || rawAmt === undefined || isNaN(rawAmt)) {
        const mandatory = [
          "totalFat",
          "cholesterol",
          "sodium",
          "totalCarbs",
          "dietaryFiber",
          "totalSugars",
          "addedSugars",
          "protein",
        ];
        if (mandatory.includes(id)) rawAmt = 0;
        else return null;
      }
      let amt = c.roundFda(id, rawAmt);
      let p = ref ? c.percentage(rawAmt, ref) : null;
      let label = abbreviate(labelKey);

      let text = `<span class="${isBoldLabel ? "fw-900" : ""}">${label}</span> ${amt}${unit}`;
      if (p !== null) {
        text += ` <span class="no-bold">(${p}% DV)</span>`;
      }
      return text;
    };

    let makeNutrientsText = () => {
      let parts = [];

      // Major nutrients (often bold labels)
      parts.push(
        fmt(
          "totalFat",
          "lbl.fda.totalFat",
          state.totalFat,
          "g",
          dv.totalFat,
          true,
        ),
      );
      parts.push(fmt("satFat", "lbl.fda.satFat", state.satFat, "g", dv.satFat));
      parts.push(
        fmt("transFat", "lbl.fda.transFat", state.transFat, "g", null),
      );
      parts.push(
        fmt(
          "cholesterol",
          "lbl.fda.cholesterol",
          state.cholesterol,
          "mg",
          dv.cholesterol,
          true,
        ),
      );
      parts.push(
        fmt("sodium", "lbl.fda.sodium", state.sodium, "mg", dv.sodium, true),
      );
      parts.push(
        fmt(
          "totalCarbs",
          "lbl.fda.totalCarbs",
          state.totalCarbs,
          "g",
          dv.totalCarbs,
          true,
        ),
      );
      parts.push(
        fmt(
          "dietaryFiber",
          "lbl.fda.dietaryFiber",
          state.dietaryFiber,
          "g",
          dv.dietaryFiber,
        ),
      );

      // Sugars logic
      let tsAmt = c.roundFda("totalSugars", state.totalSugars);
      let asAmt = c.roundFda("addedSugars", state.addedSugars);
      let asP = c.percentage(state.addedSugars, dv.addedSugars);
      let sugarsText = `<span>${this._t(state, "lbl.fda.totalSugars")}</span> ${tsAmt}g`;
      sugarsText += ` (${abbreviate("lbl.fda.includes")} ${asAmt}g ${this._t(state, "lbl.fda.addedSugars")}, ${asP}% DV)`;
      parts.push(sugarsText);

      parts.push(
        fmt(
          "protein",
          "lbl.fda.protein",
          state.protein,
          "g",
          state.showProteinDv ? dv.protein : null,
          true,
        ),
      );

      // Vitamins (usually flow at the end)
      this._getVitaminList().forEach((v) => {
        const mandatory = ["vitD", "calcium", "iron", "potassium"];
        let val = state[v.key];
        if (
          !mandatory.includes(v.key) &&
          (val === "" || val === undefined || isNaN(val) || val == 0)
        )
          return;

        let p = dv[v.key] ? c.percentage(val, dv[v.key]) : 0;
        let vLabel = abbreviate(v.labelKey);
        parts.push(`<span>${vLabel}</span> (${p}% DV)`);
      });

      return parts.filter((p) => p !== null).join(", ");
    };

    const caloriesVal = state.applyRounding
      ? c.roundFda("calories", state.calories)
      : state.calories;

    // Simplificar servings para el modo lineal
    let servPrefix = "";
    if (state.rounding === "varied")
      servPrefix = this._t(state, "lbl.fda.rounding.varied") + " ";
    if (state.rounding === "usually")
      servPrefix = this._t(state, "lbl.fda.rounding.usually") + " ";
    let servingsVal =
      state.rounding === "varied"
        ? `(${state.servingsPerContainer})`
        : state.servingsPerContainer;

    return `
            <div class="fda-linear-text">
                <span class="linear-title">${this._t(state, "lbl.fda.title")}</span>
                <span class="linear-servings"><span>${abbreviate("lbl.fda.servings")}:</span> ${servPrefix}${servingsVal},</span>
                <span class="linear-size fw-900"><span>${abbreviate("lbl.fda.servingSize")}:</span> ${this._formatServingSize(state)},</span>
                <span class="linear-amount">${this._t(state, "lbl.fda.amountPerServing")}:</span>
                <span class="linear-calories fw-900">${this._t(state, "lbl.fda.calories")} ${caloriesVal},</span>
                ${makeNutrientsText()}.
                ${state.showFdaFooter ? `<div class="fda-info-text linear-footer">${this._t(state, "lbl.fda.footer")}</div>` : ""}
            </div>
        `;
  },

  _buildNom: function (state) {
    let sealsHTML = "";
    if (state.seals) {
      ["calories", "sugars", "satFat", "transFat", "sodium"].forEach((s) => {
        if (state.seals[s]) {
          const textMap = {
            calories: this._t(state, "lbl.nom.seal.cal"),
            sugars: this._t(state, "lbl.nom.seal.sug"),
            satFat: this._t(state, "lbl.nom.seal.sat"),
            transFat: this._t(state, "lbl.nom.seal.tra"),
            sodium: this._t(state, "lbl.nom.seal.sod"),
          };
          let st = textMap[s] || s;
          sealsHTML += `<div class="nom-seal">${st}<span>${this._t(state, "lbl.nom.seal.health")}</span></div>`;
        }
      });

      let cautionsHTML = "";
      if (state.seals.caffeine)
        cautionsHTML += `<div class="nom-caution">${this._t(state, "lbl.nom.cau.caf")}</div>`;
      if (state.seals.sweeteners)
        cautionsHTML += `<div class="nom-caution">${this._t(state, "lbl.nom.cau.sw")}</div>`;

      if (sealsHTML || cautionsHTML) {
        sealsHTML = `
                    <div class="nom-seals-container">
                        ${sealsHTML}
                    </div>
                    ${cautionsHTML}
                `;
      }
    }

    let makeLine = (name, val, isSub = false) => {
      if (val === "" || val === undefined || isNaN(val)) return "";
      return `
                <div class="nom-nutrient-group ${isSub ? "nom-sub" : ""}">
                    <span class="${isSub ? "" : "nom-nutrient-name"}">${name}</span>
                    <span class="nom-nutrient-val">${val}</span>
                </div>
            `;
    };

    return `
            ${sealsHTML}
            <div class="nom-title">${this._t(state, "lbl.nom.title")}</div>
            <div class="nom-servings">
                ${this._t(state, "lbl.nom.servings")} <span class="nom-per-container">${this._formatServings(state)}</span><br>
                ${this._t(state, "lbl.fda.servingSize")}: ${this._formatServingSize(state)}
            </div>
            
            <div class="nom-thick-border">
                <div class="nom-nutrient-group">
                    <span class="nom-nutrient-name">${this._t(state, "lbl.nom.energy")}</span>
                    <span></span>
                </div>
                ${makeLine(this._t(state, "lbl.nom.perContainer"), `${parseInt(state.calories) * (parseInt(state.servingsPerContainer) || 1)} kcal`, true)}
                ${makeLine(this._t(state, "lbl.nom.perServing"), `${state.calories} kcal`, true)}
            </div>
            
            <div style="font-weight: bold; margin-bottom: 5px;">${this._t(state, "lbl.nom.amount")}</div>
            
            ${makeLine(this._t(state, "lbl.nom.proteins"), `${state.protein} g`)}
            ${makeLine(this._t(state, "lbl.nom.totalFat"), `${state.totalFat} g`)}
            ${makeLine(this._t(state, "lbl.nom.satFat"), `${state.satFat} g`, true)}
            ${makeLine(this._t(state, "lbl.nom.transFat"), `${state.transFat} mg`, true)}
            ${makeLine(this._t(state, "lbl.fda.polyFat"), `${state.polyFat} g`, true)}
            ${makeLine(this._t(state, "lbl.fda.monoFat"), `${state.monoFat} g`, true)}
            ${makeLine(this._t(state, "lbl.nom.carbs"), `${state.totalCarbs} g`)}
            ${makeLine(this._t(state, "lbl.nom.sugars"), `${state.totalSugars} g`, true)}
            ${makeLine(this._t(state, "lbl.nom.addedSugars"), `${state.addedSugars} g`, true)}
            ${makeLine(this._t(state, "lbl.fda.sugarAlcohol"), `${state.sugarAlcohol} g`, true)}
            ${makeLine(this._t(state, "lbl.nom.fiber"), `${state.dietaryFiber} g`)}
            ${makeLine(this._t(state, "lbl.nom.sodium"), `${state.sodium} mg`)}
            ${this._getVitaminList()
              .map((v) => {
                let val = state[v.key];
                if (val === "" || val === undefined || isNaN(val) || val == 0)
                  return "";
                let amt;
                if (state.vitDataFormat === "percentage") {
                  let ref = window.Config.FDA_DV[v.key];
                  amt = ref ? Math.round(((val * ref) / 100) * 10) / 10 : 0;
                } else {
                  amt = val;
                }
                return makeLine(this._t(state, v.labelKey), `${amt} ${v.unit}`);
              })
              .join("")}
        `;
  },

  _buildEu: function (state) {
    let dv = window.Config.EU_RI;
    let c = window.Calc;

    let salt = c.sodiumToSalt(state.sodium);
    let kj = state.autoKj ? c.calculateKj(state.calories) : state.kj;

    let makeRow = (label, amount, unit) => {
      if (amount === "" || amount === undefined || isNaN(amount)) return "";
      return `
                <tr>
                    <td>${label}</td>
                    <td class="right">${amount}${unit}</td>
                </tr>
            `;
    };

    return `
            <div class="eu-title">${this._t(state, "lbl.eu.title")}</div>
            <table class="eu-table">
                <thead>
                    <tr>
                        <th>${this._t(state, "lbl.eu.typicalValues")}</th>
                        <th class="right">${this._t(state, "lbl.eu.per100")}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${this._t(state, "lbl.eu.energy")}</strong></td>
                        <td class="right">${kj} kJ / ${state.calories} kcal</td>
                    </tr>
                    ${makeRow(`<strong>${this._t(state, "lbl.eu.fat")}</strong>`, state.totalFat, "g")}
                    ${makeRow(`<span class="eu-sub">${this._t(state, "lbl.eu.ofWhichSaturates")}</span>`, state.satFat, "g")}
                    ${makeRow(`<span class="eu-sub">${this._t(state, "lbl.fda.polyFat")}</span>`, state.polyFat, "g")}
                    ${makeRow(`<span class="eu-sub">${this._t(state, "lbl.fda.monoFat")}</span>`, state.monoFat, "g")}
                    ${makeRow(`<strong>${this._t(state, "lbl.eu.carbs")}</strong>`, state.totalCarbs, "g")}
                    ${makeRow(`<span class="eu-sub">${this._t(state, "lbl.eu.ofWhichSugars")}</span>`, state.totalSugars, "g")}
                    ${makeRow(`<span class="eu-sub">${this._t(state, "lbl.fda.sugarAlcohol")}</span>`, state.sugarAlcohol, "g")}
                    ${makeRow(`<strong>${this._t(state, "lbl.eu.protein")}</strong>`, state.protein, "g")}
                    ${makeRow(`<strong>${this._t(state, "lbl.eu.salt")}</strong>`, salt, "g")}
                    ${this._getVitaminList()
                      .map((v) => {
                        let val = state[v.key];
                        if (
                          val === "" ||
                          val === undefined ||
                          isNaN(val) ||
                          val == 0
                        )
                          return "";
                        let amt;
                        if (state.vitDataFormat === "percentage") {
                          let ref = window.Config.FDA_DV[v.key];
                          amt = ref
                            ? Math.round(((val * ref) / 100) * 10) / 10
                            : 0;
                        } else {
                          amt = val;
                        }
                        return makeRow(this._t(state, v.labelKey), amt, v.unit);
                      })
                      .join("")}
                </tbody>
            </table>
            <div style="font-size: 11px; margin-top: 5px; color: #555;">
                ${this._t(state, "lbl.eu.footer")}
            </div>
        `;
  },
};
