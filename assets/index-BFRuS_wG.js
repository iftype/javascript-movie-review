(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2FhNDEzMTFjYjBjYmVkYmFmZTFiZjI1ZjdhMjhlMyIsIm5iZiI6MTc3NDg1NTE3OC45OTUwMDAxLCJzdWIiOiI2OWNhMjQwYTVhYzgwNDIyMzk4YWE3MzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0xVetrHAobzs4CBOIbw98YQ0VyLSwCBZKRVQYj59lI8";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
};
const BASE_URL = "https://api.themoviedb.org/3";
const fetchAPI = async (req) => {
  const url = BASE_URL + req.path;
  const { query, page } = req.params;
  const params = new URLSearchParams({ language: "en-US", page: String(page) });
  if (query) params.set("query", query);
  const resultUrl = url + "?" + params.toString();
  const response = await fetch(resultUrl, options);
  if (!response.ok) {
    throw new Error("영화 데이터를 불러오는 데 실패했습니다.");
  }
  const data = await response.json();
  return data;
};
const fetchSearchMovies = (query, page = 1) => {
  return fetchAPI({
    path: "/search/movie",
    params: { query, page }
  });
};
const fetchPopularMovies = (page = 1) => {
  return fetchAPI({
    path: "/movie/popular",
    params: { page }
  });
};
const renderFetchMovieItem = async ($target, page, query) => {
  try {
    $target.insertAdjacentHTML("beforeend", renderSkellMovieItem());
    let data;
    if (query) ;
    else {
      data = await fetchPopularMovies(page);
    }
    if (query && data.results.length === 0) ;
    removeSkeleton($target);
    if (page === 1 && !query && data.results.length > 0) {
      updateHeroBanner(data.results[0]);
    }
    const dataHTML = data.results.map(renderMovieItem).join("");
    $target.insertAdjacentHTML("beforeend", dataHTML);
    toggleButton(data.total_pages, page);
    return data.total_pages;
  } catch (error) {
    alert("영화 목록을 불러오지 못했습니다!");
    return new Error("영화 목록을 불러오지 못했습니다!");
  }
};
const renderErrorpage = (query) => {
  return (
    /* html */
    `
      <div class = "empty-result">
        <img src="./images/empty.png" alt="검색 결과가 없습니다." class="empty-image" />
        <p>"${query}" 검색 결과가 없습니다.</p>
      </div>`
  );
};
const toggleButton = (totalPage, currentPage) => {
  const $button = document.querySelector("#more-page-button");
  if (currentPage < totalPage) {
    $button?.classList.remove("hidden");
  }
};
function renderMovieItem(data) {
  return (
    /* html */
    `
      <li>
        <div class="item">
          <img class="thumbnail" src="https://image.tmdb.org/t/p/w500${data.poster_path}" alt="${data.title}" />
          <div class="item-desc">
            <p class="rate">
              <img src="./images/star_empty.png" class="star" />
              <span>${data.vote_average}</span>
            </p>
            <strong>${data.title}</strong>
          </div>
        </div>
      </li>
    `
  );
}
function renderSkellMovieItem() {
  const skelHTML = (
    /* html */
    `
      <li class= "skeleton-container">
        <div class="item">
          <div class="thumbnail skeleton"></div>
        </div>
      </li>
    `
  );
  return skelHTML.repeat(20);
}
const removeSkeleton = ($target) => {
  $target.querySelectorAll(".skeleton-container").forEach((node) => {
    node.remove();
  });
};
const updateHeroBanner = (movie) => {
  const $bg = document.querySelector(".background-container");
  if ($bg && movie.backdrop_path) {
    $bg.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
  }
  const $title = document.querySelector(".top-rated-movie .title");
  if ($title) $title.textContent = movie.title;
  const $rate = document.querySelector(".top-rated-movie .rate-value");
  if ($rate) $rate.textContent = movie.vote_average.toFixed(1);
};
addEventListener("load", () => {
  const app = document.querySelector("#app");
  if (app) {
    init();
  }
});
function init() {
  let currentPage = 1;
  const $thumbnailList = document.querySelector(".thumbnail-list");
  if ($thumbnailList) {
    renderFetchMovieItem($thumbnailList, currentPage);
  }
  const $button = document.querySelector("#more-page-button");
  $button?.addEventListener("click", () => {
    currentPage++;
    if ($thumbnailList) {
      $button?.classList.add("hidden");
      renderFetchMovieItem($thumbnailList, currentPage);
    }
  });
}
