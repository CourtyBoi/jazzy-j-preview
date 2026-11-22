// Mandatory feature-detected Popover polyfill for older browsers (navbar guide)
if (typeof HTMLElement !== "undefined" && !Object.hasOwn(HTMLElement.prototype, "popover")) {
  import("https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js").catch(() => {});
}

// Feature-detected focusgroup polyfill for tablists (tabs guide)
if (typeof HTMLElement !== "undefined" && !Object.hasOwn(HTMLElement.prototype, "focusGroup")) {
  import("https://esm.sh/@microsoft/focusgroup-polyfill")
    .then(({ polyfill }) => polyfill())
    .catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
  // 0. Responsive site-header measurement (navbar guide: inline when fits, popover when narrow)
  const siteHeader = document.querySelector(".site-header");
  const headerInner = siteHeader?.querySelector(".header-inner");
  const siteMenu = document.getElementById("site-menu");
  if (siteHeader && headerInner && siteMenu) {
    let lastWidth = 0;
    const syncNavLayout = () => {
      const currentWidth = siteHeader.clientWidth;
      const isCurrentlyWide = siteHeader.classList.contains("is-wide");
      if (!isCurrentlyWide && currentWidth <= lastWidth && lastWidth !== 0) {
        lastWidth = currentWidth;
        return;
      }
      lastWidth = currentWidth;
      const wasOpen = siteMenu.matches(":popover-open");
      siteHeader.classList.add("is-measuring", "is-wide");
      siteMenu.removeAttribute("popover");
      const fitsInline = headerInner.scrollWidth <= headerInner.clientWidth;
      if (!fitsInline) {
        siteHeader.classList.remove("is-wide");
        siteMenu.setAttribute("popover", "auto");
        if (wasOpen && typeof siteMenu.showPopover === "function") {
          try {
            siteMenu.showPopover();
          } catch {}
        }
      }
      requestAnimationFrame(() => siteHeader.classList.remove("is-measuring"));
    };
    const ro = new ResizeObserver(syncNavLayout);
    ro.observe(siteHeader);
    syncNavLayout();
  }

  // 1. Mandatory light-dismiss fallback for browsers without native <dialog closedby="any">
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }

    dialog.addEventListener("close", () => {
      dialog.returnValue = "";
    });
  }

  // 2. Open rewrite dialog buttons on Owner Preview page
  const rewriteDialog = document.getElementById("rewrite-dialog");
  const slotInput = document.getElementById("rewrite-slot-index");
  for (const btn of document.querySelectorAll("[data-open-rewrite]")) {
    btn.addEventListener("click", () => {
      if (!rewriteDialog) return;
      if (slotInput) {
        slotInput.value = btn.getAttribute("data-slot-index") || "";
      }
      rewriteDialog.showModal();
    });
  }

  const closeDialogBtn = document.getElementById("close-rewrite-dialog");
  if (closeDialogBtn && rewriteDialog) {
    closeDialogBtn.addEventListener("click", () => rewriteDialog.close());
  }

  // 3. Progressive AJAX handling for Batch Approval / Pause / Rewrite actions
  for (const form of document.querySelectorAll("form[data-batch-action-form]")) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const statusEl = document.getElementById("batch-status");
      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new FormData(form);
        const payload = {
          action: formData.get("action"),
          instruction: formData.get("instruction") || "",
          slot_index:
            formData.get("slot_index") !== "" && formData.get("slot_index") !== null
              ? Number(formData.get("slot_index"))
              : null,
        };
        const resp = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        if (rewriteDialog && rewriteDialog.open) {
          rewriteDialog.close();
        }
        if (statusEl) {
          statusEl.textContent = data.message || "Saved! Refreshing preview...";
        }
        setTimeout(() => window.location.reload(), 650);
      } catch {
        if (statusEl) {
          statusEl.textContent = "Could not reach server. Please try again.";
        }
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 4. Prevent double-post on Barber Photo Drop upload
  const uploadForm = document.getElementById("photo-drop-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", () => {
      if (!uploadForm.checkValidity()) return;
      const btn = uploadForm.querySelector('button[type="submit"]');
      const status = document.getElementById("upload-status");
      if (btn) btn.disabled = true;
      if (status) {
        status.textContent = "Uploading & enhancing photo for this week's lineup...";
      }
    });
  }

  // 5. Interactive Landing Page v2.0 Package, Earned-Ownership Website, HIPAA & TX Tax Calculator
  const quoteForm = document.getElementById("package-quote-form");
  if (quoteForm) {
    const tierPrices = { starter: 249, growth: 399, autopilot: 599 };
    const tierNames = {
      starter: "Foundation — Google Maps & Social Presence",
      growth: "Growth + Voice — Reviews, 24/7 AI Receptionist & Owned Website",
      autopilot: "Autopilot — Market Dominance & Reactivation Suite",
    };
    const tierChannels = { starter: 2, growth: 3, autopilot: 4 };
    const addonPrices = {
      ai_sync_care: { price: 59, type: "monthly", label: "AI Sync & Edge Cloud Care" },
      gbp_rescue: { price: 249, type: "one_time", label: "Pre-Flight GBP Audit & Ranking Overhaul" },
      post_boost: { price: 99, type: "monthly", label: "Automated Local Post & Carousel Boost" },
      ten_dlc_setup: { price: 49, type: "one_time", label: "Dedicated Local Line & US 10DLC Setup" },
    };
    const hipaaIndustries = new Set(["med_spa", "dental", "chiropractic", "orthodontics", "healthcare_clinic"]);
    const TX_EFFECTIVE_TAX_RATE = 0.066; // 80% Data Processing share * 8.25% Abilene combined rate

    const syncLegacyHasFallback = () => {
      if (typeof CSS !== "undefined" && !CSS.supports("selector(:has(*))")) {
        for (const card of quoteForm.querySelectorAll(".choice-card, .radio-option")) {
          const inp = card.querySelector("input");
          if (inp) card.classList.toggle("is-active", inp.checked);
        }
        const cadenceBox = quoteForm.querySelector(".billing-cadence-box");
        const annualInp = document.getElementById("bill-annual");
        if (cadenceBox && annualInp) {
          cadenceBox.classList.toggle("is-active", annualInp.checked);
        }
      }
    };

    const recalcQuote = () => {
      const industryEl = document.getElementById("industry");
      const isHipaa = hipaaIndustries.has(industryEl?.value || "");
      const hipaaBanner = document.getElementById("hipaa-compliance-banner");
      if (hipaaBanner) hipaaBanner.hidden = !isHipaa;

      // Enforce Strict Zero-PHI HIPAA Guardrail on Autopilot radio
      const autopilotRadio = document.getElementById("tier-autopilot");
      const growthRadio = document.getElementById("tier-growth");
      if (autopilotRadio) {
        autopilotRadio.disabled = isHipaa;
        if (isHipaa && autopilotRadio.checked && growthRadio) {
          growthRadio.checked = true;
        }
      }

      const checkedTier = quoteForm.querySelector('input[name="tier_id"]:checked');
      const tierId = checkedTier ? checkedTier.value : "growth";

      // Foundation ($249) requires $999 upfront buyout if they want a new website
      const webVestedRadio = document.getElementById("web-vested");
      const webBuyoutRadio = document.getElementById("web-buyout");
      if (webVestedRadio) {
        const eligibleZeroDown = tierId !== "starter";
        webVestedRadio.disabled = !eligibleZeroDown;
        if (!eligibleZeroDown && webVestedRadio.checked && webBuyoutRadio) {
          webBuyoutRadio.checked = true;
        }
      }

      const checkedCadence = quoteForm.querySelector('input[name="billing_interval"]:checked');
      const isAnnual = checkedCadence?.value === "annual";
      const discountMult = isAnnual ? 0.85 : 1.0;

      const checkedWebMode = quoteForm.querySelector('input[name="website_mode"]:checked');
      const webMode = checkedWebMode ? checkedWebMode.value : "vested_zero_down";

      const extraChInput = document.getElementById("extra_channels");
      const nfcQtyInput = document.getElementById("nfc_stand_qty");
      const extraCh = Math.max(0, Number(extraChInput?.value || 0));
      const nfcQty = Math.max(0, Number(nfcQtyInput?.value || 0));

      const baseTierRate = Math.round((tierPrices[tierId] || 399) * discountMult * 100) / 100;
      let monthly = baseTierRate;
      let oneTime = 0;
      const lines = [
        {
          label: `${tierNames[tierId] || "Growth + Voice"}${isAnnual ? " (15% Annual Save)" : ""}`,
          val: `$${baseTierRate.toFixed(isAnnual ? 2 : 0)}/mo`,
        },
      ];

      if (webMode === "vested_zero_down") {
        lines.push({ label: "Earned-Ownership Website (Vests Mo. 12)", val: "$0 down" });
      } else if (webMode === "upfront_buyout") {
        oneTime += 999;
        lines.push({ label: "Conversion Website (Day-1 Buyout)", val: "$999 one-time" });
      }

      if (extraCh > 0) {
        const chCost = Math.round(extraCh * 20 * discountMult * 100) / 100;
        monthly += chCost;
        lines.push({ label: `Extra Social Channels (x${extraCh})`, val: `+$${chCost.toFixed(isAnnual ? 2 : 0)}/mo` });
      }
      for (const box of quoteForm.querySelectorAll('input[name="selected_addons"]:checked')) {
        const meta = addonPrices[box.value];
        if (!meta) continue;
        if (meta.type === "monthly") {
          const mRate = Math.round(meta.price * discountMult * 100) / 100;
          monthly += mRate;
          lines.push({ label: meta.label, val: `+$${mRate.toFixed(isAnnual ? 2 : 0)}/mo` });
        } else {
          oneTime += meta.price;
          lines.push({ label: meta.label, val: `$${meta.price} one-time` });
        }
      }
      if (nfcQty > 0) {
        oneTime += nfcQty * 35;
        lines.push({ label: `Acrylic Reception NFC/QR Stands (x${nfcQty})`, val: `$${nfcQty * 35} one-time` });
      }

      const preTaxDueToday = (isAnnual ? monthly * 12 : monthly) + oneTime;
      const txTaxDueToday = Math.round(preTaxDueToday * TX_EFFECTIVE_TAX_RATE * 100) / 100;
      const totalAtLaunch = preTaxDueToday + txTaxDueToday;

      const totalChannels = (tierChannels[tierId] || 3) + extraCh;
      const monthlyEl = document.getElementById("live-monthly-total");
      const oneTimeEl = document.getElementById("live-onetime-total");
      const taxEl = document.getElementById("live-tx-tax");
      const dueTodayEl = document.getElementById("live-due-today");
      const channelsEl = document.getElementById("live-total-channels");
      const itemizedEl = document.getElementById("live-itemized-list");

      if (monthlyEl) monthlyEl.textContent = `$${monthly.toFixed(isAnnual ? 2 : 0)}/mo`;
      if (oneTimeEl) oneTimeEl.textContent = `$${oneTime.toFixed(0)}`;
      if (taxEl) taxEl.textContent = `$${txTaxDueToday.toFixed(2)}`;
      if (dueTodayEl) dueTodayEl.textContent = `$${totalAtLaunch.toFixed(2)}`;
      if (channelsEl) channelsEl.textContent = `${totalChannels} connected channels`;
      if (itemizedEl) {
        itemizedEl.replaceChildren(
          ...lines.map((item) => {
            const li = document.createElement("li");
            const nameSpan = document.createElement("span");
            nameSpan.textContent = item.label;
            const valStrong = document.createElement("strong");
            valStrong.textContent = item.val;
            li.append(nameSpan, valStrong);
            return li;
          })
        );
      }
      syncLegacyHasFallback();
    };

    quoteForm.addEventListener("change", recalcQuote);
    quoteForm.addEventListener("input", recalcQuote);
    recalcQuote();

    // Quick-select buttons on Tier Cards smooth-scroll into builder
    for (const pickBtn of document.querySelectorAll("[data-select-tier]")) {
      pickBtn.addEventListener("click", () => {
        const targetTier = pickBtn.getAttribute("data-select-tier");
        const radio = quoteForm.querySelector(`input[name="tier_id"][value="${targetTier}"]`);
        if (radio) {
          radio.checked = true;
          recalcQuote();
        }
        document.getElementById("quote-builder")?.scrollIntoView({ behavior: "smooth" });
      });
    }

    quoteForm.addEventListener("submit", () => {
      if (!quoteForm.checkValidity()) return;
      const btn = quoteForm.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
    });
  }

  // 5B. Progressive AJAX + Focus-Routing Validation on Public Contact Form (forms guide)
  const contactForm = document.getElementById("public-contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      if (!contactForm.checkValidity()) {
        event.preventDefault();
        const firstInvalid = contactForm.querySelector(":invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      event.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const statusBox = document.getElementById("contact-form-status");
      if (submitBtn) submitBtn.disabled = true;
      if (statusBox) statusBox.textContent = "Sending your note...";
      try {
        const resp = await fetch(contactForm.action, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(contactForm),
        });
        const data = await resp.json();
        if (statusBox) {
          statusBox.textContent =
            data.message || "Thank you! Our Abilene team received your message and will reply shortly.";
        }
        contactForm.reset();
      } catch {
        if (statusBox) {
          statusBox.textContent = "Could not reach server. Please try again in a moment.";
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 6. Scroll-state sticky bar fallback where CSS scroll-state queries aren't supported
  if (typeof CSS !== "undefined" && !CSS.supports("container-type", "scroll-state")) {
    const bar = document.querySelector(".site-header");
    if (bar) {
      let lastY = window.scrollY;
      window.addEventListener(
        "scroll",
        () => {
          const y = Math.max(
            0,
            Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight)
          );
          if (y === lastY) return;
          bar.classList.toggle("is-hidden", y > lastY && y > bar.offsetHeight);
          lastY = y;
        },
        { passive: true }
      );
    }
  }

  // 7. Invoker-command Copy Button + Accessible Live Region Feedback (copy-button guide)
  const copyTimers = new WeakMap();
  let lastCopyMessage = "";

  const legacyCopy = (text) => {
    const field = Object.assign(document.createElement("textarea"), { value: text });
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;inset-block-start:0;opacity:0";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } finally {
      field.remove();
    }
  };

  const reportCopy = (button, ok) => {
    const tip = button.nextElementSibling;
    clearTimeout(copyTimers.get(button));
    button.removeAttribute("data-copied");
    button.removeAttribute("data-failed");
    let message = ok ? "Copied" : "Copy failed";
    if (message === lastCopyMessage) {
      message += "\u00A0";
    }
    lastCopyMessage = message;
    if (tip) tip.textContent = "";
    void button.offsetWidth;
    button.setAttribute(ok ? "data-copied" : "data-failed", "");
    if (tip) {
      requestAnimationFrame(() => {
        tip.textContent = message;
      });
    }
    copyTimers.set(
      button,
      setTimeout(() => {
        button.removeAttribute("data-copied");
        button.removeAttribute("data-failed");
        if (tip) tip.textContent = "";
      }, 2000)
    );
  };

  const copyFromTarget = async (button, target) => {
    const text = target.matches("input, textarea")
      ? target.value
      : (target.innerText || target.textContent || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      reportCopy(button, true);
    } catch {
      if (legacyCopy(text)) {
        reportCopy(button, true);
      } else {
        reportCopy(button, false);
      }
    }
  };

  if ("CommandEvent" in window) {
    document.addEventListener(
      "command",
      (event) => {
        if (event.command && event.command.startsWith("--copy")) {
          copyFromTarget(event.source, event.target);
        }
      },
      true
    );
  } else {
    document.addEventListener("click", (event) => {
      const button = event.target.closest('button[command^="--copy"]');
      if (!button) return;
      const targetId = button.getAttribute("commandfor");
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) copyFromTarget(button, target);
    });
  }

  // 8. Accessible Service Category Tabs + hidden="until-found" beforematch sync (tabs & search-hidden-content guides)
  for (const tabContainer of document.querySelectorAll(".service-tabs")) {
    const tablist = tabContainer.querySelector('[role="tablist"]');
    const tabs = Array.from(tabContainer.querySelectorAll('[role="tab"]'));
    const panels = Array.from(tabContainer.querySelectorAll('[role="tabpanel"]'));
    if (!tablist || tabs.length === 0 || panels.length === 0) continue;

    const selectTab = (selectedTab, moveFocus = false) => {
      const targetPanelId = selectedTab.getAttribute("data-panel");
      for (const tab of tabs) {
        const isSelected = tab === selectedTab;
        tab.setAttribute("aria-selected", isSelected ? "true" : "false");
        tab.toggleAttribute("focusgroupstart", isSelected);
        tab.tabIndex = isSelected ? 0 : -1;
      }
      for (const panel of panels) {
        const isActive = panel.id === targetPanelId;
        if (isActive) {
          panel.removeAttribute("hidden");
        } else {
          panel.hidden = "until-found";
        }
      }
      if (moveFocus) {
        selectedTab.focus();
      }
      try {
        selectedTab.scrollIntoView({ block: "nearest", inline: "nearest", container: "nearest" });
      } catch {
        selectedTab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    };

    for (const tab of tabs) {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
      tab.addEventListener("click", () => selectTab(tab, false));
      tab.addEventListener("focus", () => {
        if (tab.getAttribute("aria-selected") !== "true") {
          selectTab(tab, false);
        }
      });
    }

    // Offline roving focus fallback when native focusgroup is unavailable
    if (!Object.hasOwn(HTMLElement.prototype, "focusGroup")) {
      tablist.addEventListener("keydown", (event) => {
        const currentIndex = tabs.indexOf(document.activeElement);
        if (currentIndex === -1) return;
        let nextIndex = -1;
        if (event.key === "ArrowRight") {
          nextIndex = (currentIndex + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        }
        if (nextIndex !== -1) {
          event.preventDefault();
          selectTab(tabs[nextIndex], true);
        }
      });
    }

    // Sync tab selection when Find-in-Page (Ctrl+F) reveals a hidden="until-found" panel
    tabContainer.addEventListener("beforematch", (event) => {
      const matchedPanel = event.target.closest('[role="tabpanel"]');
      if (!matchedPanel) return;
      const matchingTab = tabs.find(
        (t) => t.getAttribute("data-panel") === matchedPanel.id
      );
      if (matchingTab) {
        selectTab(matchingTab, false);
      }
    });
  }

  // 9. Scroll-fade IntersectionObserver fallback where CSS scroll-driven animations aren't supported (tabs guide)
  if (typeof CSS !== "undefined" && !CSS.supports("animation-timeline", "scroll()") && "IntersectionObserver" in window) {
    for (const scroller of document.querySelectorAll(".service-tablist")) {
      const first = scroller.firstElementChild;
      const last = scroller.lastElementChild;
      if (!first || !last) continue;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const { target, intersectionRatio } of entries) {
            scroller.classList.toggle(
              target === first ? "more-start" : "more-end",
              intersectionRatio < 1
            );
          }
        },
        { root: scroller, threshold: 1, rootMargin: "1px" }
      );
      observer.observe(first);
      observer.observe(last);
    }
  }

  // 10. Partner Briefing Presentation Mode (Slide-by-Slide vs Full Scroll + Keyboard Navigation)
  const briefingDeck = document.getElementById("partner-briefing-deck");
  if (briefingDeck) {
    const slides = Array.from(briefingDeck.querySelectorAll(".deck-slide"));
    const toggleModeBtn = document.getElementById("deck-toggle-mode");
    const prevBtn = document.getElementById("deck-prev-slide");
    const nextBtn = document.getElementById("deck-next-slide");
    const counterEl = document.getElementById("deck-slide-counter");
    const printBtn = document.getElementById("deck-print-btn");
    let currentSlideIdx = 0;
    let isSlideMode = false;

    const renderDeckState = (scrollTop = false) => {
      briefingDeck.classList.toggle("is-slide-mode", isSlideMode);
      slides.forEach((sl, idx) => {
        sl.classList.toggle("is-current-slide", idx === currentSlideIdx);
      });
      if (toggleModeBtn) {
        toggleModeBtn.textContent = isSlideMode ? "Switch to Full Scroll Read" : "Present Slide-by-Slide";
        toggleModeBtn.setAttribute("aria-pressed", String(isSlideMode));
      }
      if (prevBtn) {
        prevBtn.hidden = !isSlideMode;
        prevBtn.disabled = currentSlideIdx === 0;
      }
      if (nextBtn) {
        nextBtn.hidden = !isSlideMode;
        nextBtn.disabled = currentSlideIdx === slides.length - 1;
      }
      if (counterEl) {
        counterEl.textContent = isSlideMode
          ? `Slide ${String(currentSlideIdx + 1).padStart(2, "0")} of ${String(slides.length).padStart(2, "0")}`
          : `${slides.length}-Chapter Executive Briefing`;
      }
      if (scrollTop && isSlideMode) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    toggleModeBtn?.addEventListener("click", () => {
      isSlideMode = !isSlideMode;
      renderDeckState(true);
    });
    prevBtn?.addEventListener("click", () => {
      if (currentSlideIdx > 0) {
        currentSlideIdx -= 1;
        renderDeckState(true);
      }
    });
    nextBtn?.addEventListener("click", () => {
      if (currentSlideIdx < slides.length - 1) {
        currentSlideIdx += 1;
        renderDeckState(true);
      }
    });
    printBtn?.addEventListener("click", () => window.print());

    document.addEventListener("keydown", (ev) => {
      if (!isSlideMode) return;
      const tag = (ev.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      if (ev.key === "ArrowRight" && currentSlideIdx < slides.length - 1) {
        currentSlideIdx += 1;
        renderDeckState(true);
      } else if (ev.key === "ArrowLeft" && currentSlideIdx > 0) {
        currentSlideIdx -= 1;
        renderDeckState(true);
      }
    });
    renderDeckState(false);
  }

  // 11. Interactive Maternal Income, Tax & Honest Weekly Hours Stress-Test Simulator
  const simBox = document.getElementById("maternal-simulator");
  if (simBox) {
    const clientsSlider = document.getElementById("sim-clients");
    const churnSlider = document.getElementById("sim-churn");
    const syncRangeVars = (el, textVal) => {
      if (!el) return;
      el.style.setProperty("--attr-min", el.min || "0");
      el.style.setProperty("--attr-max", el.max || "100");
      el.style.setProperty("--control-value", el.value);
      if (textVal) el.setAttribute("aria-valuetext", textVal);
    };

    const recalcMaternalSim = () => {
      const n = Number(clientsSlider?.value || 30);
      const churnPct = Number(churnSlider?.value || 3.5);
      const modeInp = simBox.querySelector('input[name="sim_mode"]:checked');
      const isHybrid = modeInp?.value === "hybrid";

      // Blended v2.0 recurring MRR ($447.35/mo across $249/$399/$599 + $59 care) + ~$28/mo amortized setup/10DLC
      const blendedMrrPerClient = 447.35;
      const replacementDealsPerMo = (n * (churnPct / 100));
      const setupRevMo = replacementDealsPerMo * 195; // blended GBP/10DLC/buyout setup fees
      const monthlyGross = n * blendedMrrPerClient + setupRevMo;
      const annualGross = monthlyGross * 12;

      // Hard Variable COGS (~$28.90 blended: Zernio $3.24/ch + Stripe 2.9%+$0.30 + AI Voice/Copy + Autopilot 10DLC share)
      const varCogsMo = n * 28.9;
      // Fixed Cloud + Outreach Domain Pool ($48/mo)
      const fixedCloudMo = 48.0;
      // Hybrid Delegation Costs ($575/mo SOP-trained Onboarding VA + $350 setup comm + 10% residual on portfolio)
      const hybridTeamMo = isHybrid ? (575.0 + replacementDealsPerMo * 350.0 + (n * blendedMrrPerClient * 0.10)) : 0.0;

      const monthlyPreTaxNet = Math.max(0, monthlyGross - varCogsMo - fixedCloudMo - hybridTeamMo);
      const annualPreTaxNet = monthlyPreTaxNet * 12;
      // Effective Federal + SE Tax (~30.48%: 22% MFJ bracket w/ 20% QBI deduction + 15.3% SE tax, 0% TX state income tax)
      const annualPostTax = annualPreTaxNet * 0.6952;
      const monthlyPostTax = annualPostTax / 12;

      // Honest Weekly Maternal Hours Math (from Red Team Time-Motion Model):
      // Solo: 0.25 hr/wk per active client + (replacementDealsPerMo * (3.5h onboarding + 5.5h outreach) / 4.33 wks)
      // Hybrid: VA handles OAuth/10DLC onboarding & tier-1 nudges; Rep handles cold outreach -> 0.13 hr/wk exec + 0.75h welcome/deal
      const careHrsWk = isHybrid ? n * 0.13 : n * 0.25;
      const churnReplaceHrsWk = isHybrid
        ? (replacementDealsPerMo * 0.85) / 4.33
        : (replacementDealsPerMo * 9.0) / 4.33;
      const totalMaternalHrsWk = Math.round((careHrsWk + churnReplaceHrsWk) * 10) / 10;
      const effectiveHourlyNet = totalMaternalHrsWk > 0 ? Math.round(annualPostTax / (totalMaternalHrsWk * 50)) : 0;

      syncRangeVars(clientsSlider, `${n} active clients`);
      syncRangeVars(churnSlider, `${churnPct.toFixed(1)}% monthly churn`);

      const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
      };
      const fmtUsd = (v) => `$${Math.round(v).toLocaleString("en-US")}`;

      setTxt("sim-clients-out", `${n} Active Clients`);
      setTxt("sim-churn-out", `${churnPct.toFixed(1)}% / mo (${replacementDealsPerMo.toFixed(1)} replacement deals/mo)`);
      setTxt("sim-gross-yr", `${fmtUsd(annualGross)}/yr (${fmtUsd(monthlyGross)}/mo)`);
      setTxt("sim-costs-mo", `-${fmtUsd(varCogsMo + fixedCloudMo + hybridTeamMo)}/mo`);
      setTxt("sim-pretax-yr", `${fmtUsd(annualPreTaxNet)}/yr`);
      setTxt("sim-posttax-yr", `${fmtUsd(annualPostTax)}/yr (${fmtUsd(monthlyPostTax)}/mo take-home)`);
      setTxt("sim-hours-wk", `${totalMaternalHrsWk.toFixed(1)} hrs / week`);
      setTxt("sim-hours-detail", `${careHrsWk.toFixed(1)}h client check-ins + ${churnReplaceHrsWk.toFixed(1)}h churn replacement`);
      setTxt("sim-hourly-rate", `${fmtUsd(effectiveHourlyNet)} / hr after tax`);

      const warnEl = document.getElementById("sim-bandwidth-note");
      if (warnEl) {
        if (!isHybrid && totalMaternalHrsWk > 13.5) {
          warnEl.textContent =
            "Honest Bandwidth Alert: Above ~13.5 hrs/wk solo, sales & onboarding start crowding nap windows when a baby is sick or teething. Switch to 'Hybrid (Add $575/mo VA + Commission Rep)' above to cut your personal hours nearly in half.";
        } else {
          warnEl.textContent =
            "Comfortably inside Nap-Time Bandwidth (< 13.5 hrs/wk): fits inside 2 flexible hours/weekday with zero weekend or evening work.";
        }
      }
    };

    simBox.addEventListener("input", recalcMaternalSim);
    simBox.addEventListener("change", recalcMaternalSim);
    recalcMaternalSim();
  }

  // 12. Condensed 7-Slide Click-Through Wife Pitch Deck (/pitch) + 3-Preset Size Picker
  const pitchStage = document.getElementById("condensed-pitch-deck");
  if (pitchStage) {
    const pSlides = Array.from(pitchStage.querySelectorAll(".pitch-slide"));
    const pPills = Array.from(document.querySelectorAll(".pitch-step-pill"));
    const pPrev = document.getElementById("pitch-prev");
    const pNext = document.getElementById("pitch-next");
    const pCounter = document.getElementById("pitch-counter");
    let pIdx = 0;

    const goPitchSlide = (targetIdx) => {
      pIdx = Math.max(0, Math.min(targetIdx, pSlides.length - 1));
      pSlides.forEach((s, i) => {
        const active = i === pIdx;
        s.hidden = !active;
        s.classList.toggle("is-active", active);
      });
      pPills.forEach((pill, i) => {
        pill.classList.toggle("is-active", i === pIdx);
        pill.setAttribute("aria-current", i === pIdx ? "step" : "false");
      });
      if (pPrev) pPrev.disabled = pIdx === 0;
      if (pNext) {
        pNext.disabled = pIdx === pSlides.length - 1;
        pNext.textContent = pIdx === pSlides.length - 1 ? "Done" : "Next \u2192";
      }
      if (pCounter) {
        pCounter.textContent = `Slide ${String(pIdx + 1).padStart(2, "0")} of ${String(pSlides.length).padStart(2, "0")}`;
      }
    };

    pPrev?.addEventListener("click", () => goPitchSlide(pIdx - 1));
    pNext?.addEventListener("click", () => goPitchSlide(pIdx + 1));
    for (const pill of pPills) {
      pill.addEventListener("click", () => {
        goPitchSlide(Number(pill.getAttribute("data-pitch-goto") || 0));
      });
    }

    document.addEventListener("keydown", (ev) => {
      const tag = (ev.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (ev.key === "ArrowRight") goPitchSlide(pIdx + 1);
      if (ev.key === "ArrowLeft") goPitchSlide(pIdx - 1);
    });

    const sizePresets = {
      "10": {
        cash: "$2,860/mo",
        yr: "$34,320/yr in our bank account",
        hrs: "~3.8 hrs/wk",
        pace: "~45 mins per weekday during nap time",
        catchText: "9 out of 10 outreach emails get ignored (normal), and ~1 client every 3 months cancels and gets replaced.",
      },
      "20": {
        cash: "$5,715/mo",
        yr: "$68,580/yr in our bank account",
        hrs: "~7.5 hrs/wk",
        pace: "~1.5 hrs per weekday during nap time",
        catchText: "9 out of 10 outreach emails get ignored (normal), and ~1 client every 6 weeks cancels and gets replaced.",
      },
      "30": {
        cash: "$8,570/mo",
        yr: "$102,870/yr in our bank account",
        hrs: "~11.2 hrs/wk",
        pace: "~2.2 hrs per weekday during nap time",
        catchText: "9 out of 10 outreach emails get ignored (normal), and ~1 client per month naturally cancels and gets replaced.",
      },
    };

    const tierBtns = Array.from(pitchStage.querySelectorAll(".pitch-tier-btn"));
    for (const btn of tierBtns) {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-pitch-size") || "20";
        const p = sizePresets[key] || sizePresets["20"];
        for (const b of tierBtns) {
          const isSel = b === btn;
          b.setAttribute("aria-pressed", String(isSel));
          b.className = `${isSel ? "btn-primary" : "btn-secondary"} pitch-tier-btn`;
        }
        const setT = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.textContent = v;
        };
        setT("pitch-out-cash", p.cash);
        setT("pitch-out-yr", p.yr);
        setT("pitch-out-hrs", p.hrs);
        setT("pitch-out-pace", p.pace);
        setT("pitch-out-catch", p.catchText);
      });
    }

    goPitchSlide(0);
  }

  // 13. Instant 20+ Client Roster Search & Tier Filter (/hub and /admin) + 1-to-1 Message Templates
  const searchInput = document.querySelector("[data-client-search]");
  const tierSelect = document.querySelector("[data-client-tier-filter]");
  if (searchInput || tierSelect) {
    const selector =
      searchInput?.getAttribute("data-client-search") ||
      tierSelect?.getAttribute("data-client-tier-filter") ||
      "[data-client-card]";
    const items = Array.from(document.querySelectorAll(selector));
    const countEl = document.getElementById("hub-search-count");

    const applyClientFilter = () => {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const tier = tierSelect?.value || "all";
      let visible = 0;
      for (const el of items) {
        const hay = (el.getAttribute("data-client-haystack") || el.textContent || "").toLowerCase();
        const itemTier = el.getAttribute("data-client-tier") || "";
        const matchQ = !q || hay.includes(q);
        const matchT = tier === "all" || itemTier === tier;
        const show = matchQ && matchT;
        el.hidden = !show;
        if (show) visible += 1;
      }
      if (countEl) {
        countEl.textContent =
          q || tier !== "all"
            ? `Showing ${visible} of ${items.length} client workspace(s).`
            : "";
      }
    };

    searchInput?.addEventListener("input", applyClientFilter);
    tierSelect?.addEventListener("change", applyClientFilter);
  }

  for (const tplBtn of document.querySelectorAll("[data-msg-template]")) {
    tplBtn.addEventListener("click", () => {
      const bodyEl = document.getElementById("direct_body");
      const subjEl = document.getElementById("direct_subject");
      if (bodyEl) {
        bodyEl.value = tplBtn.getAttribute("data-msg-template") || "";
        bodyEl.focus();
      }
      const nextSubj = tplBtn.getAttribute("data-msg-subject");
      if (subjEl && nextSubj) {
        subjEl.value = nextSubj;
      }
    });
  }

  // 14. Live Distressed-Whale & Existing-System Qualifier (/hub Step 2)
  const qualBtn = document.getElementById("btn-test-qualify");
  const prospectForm = document.getElementById("hub-prospect-form");
  if (qualBtn && prospectForm) {
    qualBtn.addEventListener("click", async () => {
      const outEl = document.getElementById("qualify-live-result");
      const key = prospectForm.getAttribute("data-admin-key") || "";
      const bname = document.getElementById("lead_business_name")?.value?.trim() || "Sample Prospect";
      const payload = {
        business_name: bname,
        industry: document.getElementById("lead_industry")?.value || "hvac_plumbing",
        city_state: document.getElementById("lead_city_state")?.value || "Abilene, TX",
        website_url: document.getElementById("lead_website_url")?.value || "",
        google_review_count: Number.parseInt(document.getElementById("lead_reviews")?.value || "45", 10) || 45,
        google_rating: Number.parseFloat(document.getElementById("lead_rating")?.value || "4.7") || 4.7,
        estimated_staff_count: Number.parseInt(document.getElementById("lead_staff")?.value || "8", 10) || 8,
        gbp_dormant_90d: Boolean(document.getElementById("lead_dormant_chk")?.checked),
        reviews_unanswered: Boolean(document.getElementById("lead_unanswered_chk")?.checked),
        scan_live_url: Boolean(document.getElementById("lead_scan_chk")?.checked),
        observation_notes: document.getElementById("lead_obs")?.value || "",
      };
      if (outEl) outEl.textContent = "Scanning website & calculating Wealth + Digital Distress score...";
      try {
        const res = await fetch(`/api/admin/prospects/qualify?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const q = data.qualification || {};
        if (outEl) {
          outEl.textContent =
            `${q.tier_label} — Score ${q.priority_score}/100 ` +
            `(Wealth/Low-Maint: ${q.wealth_low_maint_score}/50 · Distress: ${q.distress_need_score}/50 · ${q.geo_label}). ` +
            `${q.recommended_action}`;
        }
      } catch {
        if (outEl) outEl.textContent = "Could not reach qualifier endpoint.";
      }
    });
  }

  // 15. Outreach Send Lock Override + 1-Click Prospect -> Step 3 Onboarding Pre-Fill (/hub)
  const unlockOutreachChk = document.querySelector("[data-unlock-outreach]");
  if (unlockOutreachChk) {
    unlockOutreachChk.addEventListener("change", () => {
      const unlocked = Boolean(unlockOutreachChk.checked);
      for (const btn of document.querySelectorAll("[data-outreach-send-btn]")) {
        btn.disabled = !unlocked;
        btn.textContent = unlocked
          ? btn.getAttribute("data-default-label") || "Send Email"
          : btn.getAttribute("data-locked-label") || "Send Locked";
      }
      for (const inp of document.querySelectorAll("[data-outreach-override-input]")) {
        inp.value = unlocked ? "1" : "0";
      }
    });
  }

  // 16. Step 3 Onboarding Live HIPAA & Foundation Website Guardrails + Pre-Fill Handler
  const onboardForm = document.getElementById("hub-onboard-form");
  const syncOnboardGuardrails = () => {
    if (!onboardForm) return;
    const indSel = document.getElementById("ob_industry");
    const tierSel = document.getElementById("ob_plan_tier");
    const webSel = document.getElementById("ob_website_mode");
    const optAutopilot = document.getElementById("ob_opt_autopilot");
    const optVested = document.getElementById("ob_opt_vested");
    const hipaaBanner = document.getElementById("ob-hipaa-banner");
    const hipaaSet = new Set(["med_spa", "dental", "chiropractic", "orthodontics", "healthcare_clinic"]);
    const isHipaa = hipaaSet.has(indSel?.value || "");

    if (hipaaBanner) hipaaBanner.hidden = !isHipaa;
    if (optAutopilot) {
      optAutopilot.disabled = isHipaa;
      if (isHipaa && tierSel && tierSel.value === "autopilot") {
        tierSel.value = "growth";
      }
    }
    if (optVested && tierSel && webSel) {
      const eligibleZeroDown = tierSel.value !== "starter";
      optVested.disabled = !eligibleZeroDown;
      if (!eligibleZeroDown && webSel.value === "vested_zero_down") {
        webSel.value = "none";
      }
    }
  };

  if (onboardForm) {
    onboardForm.addEventListener("change", syncOnboardGuardrails);
    syncOnboardGuardrails();
  }

  for (const prefillBtn of document.querySelectorAll("[data-prefill-onboard]")) {
    prefillBtn.addEventListener("click", () => {
      const onboardDetails = document.getElementById("onboard-tools");
      if (onboardDetails) onboardDetails.open = true;

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== null && val !== undefined) el.value = val;
      };
      const bname = prefillBtn.getAttribute("data-bname") || "";
      const city = prefillBtn.getAttribute("data-city") || "Abilene, TX";
      const ind = prefillBtn.getAttribute("data-industry") || "local_service";
      const rawUrl = prefillBtn.getAttribute("data-url") || "";
      const isSocialOnly = rawUrl.includes("facebook.com") || rawUrl.includes("instagram.com");

      setVal("ob_lead_id", prefillBtn.getAttribute("data-lead-id") || "");
      setVal("ob_business_name", bname);
      setVal("ob_owner_name", prefillBtn.getAttribute("data-cname") || "");
      setVal("ob_owner_email", prefillBtn.getAttribute("data-cemail") || "");
      setVal("ob_address", city);
      setVal("ob_booking_url", !isSocialOnly && rawUrl ? rawUrl : "");
      setVal("ob_plan_tier", prefillBtn.getAttribute("data-plan") || "growth");
      setVal("ob_raw_notes", prefillBtn.getAttribute("data-notes") || "");

      const indSel = document.getElementById("ob_industry");
      if (indSel) {
        const hasOpt = Array.from(indSel.options).some((o) => o.value === ind);
        indSel.value = hasOpt ? ind : "local_service";
      }
      syncOnboardGuardrails();

      const banner = document.getElementById("ob-prefill-banner");
      if (banner) {
        banner.hidden = false;
        banner.textContent = `Pre-filled onboarding workspace from prospect "${bname}" — confirm owner name, email, and street address below.`;
      }
      onboardDetails?.scrollIntoView({ behavior: "smooth", block: "start" });
      const nextFocus =
        (document.getElementById("ob_owner_name")?.value ? document.getElementById("ob_owner_email") : document.getElementById("ob_owner_name")) ||
        document.getElementById("ob_business_name");
      nextFocus?.focus();
    });
  }

  // 17. Single-Client Isolated Team Roster Row Builder (/hub/clients/{slug}/manage)
  const addStaffBtn = document.getElementById("btn-add-staff-row");
  const staffList = document.getElementById("staff-roster-list");
  if (addStaffBtn && staffList) {
    addStaffBtn.addEventListener("click", () => {
      const idx = staffList.querySelectorAll("[data-staff-row]").length;
      const row = document.createElement("div");
      row.className = "staff-row-card";
      row.setAttribute("data-staff-row", "");

      const mkGroup = (id, labelTxt, name, type, placeholder) => {
        const grp = document.createElement("div");
        grp.className = "form-group";
        const lbl = document.createElement("label");
        lbl.htmlFor = id;
        lbl.textContent = labelTxt;
        const inp = document.createElement("input");
        inp.id = id;
        inp.name = name;
        inp.type = type;
        inp.placeholder = placeholder;
        if (type === "url") {
          inp.setAttribute("autocorrect", "off");
          inp.setAttribute("autocapitalize", "none");
          inp.setAttribute("spellcheck", "false");
        }
        grp.append(lbl, inp);
        return { grp, inp };
      };

      const splitTop = document.createElement("div");
      splitTop.className = "split-builder";
      const nameField = mkGroup(`st-name-${idx}`, "Team Member Name", "staff_name", "text", "e.g., New Stylist / Tech");
      const roleField = mkGroup(`st-role-${idx}`, "Role / Chair Specialty", "staff_role", "text", "e.g., Barber / Field Tech");
      splitTop.append(nameField.grp, roleField.grp);

      const splitBot = document.createElement("div");
      splitBot.className = "split-builder";
      const phoneField = mkGroup(`st-phone-${idx}`, "Mobile Phone (Tuesday SMS Photo Whitelist)", "staff_phone", "tel", "e.g., +13255550188");
      const bookField = mkGroup(`st-book-${idx}`, "Direct Booking Deep-Link (optional)", "staff_booking_url", "url", "https://...");
      splitBot.append(phoneField.grp, bookField.grp);

      const hidEmail = Object.assign(document.createElement("input"), { type: "hidden", name: "staff_email", value: "" });
      const hidTeamId = Object.assign(document.createElement("input"), { type: "hidden", name: "staff_team_member_id", value: "" });

      const chkLbl = document.createElement("label");
      chkLbl.className = "choice-card";
      chkLbl.htmlFor = `st-app-${idx}`;
      chkLbl.style.marginBlock = "0";
      const chk = Object.assign(document.createElement("input"), {
        type: "checkbox",
        id: `st-app-${idx}`,
        name: "staff_approver_idx",
        value: String(idx),
      });
      const chkSpan = document.createElement("span");
      chkSpan.textContent = "Approver / Shop Lead (can approve or edit weekly drafts via SMS)";
      chkLbl.append(chk, chkSpan);

      row.append(splitTop, splitBot, hidEmail, hidTeamId, chkLbl);
      staffList.append(row);
      nameField.inp.focus();
    });
  }
});
