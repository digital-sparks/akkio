window.Webflow ||= [];
window.Webflow.push(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const showValue = urlParams.get('show');

  if (showValue) {
    console.log(showValue);
    const popupElement = document.querySelector(
      `[data-attr-name="popup"][data-attr-value="${showValue}"]`
    );

    if (popupElement) {
      popupElement.click();

      urlParams.delete('show');
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;

      window.history.replaceState({}, '', newUrl);
    }
  }
});
