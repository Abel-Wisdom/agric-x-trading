const routeLoaders = {
  "/": () => import("../pages/Home.jsx"),
  "/about": () => import("../pages/About.jsx"),
  "/research": () => import("../pages/Research.jsx"),
  "/services": () => import("../pages/Services.jsx"),
  "/insights": () => import("../pages/Insights.jsx"),
  "/contact": () => import("../pages/Contact.jsx"),
};

const prefetchedRoutes = new Map();

export function prefetchRoute(path) {
  const loader = routeLoaders[path];

  if (!loader) return;

  if (prefetchedRoutes.has(path)) {
    return prefetchedRoutes.get(path);
  }

  const request = loader()
    .then((module) => {
      if (path === "/insights") {
        module.prefetchInsightsData?.();
      }

      if (path === "/research") {
        module.prefetchResearchData?.();
      }

      return module;
    })
    .catch((error) => {
      prefetchedRoutes.delete(path);
      console.warn(`Unable to prefetch ${path}:`, error);
    });

  prefetchedRoutes.set(path, request);

  return request;
}