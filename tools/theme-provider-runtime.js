// Keep the existing React context/API; resolve and persist through the shared controller.
function PortfolioThemeModeProvider({ children, defaultTheme = "system" }) {
  const [theme, setPreference] = i.useState(defaultTheme);
  const [resolvedTheme, setResolved] = i.useState("light");
  i.useEffect(() => {
    const controller = window.PortfolioTheme;
    const update = ({ preference, resolved }) => { setPreference(preference); setResolved(resolved); };
    update({ preference: controller.getPreference(), resolved: controller.getResolved() });
    return controller.subscribe(update);
  }, []);
  const setTheme = i.useCallback(value => window.PortfolioTheme.setPreference(value), []);
  const value = i.useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, setTheme, resolvedTheme]);
  return e.jsx(r.Provider, { value, children });
}
