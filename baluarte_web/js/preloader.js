window.addEventListener('load', () => {
  const loader = document.getElementById('preloader');
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add('gif-fade-out');
    setTimeout(() => {
      loader.classList.add('bg-fade-to-black');
      setTimeout(() => {
        loader.classList.add('finish');
        setTimeout(() => loader.remove(), 1000);
      }, 800);
    }, 600);
  }, 1500);
});
