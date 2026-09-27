const moduleBasePath = "/ui/modules";

const getModuleSource = (moduleName) => `${moduleBasePath}/${moduleName}.html`;

const importHtmlModule = async (placeholder) => {
    const moduleName = placeholder.dataset.module;
    if (!moduleName) return;

    try {
        const response = await fetch(getModuleSource(moduleName));

        if (!response.ok) {
            throw new Error(`Module ${moduleName} failed with status ${response.status}`);
        }

        const template = document.createElement("template");
        template.innerHTML = (await response.text()).trim();
        placeholder.replaceWith(template.content.cloneNode(true));
    } catch (error) {
        console.error("Unable to load nook Labs module.", error);
    }
};

const importHtmlModules = async () => {
    const placeholders = [...document.querySelectorAll("[data-module]")];

    await Promise.all(placeholders.map(importHtmlModule));
    document.dispatchEvent(new CustomEvent("nookLabs:modulesready"));
};

const domReady = document.readyState === "loading"
    ? new Promise((resolve) => {
        document.addEventListener("DOMContentLoaded", resolve, { once: true });
    })
    : Promise.resolve();

window.NookLabsModulesReady = domReady.then(importHtmlModules);