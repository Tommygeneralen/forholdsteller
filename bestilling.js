"use strict";

// Dette er enkel klientbeskyttelse, ikke ekte sikkerhet.
const LOGIN_STORAGE_KEY = "siteLoginGranted";
const LOGIN_STORAGE_VALUE = "granted";
const ORDER_LOCK_REDIRECT = "index.html";
const FORM_ENDPOINT = "https://formspree.io/f/xvzllqby";

(function initOrderPage() {
  if (!hasLoginAccess()) {
    window.location.replace(ORDER_LOCK_REDIRECT);
    return;
  }

  const elements = {
    form: document.getElementById("order-request-form"),
    firstName: document.getElementById("fornavn"),
    date: document.getElementById("dato"),
    time: document.getElementById("klokkeslett"),
    preview: document.getElementById("selection-preview"),
    formStatus: document.getElementById("form-status"),
    submitButton: document.getElementById("submit-order-button"),
    selectedServicesField: document.getElementById("selected-services-field"),
    selectedDetailsField: document.getElementById("selected-details-field"),
    orderSummaryField: document.getElementById("order-summary-field"),
    serviceCards: Array.from(document.querySelectorAll("[data-service-card]")),
    serviceInputs: Array.from(document.querySelectorAll('input[name="services[]"]'))
  };

  if (!elements.form) {
    return;
  }

  lockFormEndpoint(elements.form);
  setDateMinimum(elements.date);
  setupRequiredValidation(elements);

  elements.form.addEventListener("change", () => {
    syncServiceCards(elements.serviceCards);
    updateChoiceChipStates();
    refreshSelectionState(elements);
    syncValidationState(elements);
  });

  elements.form.addEventListener("input", () => {
    syncValidationState(elements);
  });

  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideStatus(elements.formStatus);
    syncValidationState(elements);

    if (!elements.form.reportValidity()) {
      return;
    }

    const selections = buildSelections();

    if (selections.length === 0) {
      showStatus(elements.formStatus, "Velg minst en tjeneste eller meny f\u00F8r du sender bestillingen.", "error");
      return;
    }

    populateHiddenFields(elements, selections);
    setSubmitState(elements.submitButton, true);

    try {
      const formData = new FormData(elements.form);
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      elements.form.reset();
      syncServiceCards(elements.serviceCards);
      updateChoiceChipStates();
      refreshSelectionState(elements);
      syncValidationState(elements);
      showStatus(elements.formStatus, "Bestillingen er sendt \u2764\uFE0F", "success");
    } catch (error) {
      showStatus(elements.formStatus, "Kunne ikke sende bestillingen akkurat n\u00E5. Pr\u00F8v igjen senere.", "error");
    } finally {
      setSubmitState(elements.submitButton, false);
    }
  });

  setSubmitState(elements.submitButton, false);
  syncServiceCards(elements.serviceCards);
  updateChoiceChipStates();
  refreshSelectionState(elements);
  syncValidationState(elements);
})();

function hasLoginAccess() {
  try {
    return window.sessionStorage.getItem(LOGIN_STORAGE_KEY) === LOGIN_STORAGE_VALUE;
  } catch (error) {
    return false;
  }
}

function lockFormEndpoint(form) {
  form.action = FORM_ENDPOINT;
  form.method = "POST";
}

function setDateMinimum(dateInput) {
  if (!dateInput) {
    return;
  }

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  dateInput.min = today.getFullYear() + "-" + month + "-" + day;
}

function setupRequiredValidation(elements) {
  attachRequiredValidation(elements.firstName, "Fornavn m\u00E5 fylles ut.");
  attachRequiredValidation(elements.date, "Dato m\u00E5 fylles ut.");
  attachRequiredValidation(elements.time, "Klokkeslett m\u00E5 fylles ut.");
}

function attachRequiredValidation(input, message) {
  if (!input) {
    return;
  }

  const update = () => {
    input.setCustomValidity(input.value.trim() ? "" : message);
  };

  input.addEventListener("input", update);
  input.addEventListener("change", update);
  update();
}

function syncValidationState(elements) {
  const hasSelectedService = elements.serviceInputs.some((input) => input.checked);
  const selectionMessage = hasSelectedService ? "" : "Velg minst en tjeneste eller meny.";

  elements.serviceInputs.forEach((input, index) => {
    input.setCustomValidity(index === 0 ? selectionMessage : "");
  });
}

function syncServiceCards(serviceCards) {
  serviceCards.forEach((card) => {
    const serviceToggle = card.querySelector('.service-toggle input[type="checkbox"]');
    const options = card.querySelector(".service-options");

    card.classList.toggle("is-selected", Boolean(serviceToggle && serviceToggle.checked));

    if (!serviceToggle || !options) {
      return;
    }

    const childInputs = Array.from(options.querySelectorAll("input"));
    options.hidden = !serviceToggle.checked;

    childInputs.forEach((input) => {
      if (!serviceToggle.checked) {
        input.checked = false;
      }

      input.disabled = !serviceToggle.checked;
    });
  });
}

