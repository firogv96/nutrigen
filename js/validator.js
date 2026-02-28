window.Validator = {
  validate: function (state) {
    let warnings = [];
    const isFda = state.standard === "fda";
    const isNom = state.standard === "nom051";
    const isEu = state.standard === "eu";
    const lang = state.appLang;

    if (isFda) {
      // 1. Check Serving Size
      if (!state.servingSizeQuantity && !state.useFreeServingSize) {
        warnings.push(
          lang === "es"
            ? "Falta cantidad en tamaño de porción."
            : "Serving size quantity is missing.",
        );
      }
      if (!state.servingSizeWeight && !state.useFreeServingSize) {
        warnings.push(
          lang === "es"
            ? "Falta peso/volumen en tamaño de porción."
            : "Serving size weight/volume is missing.",
        );
      }

      // 2. Logical consistency
      if (Number(state.satFat) > Number(state.totalFat)) {
        warnings.push(
          lang === "es"
            ? "La grasa saturada no puede ser mayor que la grasa total."
            : "Saturated fat cannot be greater than total fat.",
        );
      }
      if (Number(state.addedSugars) > Number(state.totalSugars)) {
        warnings.push(
          lang === "es"
            ? "Los azúcares añadidos no pueden ser mayores que los azúcares totales."
            : "Added sugars cannot be greater than total sugars.",
        );
      }

      // 3. Calories vs Macros (approximate check)
      let calcCals =
        Number(state.totalFat) * 9 +
        Number(state.totalCarbs) * 4 +
        Number(state.protein) * 4;
      if (
        state.calories > 0 &&
        Math.abs(state.calories - calcCals) > state.calories * 0.2
      ) {
        warnings.push(
          lang === "es"
            ? "Las calorías declaradas difieren significativamente de las calculadas por los macronutrientes."
            : "Declared calories differ significantly from macronutrients calculation.",
        );
      }

      // 4. Mandatory vitamins for 2016 FDA
      if (state.vitD === "" || state.vitD === undefined) {
        warnings.push(
          lang === "es"
            ? "La Vitamina D es obligatoria en el estándar FDA 2016."
            : "Vitamin D is mandatory in the FDA 2016 standard.",
        );
      }
      if (state.calcium === "" || state.calcium === undefined) {
        warnings.push(
          lang === "es"
            ? "El Calcio es obligatorio en el estándar FDA 2016."
            : "Calcium is mandatory in the FDA 2016 standard.",
        );
      }
      if (state.iron === "" || state.iron === undefined) {
        warnings.push(
          lang === "es"
            ? "El Hierro es obligatorio en el estándar FDA 2016."
            : "Iron is mandatory in the FDA 2016 standard.",
        );
      }
      if (state.potassium === "" || state.potassium === undefined) {
        warnings.push(
          lang === "es"
            ? "El Potasio es obligatorio en el estándar FDA 2016."
            : "Potassium is mandatory in the FDA 2016 standard.",
        );
      }
    }

    if (isNom) {
      warnings = warnings.concat(window.MexicoValidator.validate(state));
    }

    return warnings;
  },

  updateUI: function (state) {
    const listEl = document.getElementById("validation-list");
    const panelEl = document.getElementById("validation-panel");
    if (!listEl || !panelEl) return;

    let warnings = this.validate(state);

    if (warnings.length > 0) {
      listEl.innerHTML = warnings.map((w) => `<li>${w}</li>`).join("");
      panelEl.classList.remove("hidden");
    } else {
      panelEl.classList.add("hidden");
    }
  },
};
