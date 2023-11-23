const renderError = (container: HTMLElement, error: string) => {
  // render a custom error and style it
  const wrapper = container.createEl("div");
  wrapper.createEl("p", { text: `(Error) Note Gallery: ${error}` });

  wrapper.style.borderRadius = "var(--callout-radius)";
  wrapper.style.padding = "var(--callout-padding)";
  wrapper.style.backgroundColor = "var(--background-modifier-error)";
  wrapper.style.color = "var(--text-on-accent-inverted)";
  wrapper.style.fontWeight = "var(--font-bold)";
};

export default renderError;
