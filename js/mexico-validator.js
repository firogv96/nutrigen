window.MexicoValidator = {
  validate: function (state) {
    let warnings = [];
    const t = (key) => window.I18nHelper.get(state.appLang, key);

    // 1. Mandatory Nutrients (4.2.9)
    const mandatory = [
      { key: "calories", label: t("lbl.nom.energy") },
      { key: "protein", label: t("lbl.nom.proteins") },
      { key: "totalFat", label: t("lbl.nom.totalFat") },
      { key: "satFat", label: t("lbl.nom.satFat") },
      { key: "transFat", label: t("lbl.nom.transFat") },
      { key: "totalCarbs", label: t("lbl.nom.carbs") },
      { key: "totalSugars", label: t("lbl.nom.sugars") },
      { key: "addedSugars", label: t("lbl.nom.addedSugars") },
      { key: "dietaryFiber", label: t("lbl.nom.fiber") },
      { key: "sodium", label: t("lbl.nom.sodium") },
    ];

    mandatory.forEach((m) => {
      if (state[m.key] === "" || state[m.key] === undefined) {
        warnings.push(
          state.appLang === "es"
            ? `El campo "${m.label}" es obligatorio según NOM-051.`
            : `Field "${m.label}" is mandatory per NOM-051.`,
        );
      }
    });

    // 2. Trans Fat Units (NOM-051 requires declaring milligrams if it's > 0?)
    // Actually NOM-051 usually declares energy in kcal/kJ and nutrients in g/mg.

    // 3. Logical checks
    if (Number(state.satFat) > Number(state.totalFat)) {
      warnings.push(
        state.appLang === "es"
          ? "La grasa saturada no puede ser mayor que la grasa total."
          : "Saturated fat cannot be greater than total fat.",
      );
    }

    if (Number(state.addedSugars) > Number(state.totalSugars)) {
      warnings.push(
        state.appLang === "es"
          ? "Los azúcares añadidos no pueden ser mayores que los azúcares totales."
          : "Added sugars cannot be greater than total sugars.",
      );
    }

    // 4. Automatic Seals Verification
    if (state.autoCalculateSeals) {
      // No warnings needed for seals if they are auto-calculated
    } else {
      // If manual, maybe warn if seals don't match data?
      // (Standard requires they MATCH the data)
      const dataTo100 = window.MexicoRenderer._normalizeTo100(state);
      const calculated = window.MexicoCalc.calculateSeals(dataTo100);

      ["calories", "sugars", "satFat", "transFat", "sodium"].forEach((s) => {
        if (calculated[s] && !state.seals[s]) {
          warnings.push(
            state.appLang === "es"
              ? `Falta el sello de "EXCESO ${s.toUpperCase()}" según los datos declarados.`
              : `Missing "EXCESO ${s.toUpperCase()}" seal based on declared data.`,
          );
        }
      });

      if (calculated.caffeine && !state.cautionCaffeine) {
        warnings.push(
          state.appLang === "es"
            ? "Falta la leyenda precautoria de CAFEÍNA."
            : "Missing CAFFEINE precautionary legend.",
        );
      }

      if (calculated.sweeteners && !state.cautionSweeteners) {
        warnings.push(
          state.appLang === "es"
            ? "Falta la leyenda precautoria de EDULCORANTES."
            : "Missing SWEETENERS precautionary legend.",
        );
      }
    }

    return warnings;
  },
};
