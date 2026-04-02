import { r as renderFetchMovieItem } from "./render-BTurIXFc.js";
addEventListener("load", () => {
  const app = document.querySelector("#app");
  if (app) {
    init();
  }
});
const init = () => {
  let currentPage = 1;
  const query = new URLSearchParams(window.location.search).get("q");
  const $thumbnailList = document.querySelector(".thumbnail-list");
  if (query) {
    currentPage = 1;
    if ($thumbnailList) {
      renderFetchMovieItem($thumbnailList, currentPage, query);
    }
    const $button = document.querySelector("#more-page-button");
    $button?.addEventListener("click", () => {
      currentPage++;
      if ($thumbnailList) {
        $button?.classList.add("hidden");
        renderFetchMovieItem($thumbnailList, currentPage, query);
      }
    });
  }
};
