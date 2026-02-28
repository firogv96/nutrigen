window.MexicoCalc = {
  /**
   * Calculates which seals apply based on NOM-051 Modificación 2020 thresholds.
   * @param {Object} data - Nutrient data per 100g/100ml
   * @returns {Object} - Object with boolean flags for each seal
   */
  calculateSeals: function (data) {
    const isLiquid = data.unit === "ml";
    const calories = Number(data.calories) || 0;
    const totalFat = Number(data.totalFat) || 0;
    const satFat = Number(data.satFat) || 0;
    const transFat = Number(data.transFat) || 0; // expected in g for calculation
    const totalSugars = Number(data.totalSugars) || 0;
    const addedSugars = Number(data.addedSugars) || 0; // Used as proxy for "free sugars"
    const sodium = Number(data.sodium) || 0; // expected in mg

    const seals = {
      calories: false,
      sugars: false,
      satFat: false,
      transFat: false,
      sodium: false,
      caffeine: !!data.hasCaffeine,
      sweeteners: !!data.hasSweeteners,
    };

    // 1. Energy Seal (Exceso Calorías)
    if (!isLiquid) {
      if (calories >= 275) seals.calories = true;
    } else {
      // Liquids: >= 70 kcal total or >= 10 kcal from free sugars
      const kcalFromSugars = addedSugars * 4;
      if (calories >= 70 || kcalFromSugars >= 10) seals.calories = true;
    }

    // 2. Sugars Seal (Exceso Azúcares)
    // >= 10% of total energy from free sugars
    // Exception for beverages with < 10 kcal from free sugars: no seal
    const kcalFromFreeSugars = addedSugars * 4;
    if (calories > 0) {
      const pctSugars = (kcalFromFreeSugars / calories) * 100;
      if (pctSugars >= 10) {
        if (!isLiquid || kcalFromFreeSugars >= 10) {
          seals.sugars = true;
        }
      }
    }

    // 3. Saturated Fat Seal (Exceso Grasas Saturadas)
    // >= 10% of total energy
    const kcalFromSatFat = satFat * 9;
    if (calories > 0) {
      const pctSatFat = (kcalFromSatFat / calories) * 100;
      if (pctSatFat >= 10) seals.satFat = true;
    }

    // 4. Trans Fat Seal (Exceso Grasas Trans)
    // >= 1% of total energy
    const kcalFromTransFat = transFat * 9;
    if (calories > 0) {
      const pctTransFat = (kcalFromTransFat / calories) * 100;
      if (pctTransFat >= 1) seals.transFat = true;
    }

    // 5. Sodium Seal (Exceso Sodio)
    if (!isLiquid) {
      if (sodium >= 300) seals.sodium = true;
    } else {
      // Liquids: >= 45 mg if it has calories, otherwise >= 300 mg
      if (calories > 0) {
        if (sodium >= 45) seals.sodium = true;
      } else {
        if (sodium >= 300) seals.sodium = true;
      }
    }

    return seals;
  },
};
