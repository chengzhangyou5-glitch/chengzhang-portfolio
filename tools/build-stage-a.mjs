await import("./build-design-foundation.mjs");
await import("./build-navigation.mjs");
await import("./build-work-experience.mjs");
await import("./build-contact.mjs");
const { buildProjectDetails } = await import("./build-project-details.mjs");
await buildProjectDetails();
