document.addEventListener("DOMContentLoaded", () => {
  let STATE = JSON.parse(JSON.stringify(window.Config.DEFAULT_STATE));
  const form = document.getElementById("label-form");
  const appLangSelect = document.getElementById("app-lang");
  const newLabelBtn = document.getElementById("new-label-btn");
  const resetModal = document.getElementById("reset-modal");
  const closeResetBtn = document.getElementById("close-reset-btn");
  const cancelResetBtn = document.getElementById("cancel-reset-btn");
  const confirmResetBtn = document.getElementById("confirm-reset-btn");
  const responsiveModal = document.getElementById("responsive-modal");
  const closeResponsiveBtn = document.getElementById("close-responsive-btn");

  // Check screen width for responsive warning
  if (window.innerWidth < 769) {
    if (responsiveModal) responsiveModal.showModal();
  }

  if (closeResponsiveBtn && responsiveModal) {
    closeResponsiveBtn.addEventListener("click", () => {
      responsiveModal.close();
    });
  }

  // Initial state
  let hasStarted = false;
  let renderTimer = null;

  // Initialize submodules
  window.UI.init();
  window.Exporter.init();

  // Set UI translations initially
  window.I18nHelper.updateUI(STATE.appLang);
  appLangSelect.value = STATE.appLang;
  window.UI.syncCustomSelect("app-lang");

  // Populate form with default state
  function populateForm() {
    form.reset();
    for (const [key, val] of Object.entries(STATE)) {
      if (key === "seals") {
        for (const [sealKey, sealVal] of Object.entries(val)) {
          let sealName =
            sealKey === "caffeine" || sealKey === "sweeteners"
              ? `caution-${sealKey}`
              : `seal-${sealKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
          let el = form.querySelector(`[name="${sealName}"]`);
          if (el) el.checked = sealVal;
        }
        continue;
      }
      let el = form.querySelector(
        `[name="${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}"]`,
      );
      if (el) {
        if (el.type === "checkbox") {
          el.checked = val;
        } else {
          el.value = val;
        }

        // If it's a hidden select with a custom UI, sync it
        const targetIds = [
          "standard",
          "label-lang",
          "orientation",
          "rounding",
          "serving-size-unit",
          "app-lang",
          "vit-data-format",
          "vit-a-type",
          "vit-e-type",
        ];
        const id = el.id;
        if (targetIds.includes(id)) {
          window.UI.syncCustomSelect(id);
        }
      }
    }
    updateFormVisibility();
  }

  // Manage dynamic visibility
  function updateFormVisibility() {
    let isNom = STATE.standard === "nom051";
    let isFda = STATE.standard === "fda";
    let isEu = STATE.standard === "eu";
    let underConstruction = isNom || isEu;

    let sidebar = document.querySelector(".editor-sidebar");
    let previewToolbar = document.querySelector(".preview-toolbar");
    let placeholder = document.getElementById("initial-placeholder");
    let labelWrapper = document.getElementById("nutrition-label");

    if (!hasStarted) {
      if (newLabelBtn) newLabelBtn.classList.add("app-disabled");
      if (sidebar) sidebar.classList.add("app-disabled");
      if (previewToolbar) previewToolbar.classList.add("app-disabled");
      if (placeholder) placeholder.classList.remove("hidden");
      if (labelWrapper) {
        labelWrapper.style.display = "none";
        labelWrapper.classList.add("hidden");
      }
    } else {
      if (newLabelBtn) newLabelBtn.classList.remove("app-disabled");
      if (sidebar) sidebar.classList.remove("app-disabled");
      if (previewToolbar) previewToolbar.classList.remove("app-disabled");
      if (placeholder) placeholder.classList.add("hidden");

      const constructionView = document.getElementById("construction-view");
      const zoomControls = document.querySelector(".zoom-controls");
      const previewBtn = document.getElementById("preview-btn");
      const exportBtn = document.getElementById("export-btn");

      if (underConstruction) {
        if (labelWrapper) {
          labelWrapper.classList.add("hidden");
          labelWrapper.style.display = "none";
        }
        if (constructionView) constructionView.classList.remove("hidden");

        // Disable toolbar actions
        if (zoomControls) zoomControls.classList.add("app-disabled");
        if (previewBtn) previewBtn.classList.add("app-disabled");
        if (exportBtn) exportBtn.classList.add("app-disabled");

        // Hide/Disable other sections if under construction
        document.querySelectorAll(".form-section:not(.open)").forEach((s) => {
          if (
            !s.innerText.includes(
              window.I18nHelper.get(STATE.appLang, "ui.sectionBasic"),
            )
          ) {
            s.classList.add("app-disabled");
          }
        });

        // Also disable specific standard settings within basic config
        // like language and orientation
        const langGroup = document
          .querySelector('[data-target="label-lang"]')
          ?.closest(".form-group");
        const oriGroup = document
          .querySelector('[data-target="orientation"]')
          ?.closest(".form-group");
        if (langGroup) langGroup.classList.add("app-disabled");
        if (oriGroup) oriGroup.classList.add("app-disabled");
      } else {
        if (labelWrapper) {
          labelWrapper.classList.remove("hidden");
          labelWrapper.style.display = "";
        }
        if (constructionView) constructionView.classList.add("hidden");

        // Restore toolbar
        if (zoomControls) zoomControls.classList.remove("app-disabled");
        if (previewBtn) previewBtn.classList.remove("app-disabled");
        if (exportBtn) exportBtn.classList.remove("app-disabled");

        // Restore all sections
        document
          .querySelectorAll(".form-section")
          .forEach((s) => s.classList.remove("app-disabled"));

        // Restore language and orientation
        const langGroup = document
          .querySelector('[data-target="label-lang"]')
          ?.closest(".form-group");
        const oriGroup = document
          .querySelector('[data-target="orientation"]')
          ?.closest(".form-group");
        if (langGroup) langGroup.classList.remove("app-disabled");
        if (oriGroup) oriGroup.classList.remove("app-disabled");
      }
    }

    document
      .querySelectorAll(".nom-only")
      .forEach((el) => el.classList.toggle("hidden", !isNom));

    // Show/hide manual seals container based on auto-calculate checkbox
    const manualSealsContainer = document.getElementById(
      "manual-seals-container",
    );
    if (manualSealsContainer) {
      manualSealsContainer.classList.toggle(
        "hidden",
        !!STATE.autoCalculateSeals,
      );
    }

    document
      .querySelectorAll(".fda-only")
      .forEach((el) =>
        el.classList.toggle("hidden", !isFda || underConstruction),
      );

    // Hide standard-specific content when under construction
    document.querySelectorAll(".form-section:not(.open)").forEach((el) => {
      if (underConstruction) {
        // If not basic config, hide it?
        // Actually, let's just make it look disabled.
      }
    });

    // Handle standard-specific orientation options
    document.querySelectorAll("[data-std]").forEach((el) => {
      const allowed = el.getAttribute("data-std").split(" ");
      el.classList.toggle("hidden", !allowed.includes(STATE.standard));
    });

    // NOM and EU logic commented out as requested
    /*
    if (isNom && !STATE.orientation.startsWith("nom-")) {
      ...
    }
    */

    // Hide seals config if 'nom-no-seals' is selected
    if (isNom) {
      const sealsConfig = document.querySelector(".nom-only.form-group");
      if (sealsConfig) {
        sealsConfig.classList.toggle(
          "hidden",
          STATE.orientation === "nom-no-seals",
        );
      }
    }

    // Show FDA footer toggle only for tabular and linear as requested
    document.querySelectorAll(".fda-footer-toggle").forEach((el) => {
      let isAllowed =
        STATE.orientation === "vertical" ||
        STATE.orientation === "tabular" ||
        STATE.orientation === "linear";
      el.classList.toggle("hidden", !isFda || !isAllowed);
    });

    // Update validation
    window.Validator.updateUI(STATE);

    // Free serving size toggle
    let freeContainer = document.getElementById("free-serving-size-container");
    if (freeContainer) {
      freeContainer.classList.toggle("hidden", !STATE.useFreeServingSize);
    }

    // Optional Vitamins toggle
    let optionalVitsContainer = document.getElementById(
      "optional-vitamins-container",
    );
    if (optionalVitsContainer) {
      optionalVitsContainer.classList.toggle(
        "hidden",
        !STATE.showOptionalVitamins,
      );
    }

    // Update Vitamin Labels based on format
    const format = STATE.vitDataFormat;
    const vitUnits = {
      vitD: "mcg",
      calcium: "mg",
      iron: "mg",
      potassium: "mg",
      vitA: "mcg",
      vitC: "mg",
      vitE: "mg",
      vitK: "mcg",
      thiamin: "mg",
      riboflavin: "mg",
      niacin: "mg",
      vitB6: "mg",
      folate: "mcg",
      folicAcid: "mcg",
      vitB12: "mcg",
      biotin: "mcg",
      pantothenicAcid: "mg",
      phosphorus: "mg",
      iodine: "mcg",
      magnesium: "mg",
      zinc: "mg",
      selenium: "mcg",
      copper: "mg",
      manganese: "mg",
      chromium: "mcg",
      molybdenum: "mcg",
      chloride: "mg",
    };

    for (const [key, unit] of Object.entries(vitUnits)) {
      const dashKey = key.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      );
      const labelEl = document.getElementById(`label-${dashKey}`);
      if (labelEl) {
        const unitSpan = labelEl.querySelector(".vit-unit");
        if (unitSpan) {
          unitSpan.textContent = format === "percentage" ? "(%)" : `(${unit})`;
        }
      }
    }

    // Auto Kj toggler
    let kjInput = document.getElementById("kj");
    if (kjInput && isEu) {
      kjInput.disabled = STATE.autoKj;
      if (STATE.autoKj) {
        kjInput.value = window.Calc.calculateKj(STATE.calories);
      }
    }
  }

  // Sync UI changes back to state object
  function mutateState(name, val, isCheckbox) {
    // Convert dash-case to camelCase
    let stateKey = name.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

    if (name.startsWith("seal-") || name.startsWith("caution-")) {
      let key = stateKey.replace("seal", "").replace("caution", "");
      key = key.charAt(0).toLowerCase() + key.slice(1);
      if (!STATE.seals) STATE.seals = {};
      STATE.seals[key] = val;
      return;
    }

    if (name === "auto-calculate-seals") {
      STATE.autoCalculateSeals = val;
      return;
    }

    STATE[stateKey] = val;
  }

  // Listen to all changes in the form
  form.addEventListener("input", (e) => {
    let target = e.target;
    let isCheckbox = target.type === "checkbox";
    let val = isCheckbox ? target.checked : target.value;

    mutateState(target.name, val, isCheckbox);

    // Dynamic auto-toggle for FDA footer based on orientation change
    if (target.name === "orientation") {
      if (val === "linear") {
        STATE.showFdaFooter = false;
      } else if (val === "vertical" || val === "tabular") {
        STATE.showFdaFooter = true;
      }
      const footerCb = document.getElementById("show-fda-footer");
      if (footerCb) footerCb.checked = STATE.showFdaFooter;
    }

    updateFormVisibility();

    // Render with slight debounce for performance on number inputs
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      window.Renderer.render(STATE, document.getElementById("nutrition-label"));
    }, 50);
  });

  // Handle App UI Language Change globally
  appLangSelect.addEventListener("change", (e) => {
    STATE.appLang = e.target.value;
    window.I18nHelper.updateUI(STATE.appLang);
    window.UI.syncCustomSelect("app-lang");

    // Force FDA standard if somehow changed (extra safety)
    STATE.standard = "fda";
  });

  // New Label Logic
  if (newLabelBtn && resetModal) {
    newLabelBtn.addEventListener("click", () => {
      resetModal.showModal();
    });

    const closeModals = [closeResetBtn, cancelResetBtn];
    closeModals.forEach((btn) => {
      if (btn) btn.addEventListener("click", () => resetModal.close());
    });

    resetModal.addEventListener("click", (e) => {
      if (e.target === resetModal) resetModal.close();
    });

    if (confirmResetBtn) {
      confirmResetBtn.addEventListener("click", () => {
        STATE = getEmptyState(STATE);
        populateForm();
        window.Renderer.render(
          STATE,
          document.getElementById("nutrition-label"),
        );
        resetModal.close();
      });
    }
  }

  // Utility for empty state
  function getEmptyState(currentState) {
    let emptyState = JSON.parse(JSON.stringify(window.Config.DEFAULT_STATE));

    // Clear out numerical and text values
    [
      "calories",
      "kj",
      "totalFat",
      "satFat",
      "transFat",
      "polyFat",
      "monoFat",
      "cholesterol",
      "sodium",
      "totalCarbs",
      "dietaryFiber",
      "totalSugars",
      "addedSugars",
      "sugarAlcohol",
      "protein",
      "vitD",
      "calcium",
      "iron",
      "potassium",
      "rounding",
      "servingSizeQuantity",
      "servingSizeQuantityUnits",
      "servingSizeWeight",
      "servingSizeUnit",
    ].forEach((k) => {
      emptyState[k] = "";
    });
    emptyState.vitAType = "retinol";
    emptyState.vitEType = "rrr";
    emptyState.showProteinDv = false;
    emptyState.servingsPerContainer = "";
    emptyState.servingSize = "";

    // Clear seals
    for (let k in emptyState.seals) {
      emptyState.seals[k] = false;
    }

    // Keep settings
    emptyState.appLang = currentState.appLang || "es";
    emptyState.labelLang = currentState.labelLang || "es";
    emptyState.standard = "fda"; // Always FDA
    emptyState.orientation = currentState.orientation || "vertical";
    emptyState.dvStandard = "auto";

    // Defaults requested: "EEUU, en español, y vertical estándar"
    emptyState.standard = "fda";
    emptyState.orientation = "vertical";
    emptyState.labelLang = "es";
    emptyState.applyRounding = true;
    emptyState.autoCalculateSeals = true;

    return emptyState;
  }

  // Start Buttons Logic
  const startBlankBtn = document.getElementById("start-blank-btn");
  const startSampleBtn = document.getElementById("start-sample-btn");

  if (startBlankBtn) {
    startBlankBtn.addEventListener("click", () => {
      STATE = getEmptyState(STATE);
      hasStarted = true;
      populateForm();
      window.Renderer.render(STATE, document.getElementById("nutrition-label"));
    });
  }

  if (startSampleBtn) {
    startSampleBtn.addEventListener("click", () => {
      let sampleState = JSON.parse(JSON.stringify(window.Config.DEFAULT_STATE));
      // Defaults requested: "EEUU, en español, y vertical estándar"
      sampleState.standard = "fda";
      sampleState.orientation = "vertical";
      sampleState.labelLang = "es";
      STATE = sampleState;
      hasStarted = true;
      populateForm();
      window.Renderer.render(STATE, document.getElementById("nutrition-label"));
    });
  }

  // Force first render
  populateForm();
  window.Renderer.render(STATE, document.getElementById("nutrition-label"));
});
