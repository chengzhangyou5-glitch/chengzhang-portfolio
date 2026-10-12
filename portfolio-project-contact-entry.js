(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // tools/project-contact-entry.js
  var contactModule;
  document.addEventListener("click", async (event) => {
    const trigger = event.target.closest?.("[data-project-contact]");
    if (!trigger || trigger.disabled) return;
    event.preventDefault();
    if (trigger.dataset.contactLoading) return;
    trigger.dataset.contactLoading = "true";
    trigger.setAttribute("aria-busy", "true");
    try {
      const module = await (contactModule ||= import("/portfolio-project-contact.js").catch((error) => {
        contactModule = null;
        throw error;
      }));
      module.openProjectContact(trigger);
    } catch (error) {
      console.error("Contact panel could not be opened", error);
    } finally {
      delete trigger.dataset.contactLoading;
      trigger.removeAttribute("aria-busy");
    }
  });
})();
