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
const URL = {
  BASE: "https://api.themoviedb.org/3",
  THUMBNAIL_IMAGE: "https://image.tmdb.org/t/p/w500",
  ORIGINAL_IMAGE: "https://image.tmdb.org/t/p/original"
};
const PATH = {
  MOVIE_POPULAR: "/movie/popular",
  SEARCH_MOVIE: "/search/movie"
};
const getOriginalImageUrl = (src) => {
  return URL.ORIGINAL_IMAGE + src;
};
const getThumbnailImageUrl = (src) => {
  return URL.THUMBNAIL_IMAGE + src;
};
const $ = (el, selector) => {
  const found = el.querySelector(selector);
  if (!found) throw new Error(`${selector} 없음`);
  return found;
};
const Logo = () => {
  const tempalte = `
    <a href="#/">
      <img src="./images/logo.png" alt="MovieList" />
    </a>
  `;
  const $h1 = document.createElement("h1");
  $h1.className = "logo";
  $h1.innerHTML = tempalte;
  return $h1;
};
const Overlay = () => {
  const $overlay = document.createElement("div");
  $overlay.className = "overlay";
  $overlay.ariaHidden = "true";
  return $overlay;
};
const SearchForm = (onSubmit) => {
  const $form = document.createElement("form");
  $form.className = "search-form";
  $form.innerHTML = `
    <div class="search-wrap">
      <label for="search-input"></label>
      <input id="search-input" name="q" placeholder="검색어를 입력하세요" />
      <button class="search-button" type="submit">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke="#aaa" stroke-width="2" fill="none"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#aaa" stroke-width="2"/>
        </svg>
      </button>
    </div>
  `;
  $form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = $($form, "#search-input").value;
    onSubmit(query);
  });
  return $form;
};
const Star = () => {
  const $img = document.createElement("img");
  $img.className = "star";
  $img.src = "./images/star_empty.png";
  $img.alt = "star_empty";
  return $img;
};
const TopRate = (data) => {
  const $container = document.createElement("div");
  $container.className = "top-rated-movie";
  $container.innerHTML = `
    <div class="title"></div>
    <div class="rate">
      <span class="rate-value">${data.vote_average.toFixed(1)}</span>
    </div>
    <button class="primary detail">자세히 보기</button>
  `;
  $($container, ".rate").prepend(Star());
  $($container, ".title").textContent = data.title;
  return $container;
};
class TopRateHeader {
  #$element;
  constructor(onSubmit) {
    this.#$element = document.createElement("header");
    this.#$element.innerHTML = `
      <div class="background-container top-header-container">
        <div class="top-rated-container"></div>
      </div>
    `;
    const $justLayout = document.createElement("div");
    $(this.#$element, ".top-rated-container").append(Logo(), SearchForm(onSubmit), $justLayout);
    $(this.#$element, ".background-container").prepend(Overlay());
  }
  get $element() {
    return this.#$element;
  }
  render(data) {
    $(this.#$element, ".background-container").style.backgroundImage = `url(${getOriginalImageUrl(data.backdrop_path)})`;
    $(this.#$element, ".top-rated-container").append(TopRate(data));
  }
}
const Error$1 = (message = "에러가 났습니다") => {
  const $div = document.createElement("div");
  $div.className = "nothing";
  $div.innerHTML = `
    <img src="./images/empty.png" alt="nothing" />
    <p> ${message}</p>
  `;
  return $div;
};
const MoreButton = (onClick) => {
  const $button = document.createElement("button");
  $button.className = "more-button";
  $button.textContent = "더 보기";
  $button.addEventListener("click", onClick);
  return $button;
};
const MovieItem = (data) => {
  const { title, poster_path, vote_average } = data;
  const $li = document.createElement("li");
  $li.innerHTML = `
    <div class="item">
      <img class="thumbnail" alt="" />
      <div class="item-desc">
        <p class="rate">
          <span></span>
        </p>
        <strong></strong>
      </div>
    </div>
  `;
  const $img = $($li, ".thumbnail");
  $img.src = getThumbnailImageUrl(poster_path);
  $img.onerror = () => {
    $img.src = "./images/empty.png";
  };
  $($li, ".item-desc strong").textContent = title;
  $($li, ".rate span").textContent = vote_average.toFixed(1);
  $($li, ".rate").prepend(Star());
  return $li;
};
const MovieItemSkeleton = () => {
  const $li = document.createElement("li");
  $li.innerHTML = `
    <div class="item skeleton">
      <div class="thumbnail"></div> <div class="item-desc">
        <div class="rate"></div>
        <div class="title"></div>
      </div>
    </div>
  `;
  return $li;
};
const NothingResult = () => {
  const $div = document.createElement("div");
  $div.className = "nothing";
  $div.innerHTML = `
    <img src="./images/empty.png" alt="nothing" />
    <p>검색 결과가 없습니다.</p>
  `;
  return $div;
};
class Main {
  #$element;
  #$list;
  #$skeletons = [];
  #$moreButton;
  constructor(title) {
    this.#$element = document.createElement("div");
    this.#$element.className = "container";
    this.#$element.innerHTML = `
      <main>
        <section>
          <h2>${title}</h2>
          <ul class="thumbnail-list"></ul>
        </section>
      </main>
    `;
    this.#$list = $(this.#$element, ".thumbnail-list");
    this.#$moreButton = null;
  }
  get $element() {
    return this.#$element;
  }
  renderMovies(movies) {
    this.removeSkeletons();
    const $fragment = new DocumentFragment();
    movies.forEach((movie) => $fragment.append(MovieItem(movie)));
    this.#$list.append($fragment);
  }
  renderSkeletons(length = 20) {
    this.#$skeletons = Array.from({ length }, () => MovieItemSkeleton());
    this.#$skeletons.forEach(($skeleton) => this.#$list.append($skeleton));
  }
  removeSkeletons() {
    this.#$skeletons.forEach(($skeleton) => $skeleton.remove());
    this.#$skeletons = [];
  }
  renderMoreButton(onClick) {
    this.#$moreButton = MoreButton(onClick);
    $(this.#$element, "section").append(this.#$moreButton);
  }
  removeMoreButton() {
    this.#$moreButton?.remove();
    this.#$moreButton = null;
  }
  renderError(messsage) {
    const $element = $(this.#$element, "section");
    $element.innerHTML = "";
    $element.append(Error$1(messsage));
  }
  renderNothing() {
    const $element = $(this.#$element, "section");
    const $h2 = $(this.#$element, "h2");
    $element.innerHTML = "";
    $element.append($h2, NothingResult());
  }
}
class Footer {
  #$element;
  constructor() {
    this.#$element = document.createElement("footer");
    this.#$element.className = "footer";
    this.#$element.innerHTML = `
      <p>&copy; 우아한테크코스 All Rights Reserved.</p>
      <p><img src="./images/woowacourse_logo.png" width="180" /></p>
    `;
  }
  get $element() {
    return this.#$element;
  }
}
class TMDBError extends Error {
  code;
  success;
  constructor({ status_code, status_message, success }) {
    super(status_message);
    this.code = status_code;
    this.success = success;
  }
}
const API_KEY = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwN2FhNDEzMTFjYjBjYmVkYmFmZTFiZjI1ZjdhMjhlMyIsIm5iZiI6MTc3NDg1NTE3OC45OTUwMDAxLCJzdWIiOiI2OWNhMjQwYTVhYzgwNDIyMzk4YWE3MzIiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.0xVetrHAobzs4CBOIbw98YQ0VyLSwCBZKRVQYj59lI8";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
};
const fetchAPI = async (req) => {
  const url = URL.BASE + req.path;
  const { query, page } = req.params;
  const params = new URLSearchParams({ language: "ko-KR", page: String(page), region: "kr" });
  if (query) params.set("query", query);
  const resultUrl = url + "?" + params.toString();
  const response = await fetch(resultUrl, options);
  const data = await response.json();
  if (!response.ok) {
    throw new TMDBError(data);
  }
  return data;
};
const fetchSearchMovies = (query, page = 1) => {
  return fetchAPI({
    path: PATH.SEARCH_MOVIE,
    params: { query, page }
  });
};
const fetchPopularMovies = (page = 1) => {
  return fetchAPI({
    path: PATH.MOVIE_POPULAR,
    params: { page }
  });
};
const ROUTE_CHANGE_EVENT = "ROUTE_CHANGE";
const dispatchRouteChange = (url) => {
  window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_EVENT, { detail: { url } }));
};
class HomePage {
  #$target;
  #page = 1;
  #main;
  constructor($target) {
    this.#$target = $target;
    this.#main = new Main("");
  }
  async init() {
    const header = new TopRateHeader(this.#onSubmit);
    this.#main = new Main("지금 인기있는 영화");
    const footer = new Footer();
    this.#$target.append(header.$element, this.#main.$element, footer.$element);
    const response = await this.#appendMovies();
    header.render(response.results[0]);
  }
  async #loadMore() {
    this.#main.removeMoreButton();
    this.#page += 1;
    await this.#appendMovies();
  }
  async #appendMovies() {
    this.#main.renderSkeletons();
    try {
      const response = await fetchPopularMovies(this.#page);
      this.#main.renderMovies(response.results);
      if (this.#page < response.total_pages) {
        this.#main.renderMoreButton(() => this.#loadMore());
      }
      return response;
    } catch (error) {
      if (error instanceof TMDBError) {
        this.#main.renderError("TMDB에러입니다 " + error.message);
        throw error;
      }
      this.#main.renderError("알수없는 에러입니다\n" + error.message);
      throw error;
    } finally {
      this.#main.removeSkeletons();
    }
  }
  #onSubmit = (query) => {
    if (query.trim()) {
      dispatchRouteChange(`/search?query=${encodeURIComponent(query)}`);
    }
  };
}
class SearchHeader {
  #$element;
  constructor(onSubmit) {
    this.#$element = document.createElement("header");
    this.#$element.innerHTML = `
      <div class="background-container">
        <div class="top-rated-container"></div>
      </div>
    `;
    $(this.#$element, ".top-rated-container").append(Logo(), SearchForm(onSubmit));
  }
  get $element() {
    return this.#$element;
  }
}
class SearchPage {
  #$target;
  #page = 1;
  #main;
  constructor($target) {
    this.#$target = $target;
    this.#main = new Main("");
  }
  getQuery() {
    const [, queryString = ""] = window.location.hash.split("?");
    const urlParams = new URLSearchParams(queryString);
    const query = urlParams.get("query");
    return query ?? "";
  }
  async init() {
    const header = new SearchHeader(this.#onSubmit);
    this.#main = new Main(`"${this.getQuery()}" 검색 결과`);
    const footer = new Footer();
    this.#$target.append(header.$element, this.#main.$element, footer.$element);
    await this.#appendMovies();
  }
  async #loadMore() {
    this.#main.removeMoreButton();
    this.#page += 1;
    await this.#appendMovies();
  }
  async #appendMovies() {
    this.#main.renderSkeletons();
    try {
      const response = await fetchSearchMovies(this.getQuery(), this.#page);
      if (response.results.length === 0) {
        this.#main.renderNothing();
        return response;
      }
      this.#main.renderMovies(response.results);
      if (this.#page < response.total_pages) {
        this.#main.renderMoreButton(() => this.#loadMore());
      }
      return response;
    } catch (error) {
      if (error instanceof TMDBError) {
        this.#main.renderError("TMDB에러입니다\n" + error.message);
        throw error;
      }
      this.#main.renderError("알수없는 에러입니다\n" + error.message);
      throw error;
    } finally {
      this.#main.removeSkeletons();
    }
  }
  #onSubmit = (query) => {
    if (query.trim()) {
      dispatchRouteChange(`/search?query=${encodeURIComponent(query)}`);
    }
  };
}
const routes = [
  { path: "/", view: HomePage },
  { path: "/search", view: SearchPage }
];
const router = () => {
  const $app = document.querySelector("#app");
  if (!$app) return;
  $app.innerHTML = "";
  const fullHash = location.hash.replace("#", "") || "/";
  const [path, queryString] = fullHash.split("?");
  const match = routes.find((route) => route.path === path);
  const View = match ? match.view : HomePage;
  new View($app).init();
};
const navigateTo = (url) => {
  location.hash = url;
};
window.addEventListener(ROUTE_CHANGE_EVENT, (e) => {
  const customEvent = e;
  const { url } = customEvent.detail;
  navigateTo(url);
});
addEventListener("load", () => {
  window.addEventListener("hashchange", router);
  router();
});