function updateChoiceChipStates() {
  document.querySelectorAll(".choice-chip").forEach((chip) => {
    const input = chip.querySelector("input");

    if (!input) {
      return;
    }

    chip.classList.toggle("is-selected", input.checked);
    chip.classList.toggle("is-disabled", input.disabled);
  });
}

function refreshSelectionState(elements) {
  const selections = buildSelections();
  populateHiddenFields(elements, selections);
  renderPreview(elements.preview, selections);
}

function buildSelections() {
  const selections = [];

  if (isChecked("service-dinner")) {
    const dinnerMenus = getCheckedValues('input[name="dinner_menu[]"]');
    selections.push({
      label: "Middag hjemme",
      details: [
        "Meny: " + joinValuesOrFallback(dinnerMenus),
        "Kokken: " + valueOrFallback(getCheckedValue('input[name="cook_clothes"]')),
        "Dessert: " + valueOrFallback(getCheckedValue('input[name="dessert"]'))
      ]
    });
  }

  if (isChecked("service-cinema")) {
    selections.push({
      label: "Kino-date",
      details: []
    });
  }

  if (isChecked("service-massage")) {
    const massageTypes = getCheckedValues('input[name="massage_type[]"]');
    selections.push({
      label: "Massasje",
      details: [
        "Type massasje: " + joinValuesOrFallback(massageTypes),
        "Happy ending: " + valueOrFallback(getCheckedValue('input[name="happy_ending"]'))
      ]
    });
  }

  if (isChecked("service-breakfast")) {
    selections.push({
      label: "Frokost p\u00E5 senga",
      details: [
        "Kaffe: " + valueOrFallback(getCheckedValue('input[name="coffee"]'))
      ]
    });
  }

  if (isChecked("service-surprise")) {
    selections.push({
      label: "Overraskelse",
      details: []
    });
  }

  return selections;
}

function isChecked(id) {
  const input = document.getElementById(id);
  return Boolean(input && input.checked);
}

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked")).map((input) => input.value);
}

function getCheckedValue(selector) {
  const input = document.querySelector(selector + ":checked");
  return input ? input.value : "";
}

function joinValuesOrFallback(values) {
  return values.length > 0 ? values.join(", ") : "Ikke valgt";
}

function valueOrFallback(value) {
  return value || "Ikke valgt";
}

function populateHiddenFields(elements, selections) {
  const serviceNames = selections.map((selection) => selection.label);
  const detailLines = selections.flatMap((selection) => (
    selection.details.map((detail) => selection.label + " - " + detail)
  ));

  elements.selectedServicesField.value = serviceNames.join(", ");
  elements.selectedDetailsField.value = detailLines.join(" | ");
  elements.orderSummaryField.value = buildOrderSummary(elements, selections);
}

function buildOrderSummary(elements, selections) {
  const formValues = new FormData(elements.form);
  const serviceList = selections.length > 0
    ? selections.map((selection) => {
      const detailText = selection.details.length > 0 ? " (" + selection.details.join(" | ") + ")" : "";
      return selection.label + detailText;
    }).join(", ")
    : "Ingen tjenester valgt";

  return [
    "Fornavn: " + (formValues.get("fornavn") || ""),
    "Dato: " + (formValues.get("dato") || ""),
    "Klokkeslett: " + (formValues.get("klokkeslett") || ""),
    "Valgte tjenester: " + serviceList,
    "Ekstra melding: " + ((formValues.get("ekstra_melding") || "").trim() || "Ingen")
  ].join("\n");
}

function renderPreview(previewElement, selections) {
  previewElement.innerHTML = "";

  if (selections.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "summary-empty";
    emptyItem.textContent = "Ingen tjenester valgt enn\u00E5.";
    previewElement.appendChild(emptyItem);
    return;
  }

  selections.forEach((selection) => {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    const copy = document.createElement("p");

    heading.textContent = selection.label;
    copy.className = "summary-copy";
    copy.textContent = selection.details.length > 0 ? selection.details.join(" | ") : "Valgt.";

    item.appendChild(heading);
    item.appendChild(copy);
    previewElement.appendChild(item);
  });
}

function setSubmitState(button, isSubmitting) {
  if (!button) {
    return;
  }

  button.disabled = isSubmitting;
  button.textContent = isSubmitting ? "Sender..." : "Send bestilling";
}

function showStatus(element, message, type) {
  element.hidden = false;
  element.className = "status-message is-" + type;
  element.textContent = message;
}

function hideStatus(element) {
  element.hidden = true;
  element.textContent = "";
  element.className = "status-message";
}
